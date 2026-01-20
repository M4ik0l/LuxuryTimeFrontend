import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core'; // <-- 1. Aggiunto ChangeDetectorRef
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { ProdottoService } from '../../services/prodotto.service';
import { Prodotto } from '../../models/prodotto.model';
import { KeycloakService } from 'keycloak-angular';
import { CarrelloService } from '../../services/carrello.service';
import { WishlistService } from '../../services/wishlist';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-dettaglio-prodotto',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dettaglio-prodotto.html',
  styleUrls: ['./dettaglio-prodotto.css']
})
export class DettaglioProdottoComponent implements OnInit {
  
  private keycloak = inject(KeycloakService);
  private carrelloService = inject(CarrelloService);
  private cdr = inject(ChangeDetectorRef);
  public wishlistService = inject(WishlistService);
  private toastService = inject(ToastService);

  prodotto!: Prodotto; 
  isLoading = true;

  immagineSelezionata: string = '';
  quantitaSelezionata: number = 1;
  specifiche: any = {};

  constructor(
    private route: ActivatedRoute,
    private prodottoService: ProdottoService
  ) {}

  ngOnInit(): void {
    const idString = this.route.snapshot.paramMap.get('id');
    if (idString) {
      this.isLoading = true;
      
      this.prodottoService.getProdottoById(Number(idString)).subscribe({
        next: (data: any) => {
          this.prodotto = data;
          
          // gestione immagini
          let urlGrezzi: string[] = [];
          
          if (data.immagini) {
            if (typeof data.immagini === 'string') {
              urlGrezzi = [data.immagini];
            } else if (Array.isArray(data.immagini)) {
              urlGrezzi = data.immagini;
            }
          }
          
          // Uniamo e puliamo le stringhe
          this.prodotto.immagini = urlGrezzi
            .join(',')
            .split(',')
            .map(url => url.trim())
            .filter(url => url.length > 5);
            
          // Setup immagine principale
          if (this.prodotto.immagini.length > 0) {
            this.immagineSelezionata = this.prodotto.immagini[0];
          } else {
            this.immagineSelezionata = 'assets/no-foto.png';
          }
          // Fine gestione immagini

          this.specifiche = this.estraiSpecifiche(data.descrizione);
          this.isLoading = false;

          // Diciamo ad Angular che abbiamo caricato il prodotto e di aggiornare la grafica
          this.cdr.detectChanges(); 
        },
        error: (err) => { 
          console.error("Errore nel caricamento del prodotto:", err);
          this.isLoading = false; 
          this.cdr.detectChanges(); // Aggiorniamo anche in caso di errore
        }
      });
    }
  }

  incrementa() {
    if (this.quantitaSelezionata < this.prodotto.quantita) {
      this.quantitaSelezionata++;
    }
  }

  decrementa() {
    if (this.quantitaSelezionata > 1) {
      this.quantitaSelezionata--;
    }
  }

  cambiaImmagine(url: string) {
    this.immagineSelezionata = url;
  }

  async aggiungiAlCarrello() {
    const isLoggedIn = await this.keycloak.isLoggedIn();

    if (!isLoggedIn) {
      await this.keycloak.login();
    } else {
      const userProfile = await this.keycloak.loadUserProfile();
      const emailUtente = userProfile.email;

      if (emailUtente) {
        this.carrelloService.aggiungiProdotto(emailUtente, this.prodotto.id!, this.quantitaSelezionata).subscribe({
          next: (res) => {
            this.toastService.mostra('Orologio aggiunto al carrello!', 'success');
            this.carrelloService.isCartOpen.next(true);
          },
          error: (err) => {
            console.error("Errore nell'aggiunta:", err);
            this.toastService.mostra('Impossibile aggiungere il prodotto. Controlla la disponibilità.', 'error');
          }
        });
      } else {
        this.toastService.mostra("Errore: Impossibile recuperare l'email dell'utente.", 'error');
      }
    }
  }

  async toggleFavorite() {
    if (this.prodotto) {
      await this.wishlistService.toggleWishlist(this.prodotto); 
      this.cdr.detectChanges();
    }
  }

  estraiSpecifiche(testo: string) {
    const res: any = {};
    if (!testo || typeof testo !== 'string') return res;

    const righe = testo.split('\n');

    righe.forEach(riga => {
        const parti = riga.split(':');
        if (parti.length >= 2) {
            const chiave = parti[0].trim().toLowerCase();
            const valore = parti.slice(1).join(':').trim();

            if (chiave.includes('marca')) res.marca = valore;
            if (chiave.includes('modello')) res.modello = valore;
            if (chiave.includes('anno')) res.anno = valore;
            if (chiave.includes('edizione limitata')) res.limitata = valore;
            if (chiave.includes('genere')) res.genere = valore;
            if (chiave.includes('movimento')) res.movimento = valore;
            if (chiave.includes('materiale cassa')) res.matCassa = valore;
            if (chiave.includes('materiale cinturino')) res.matCinturino = valore;
            if (chiave.includes('diametro')) res.diametro = valore;
            if (chiave.includes('colore quadrante')) res.quadrante = valore;
            if (chiave.includes('vetro')) res.vetro = valore;
            if (chiave.includes('resistenza')) res.impermeabilita = valore;
            if (chiave.includes('circonferenza')) res.polso = valore;
            if (chiave.includes('riferimento')) res.riferimento = valore;
            if (chiave.includes('collezione')) res.collezione = valore;
            if (chiave.includes('condizione')) res.condizione = valore;
            if (chiave.includes('garanzia')) res.garanzia = valore;
            if (chiave.includes('certificato')) res.certificato = valore;
            if (chiave.includes('chiusura')) res.chiusura = valore;
          }
    });
    return res;
  }
}