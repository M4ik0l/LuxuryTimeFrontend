import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CarrelloService } from '../../services/carrello.service';
import { KeycloakService } from 'keycloak-angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  private carrelloService = inject(CarrelloService);
  private keycloak = inject(KeycloakService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  articoli: any[] = [];
  totale: number = 0;
  caricamento = true;
  ordineCompletato = false;
  utenteDb: any = null;

  // Dati del Form
  spedizione = { nome: '', cognome: '', indirizzo: '', citta: '', cap: '', nazione: 'Italia', telefono: '' };
  pagamento = { titolare: '', numeroCarta: '', scadenza: '', cvv: '' };

  async ngOnInit() {
    this.carrelloService.isCartOpen.next(false);

    const isLoggedIn = await this.keycloak.isLoggedIn();
    if (isLoggedIn) {
      const profile = await this.keycloak.loadUserProfile();
      
      if (profile.firstName) this.spedizione.nome = profile.firstName;
      if (profile.lastName) this.spedizione.cognome = profile.lastName;

      this.caricaRiepilogo();
    } else {
      this.router.navigate(['/']);
    }
  }

  caricaRiepilogo() {
    this.carrelloService.getCarrello().subscribe({
      next: (dati) => {
        this.articoli = dati;
        this.calcolaTotale();
        this.caricamento = false;
        
        if (this.articoli.length === 0) {
          this.router.navigate(['/catalogo']);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Errore recupero carrello al checkout", err);
        this.caricamento = false;
      }
    });
  }

  calcolaTotale() {
    this.totale = this.articoli.reduce((acc, item) => acc + (item.prezzo * item.quantita), 0);
  }

  async confermaOrdine() {
    this.caricamento = true;
    
    try {
      const token = await this.keycloak.getToken();
      const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + token });

      // RECUPERO ID UTENTE TRAMITE TOKEN JWT
      if (!this.utenteDb || !this.utenteDb.id) {
        try {
          const syncDati = await firstValueFrom(this.http.get<any>('http://localhost:8080/auth/sync', { headers }));
          this.utenteDb = syncDati;
        } catch (err) {
          console.error("Impossibile recuperare i dati dal DB", err);
          this.toastService.mostra("Errore di connessione. Ricarica la pagina.", 'error');
          this.caricamento = false;
          this.cdr.detectChanges();
          return;
        }
      }

      // Salvataggio telefono obbligatorio
      const urlTelefono = 'http://localhost:8080/utente/aggiorna_telefono?id_utente=' + this.utenteDb.id + '&telefono=' + encodeURIComponent(this.spedizione.telefono.trim());
      
      try {
        await firstValueFrom(this.http.patch(urlTelefono, null, { headers }));
      } catch (err) {
        console.error("Errore salvataggio telefono", err);
        this.toastService.mostra("Si è verificato un errore nel salvare il numero di telefono.", 'error');
        this.caricamento = false;
        this.cdr.detectChanges();
        return;
      }

      // Calcoliamo quanti pezzi l'utente sta vedendo in questo browser
      const quantitaAttesa = this.articoli.reduce((acc, item) => acc + item.quantita, 0);

      const payloadIndirizzo = {
        citta: this.spedizione.citta,
        via: this.spedizione.indirizzo, 
        numeroCivico: 1, 
        cap: parseInt(this.spedizione.cap) || 0, 
        attivo: true
      };

      this.http.post('http://localhost:8080/ordine/add_ordine?quantitaAttesa=' + quantitaAttesa, payloadIndirizzo, { headers })
        .subscribe({
          next: (risposta) => {
            console.log("Ordine completato e salvato!", risposta);
            this.toastService.mostra("Ordine completato con successo!", 'success');
            this.caricamento = false;
            this.ordineCompletato = true; 
            this.carrelloService.aggiornaConteggio();
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error("Errore creazione ordine:", err);
            this.caricamento = false;
            this.toastService.mostra("Attenzione: il carrello è stato modificato da un'altra sessione o il prezzo è variato. Ricaricamento riepilogo...", 'error');
            this.caricaRiepilogo(); // Ricarica del carrello reale aggiornato
            this.cdr.detectChanges();
          }
        });

    } catch (e) {
      console.error("Errore grave:", e);
      this.caricamento = false;
      this.cdr.detectChanges();
    }
  }
}