import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profilo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profilo.html',
  styleUrl: './profilo.css'
})
export class ProfiloComponent implements OnInit {
  private http = inject(HttpClient);
  private keycloak = inject(KeycloakService);
  private cdr = inject(ChangeDetectorRef); 

  utente: any = { nome: ' ', cognome: ' ', email: 'Caricamento...' };
  nuovoTelefono: string = '';

  tabAttivo: string = 'dati';
  messaggio: string = '';
  errore: string = '';

  // STATO ORDINI
  ordini: any[] = [];
  caricamentoOrdini: boolean = false;

  // STATO INDIRIZZI
  indirizzi: any[] = [];
  caricamentoIndirizzi: boolean = false;

  async ngOnInit() {
    if (await this.keycloak.isLoggedIn()) {
      await this.caricaDatiUtente();
    }
  }

  async caricaDatiUtente() {
    try {
      const token = await this.keycloak.getToken();
      const headers = new HttpHeaders().set('Authorization', 'Bearer ' + token);

      this.http.get('http://localhost:8080/auth/sync', { headers }).subscribe({
        next: (datiUtente: any) => {
          this.utente = datiUtente;
          this.nuovoTelefono = datiUtente.numeroTelefonico || datiUtente.numero_telefonico || '';
          this.cdr.detectChanges(); 
        },
        error: (err) => {
          console.error('Errore dal backend:', err);
          this.utente.email = "Errore di connessione";
          this.cdr.detectChanges();
        }
      });
    } catch (e) {
      console.error("Errore nel recupero del token:", e);
    }
  }

  cambiaTab(tab: string) {
    this.tabAttivo = tab;
    this.messaggio = ''; 
    this.errore = '';

    if (tab === 'ordini' && this.ordini.length === 0) {
      this.caricaMieiOrdini();
    } else if (tab === 'indirizzi' && this.indirizzi.length === 0) {
      this.caricaMieiIndirizzi();
    }
  }

  // LOGICA ORDINI 
  async caricaMieiOrdini() {
    this.caricamentoOrdini = true;
    this.cdr.detectChanges();

    try {
      const token = await this.keycloak.getToken();
      const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + token });
      const url = 'http://localhost:8080/ordine/get_acquisti';

      this.http.get<any[]>(url, { headers }).subscribe({
        next: (ordiniDalDb: any[]) => {
          this.ordini = ordiniDalDb.map(o => ({
            ...o,
            totale: o.carrello ? o.carrello.reduce((acc: number, item: any) => acc + (item.prezzo * item.quantita), 0) : 0,
            indirizzo: o.spedizione ? o.spedizione : { via: 'N/D', citta: '' },
            prodotti: o.carrello ? o.carrello.map((item: any) => ({
              marca: item.prodotto.marca,
              modello: item.prodotto.nome,
              quantita: item.quantita,
              prezzo: item.prezzo,
              immagine: (item.prodotto.immagini && item.prodotto.immagini.length > 0) 
                         ? item.prodotto.immagini[0] 
                         : 'assets/no-foto.png'
            })) : [],
            stato: o.stato || 'Confermato'
          }));
          
          this.caricamentoOrdini = false;
          this.cdr.detectChanges();
        },
        error: (err) => { 
          console.error("Errore caricamento ordini:", err);
          this.caricamentoOrdini = false; 
          this.cdr.detectChanges(); 
        }
      });
    } catch (e) { 
      this.caricamentoOrdini = false; 
    }
  }

  // LOGICA INDIRIZZI 
  async caricaMieiIndirizzi() {
    this.caricamentoIndirizzi = true;
    try {
      const token = await this.keycloak.getToken();
      const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + token });
      const url = 'http://localhost:8080/utente/indirizzi';

      this.http.get<any[]>(url, { headers }).subscribe({
        next: (data) => {
          const mapIndirizzi = new Map();
          data.forEach(addr => {
            const chiaveUnica = (addr.via + addr.numeroCivico + addr.citta).toLowerCase().replace(/\s/g, '');
            if (!mapIndirizzi.has(chiaveUnica)) {
              mapIndirizzi.set(chiaveUnica, addr);
            }
          });

          this.indirizzi = Array.from(mapIndirizzi.values());
          this.caricamentoIndirizzi = false;
          this.cdr.detectChanges();
        },
        error: (err) => { 
          console.error("Errore caricamento indirizzi:", err);
          this.caricamentoIndirizzi = false; 
        }
      });
    } catch (e) { this.caricamentoIndirizzi = false; }
  }

  // LOGICA TELEFONO E LOGOUT
  async salvaTelefono() {
    if (!this.nuovoTelefono || this.nuovoTelefono.trim() === '') {
      this.errore = 'Inserisci un numero di telefono valido.';
      this.messaggio = '';
      return;
    }

    try {
      const token = await this.keycloak.getToken();
      const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + token });
      const url = 'http://localhost:8080/utente/aggiorna_telefono?telefono=' + encodeURIComponent(this.nuovoTelefono.trim());

      this.http.patch(url, null, { headers }).subscribe({
        next: (utenteAggiornato: any) => {
          this.errore = '';
          this.messaggio = 'Numero di telefono aggiornato!';
          this.utente = utenteAggiornato;
          this.cdr.detectChanges();
          setTimeout(() => { this.messaggio = ''; this.cdr.detectChanges(); }, 4000);
        },
        error: () => {
          this.errore = "Impossibile aggiornare il telefono.";
          this.messaggio = '';
          this.cdr.detectChanges();
        }
      });
    } catch (e) { console.error(e); }
  }

  logout() {
    this.keycloak.logout(window.location.origin);
  }
}