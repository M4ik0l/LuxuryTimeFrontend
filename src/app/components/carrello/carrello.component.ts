import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; 
import { CarrelloService } from '../../services/carrello.service';
import { KeycloakService } from 'keycloak-angular';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-carrello',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './carrello.component.html',
  styleUrl: './carrello.component.css'
})
export class CarrelloComponent implements OnInit, OnDestroy {
  private carrelloService = inject(CarrelloService);
  private keycloak = inject(KeycloakService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  articoli: any[] = [];
  totale: number = 0;
  caricamento = true;
  aggiornamentoInCorso = false; // Blocca i pulsanti durante le chiamate HTTP per evitare Race Conditions
  isOpen = false; 

  // VARIABILI TEMPORALI
  minuti: number = 10; 
  secondi: number = 0;
  intervalloTimer: any;
  carrelloScaduto: boolean = false;

  async ngOnInit() {
    this.carrelloService.isCartOpen.subscribe(async (stato) => {
      this.isOpen = stato;

      if (stato === true) {
        const isLoggedIn = await this.keycloak.isLoggedIn();
        if (isLoggedIn) {
          this.caricamento = true; 
          this.caricaCarrello(); 
        }
      } else {
        this.fermaTimer();
      }
      this.cdr.detectChanges(); 
    });

    const isLoggedIn = await this.keycloak.isLoggedIn();
    if (isLoggedIn) {
      this.caricaCarrello();
    } else {
      this.caricamento = false; 
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    this.fermaTimer();
  }

  avviaTimer() {
    this.fermaTimer(); 
    this.carrelloScaduto = false;

    this.intervalloTimer = setInterval(() => {
      const scadenzaStr = localStorage.getItem('cart_expiration_time');
      
      if (!scadenzaStr) {
        this.fermaTimer();
        return;
      }

      const scadenza = parseInt(scadenzaStr, 10);
      const oraAttuale = new Date().getTime();
      const tempoRimanente = scadenza - oraAttuale;

      if (tempoRimanente <= 0) {
        this.minuti = 0;
        this.secondi = 0;
        this.gestisciScadenzaCarrello();
      } else {
        this.minuti = Math.floor((tempoRimanente % (1000 * 60 * 60)) / (1000 * 60));
        this.secondi = Math.floor((tempoRimanente % (1000 * 60)) / 1000);
      }
      this.cdr.detectChanges(); 
    }, 1000);
  }

  fermaTimer() {
    if (this.intervalloTimer) {
      clearInterval(this.intervalloTimer);
    }
  }

  gestisciScadenzaCarrello() {
    this.fermaTimer();
    this.carrelloScaduto = true;
    this.carrelloService.rimuoviScadenzaCarrello();
    this.toastService.mostra("Il tempo è scaduto. Gli articoli sono stati rimessi in inventario.", 'info');
  }

  chiudiCarrello() {
    this.carrelloService.isCartOpen.next(false);
  }

  caricaCarrello() {
    this.carrelloService.getCarrello().subscribe({
      next: (dati) => {
        this.articoli = dati;
        this.calcolaTotale();
        this.caricamento = false;
        this.aggiornamentoInCorso = false;
        this.carrelloService.aggiornaConteggio();
        
        if (this.articoli.length > 0 && this.isOpen) {
          if (!localStorage.getItem('cart_expiration_time')) {
            this.carrelloService.impostaScadenzaCarrello();
          }
          this.avviaTimer();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Errore carrello:', err);
        this.caricamento = false;
        this.aggiornamentoInCorso = false;
        this.cdr.detectChanges();
      }
    });
  }

  calcolaTotale() {
    this.totale = this.articoli.reduce((acc, item) => acc + (item.prezzo * item.quantita), 0);
  }

  rimuovi(idProdottoInCarrello: number) {
    if (this.aggiornamentoInCorso) return;
    this.aggiornamentoInCorso = true;
    this.cdr.detectChanges();

    this.carrelloService.rimuoviProdotto('', idProdottoInCarrello).subscribe({
      next: () => this.caricaCarrello(),
      error: (err) => {
        console.error("Errore nella rimozione:", err);
        this.aggiornamentoInCorso = false;
        this.cdr.detectChanges();
      }
    });
  }

  cambiaQuantita(item: any, variazione: number) {
    if (this.carrelloScaduto || this.aggiornamentoInCorso) return; 

    this.aggiornamentoInCorso = true;
    this.cdr.detectChanges();

    if (variazione === 1) {
      this.carrelloService.aggiungiProdotto('', item.prodotto.id, 1).subscribe({
        next: () => this.caricaCarrello(),
        error: (err) => {
          console.error("Errore nell'aggiunta:", err);
          this.aggiornamentoInCorso = false;
          this.cdr.detectChanges();
        }
      });
    } else if (variazione === -1) {
      this.carrelloService.diminuisciProdotto('', item.id).subscribe({
        next: () => this.caricaCarrello(),
        error: (err) => {
          console.error("Errore nella rimozione:", err);
          this.aggiornamentoInCorso = false;
          this.cdr.detectChanges();
        }
      });
    }
  }
}