import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Prodotto } from '../../models/prodotto.model';
import { ProdottoService } from '../../services/prodotto.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], 
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {
  private prodottoService = inject(ProdottoService);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private keycloak = inject(KeycloakService);
  private toastService = inject(ToastService);

  // GESTIONE TAB
  tabAttivo: 'prodotti' | 'utenti' | 'ordini' = 'prodotti';

  // STATO PRODOTTI 
  prodotti: Prodotto[] = [];
  caricamentoProdotti = true;
  messaggioProdotto = '';
  erroreProdotto = '';
  isModifica = false; 
  mostraForm = false;
  ordineSelezionato: any = null;
  nuovoProdotto: any = this.getOggettoVuoto();
  termineRicercaProdotti: string = '';

  // STATO UTENTI 
  utenti: any[] = [];
  caricamentoUtenti = true;
  messaggioUtente = '';
  erroreUtente = '';
  mostraFormUtente = false;
  utenteInModifica: any = {};
  termineRicercaUtenti: string = '';

  // STATO ORDINI
  ordiniTutti: any[] = [];
  caricamentoOrdini = true;
  termineRicercaOrdini: string = '';

  ngOnInit() {
    this.caricaCatalogo(); 
    this.caricaUtenti();
    this.caricaTuttiOrdini();
  }

  cambiaTab(tab: 'prodotti' | 'utenti' | 'ordini') {
    this.tabAttivo = tab;
    this.messaggioProdotto = ''; 
    this.erroreProdotto = '';
    this.messaggioUtente = ''; 
    this.erroreUtente = '';
    this.mostraForm = false;
    this.mostraFormUtente = false; 
  }

  // LOGICA UTENTI
  async caricaUtenti() {
    this.caricamentoUtenti = true;
    try {
      const token = await this.keycloak.getToken();
      const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + token });

      this.http.get<any[]>('http://localhost:8080/utente/tutti', { headers }).subscribe({
        next: (dati) => {
          this.utenti = dati;
          this.caricamentoUtenti = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.erroreUtente = "Errore nel caricamento utenti";
          this.caricamentoUtenti = false;
          this.cdr.detectChanges();
        }
      });
    } catch (e) { console.error(e); }
  }

  selezionaUtentePerModifica(u: any) {
    this.messaggioUtente = '';
    this.erroreUtente = '';
    this.mostraFormUtente = true;
    this.utenteInModifica = { ...u };
  }

  async salvaUtente() {
    this.messaggioUtente = '';
    this.erroreUtente = '';
    try {
      const token = await this.keycloak.getToken();
      const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + token });

      this.http.put<any>('http://localhost:8080/utente/aggiorna', this.utenteInModifica, { headers }).subscribe({
        next: (utenteAggiornato) => {
          const index = this.utenti.findIndex(user => user.id === utenteAggiornato.id);
          if (index !== -1) {
            this.utenti[index] = utenteAggiornato;
          }
          this.messaggioUtente = 'I dati di ' + this.utenteInModifica.nome + ' sono stati aggiornati.';
          this.mostraFormUtente = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.erroreUtente = "Errore durante l'aggiornamento dell'utente.";
          this.cdr.detectChanges();
        }
      });
    } catch (e) { console.error(e); }
  }

  annullaModificaUtente() {
    this.mostraFormUtente = false;
    this.utenteInModifica = {};
  }

  async eliminaUtente(u: any) {
    if (confirm("Sei sicuro di voler eliminare l'utente " + u.nome + " " + u.cognome + "?")) {
      const token = await this.keycloak.getToken();
      const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + token });

      this.http.delete('http://localhost:8080/utente/elimina_utente?id_utente=' + u.id, { headers }).subscribe({
        next: () => {
          this.messaggioUtente = "Utente eliminato!";
          this.caricaUtenti();
        }
      });
    }
  }

  get utentiFiltratiAdmin() {
    if (!this.termineRicercaUtenti) return this.utenti;
    const q = this.termineRicercaUtenti.toLowerCase().trim();
    return this.utenti.filter(u => 
      (u.id && u.id.toString().includes(q)) || 
      (u.nome && u.nome.toLowerCase().includes(q)) || 
      (u.cognome && u.cognome.toLowerCase().includes(q)) || 
      (u.email && u.email.toLowerCase().includes(q))
    );
  }

  // LOGICA PRODOTTI
  caricaCatalogo() {
    this.caricamentoProdotti = true;
    this.prodottoService.getProdotti().subscribe({
      next: (dati) => {
        this.prodotti = dati;
        this.caricamentoProdotti = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Errore caricamento:", err);
        this.caricamentoProdotti = false;
        this.cdr.detectChanges();
      }
    });
  }

  eliminaProdotto(id: number, nome: string) {
    if (confirm(`Sicuro di voler eliminare l'orologio "${nome}"?`)) {
      this.prodottoService.eliminaProdotto(id).subscribe({
        next: () => {
          this.messaggioProdotto = `Orologio eliminato con successo.`;
          this.caricaCatalogo(); 
        },
        error: () => this.erroreProdotto = "Impossibile eliminare l'orologio."
      });
    }
  }

  selezionaPerModifica(p: Prodotto) {
    this.messaggioProdotto = '';
    this.erroreProdotto = '';
    this.isModifica = true; 
    this.mostraForm = true;
    this.nuovoProdotto = JSON.parse(JSON.stringify(p)); 
    if (!this.nuovoProdotto.immagini || this.nuovoProdotto.immagini.length === 0) {
      this.nuovoProdotto.immagini = [''];
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleVisibilita(p: Prodotto) {
    this.prodottoService.toggleVisibilita(p.id!).subscribe({
      next: () => {
        p.attivo = !p.attivo; 
        this.cdr.detectChanges();
        this.toastService.mostra(p.attivo ? 'Orologio di nuovo visibile!' : 'Orologio nascosto dal negozio.', 'info');
      },
      error: () => this.toastService.mostra("Errore durante l'aggiornamento.", 'error')
    });
  }

  aggiungiImmagine() {
    if (!this.nuovoProdotto.immagini) this.nuovoProdotto.immagini = [];
    this.nuovoProdotto.immagini.push('');
  }

  rimuoviImmagine(index: number) { this.nuovoProdotto.immagini.splice(index, 1); }
  trackByIndex(index: number, obj: any): any { return index; }

  salvaProdotto() {
    this.messaggioProdotto = ''; this.erroreProdotto = '';
    let immaginiPulite: string[] = [];
    if (this.nuovoProdotto.immagini && Array.isArray(this.nuovoProdotto.immagini)) {
      immaginiPulite = this.nuovoProdotto.immagini.filter((img: string) => img.trim() !== '');
    }
    this.nuovoProdotto.immagini = immaginiPulite;

    if (this.isModifica) {
      this.prodottoService.aggiornaProdotto(this.nuovoProdotto).subscribe({
        next: () => { this.messaggioProdotto = 'Aggiornato con successo!'; this.resetForm(); this.caricaCatalogo(); },
        error: this.gestisciErroreProdotto
      });
    } else {
      this.prodottoService.aggiungiProdotto(this.nuovoProdotto).subscribe({
        next: () => { this.messaggioProdotto = 'Aggiunto al catalogo!'; this.resetForm(); this.caricaCatalogo(); },
        error: this.gestisciErroreProdotto
      });
    }
  }

  resetForm() {
    this.isModifica = false;
    this.nuovoProdotto = this.getOggettoVuoto();
    this.mostraForm = false;
  }

  gestisciErroreProdotto = (err: any) => {
    if (err.status === 403) this.erroreProdotto = 'Accesso Negato.';
    else this.erroreProdotto = 'Errore di comunicazione col server.';
  }

  getOggettoVuoto() {
    return {
      nome: '', marca: '', modello: '', prezzo: null, prezzoScontato: null, quantita: 1,
      anno: new Date().getFullYear(), descrizione: '', immagini: [''],
      edizioneLimitata: false, genere: '', movimento: '', materialeCassa: '', 
      materialeCinturino: '', diametroCassa: '', coloreQuadrante: '', 
      tipoVetro: '', resistenzaAcqua: '', circonferenzaPolso: '', 
      condizione: '', garanzia: '', collezione: '', riferimento: '', 
      certificato: '', chiusura: ''
    };
  }
  
  get prodottiFiltratiAdmin() {
    if (!this.termineRicercaProdotti) return this.prodotti;
    const q = this.termineRicercaProdotti.toLowerCase().trim();
    return this.prodotti.filter(p => 
      (p.id && p.id.toString().includes(q)) || 
      (p.marca && p.marca.toLowerCase().includes(q)) || 
      (p.nome && p.nome.toLowerCase().includes(q))
    );
  }

  // LOGICA ORDINI (Admin)
  async caricaTuttiOrdini() {
    this.caricamentoOrdini = true;
    try {
      const token = await this.keycloak.getToken();
      const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + token });

      this.http.get<any[]>('http://localhost:8080/ordine/tutti', { headers }).subscribe({
        next: (dati) => {
          this.ordiniTutti = dati.map(o => ({
            ...o,
            totale: o.carrello ? o.carrello.reduce((acc: number, item: any) => acc + (item.prezzo * item.quantita), 0) : 0,
            clienteNome: o.acquirente ? o.acquirente.nome + ' ' + o.acquirente.cognome : 'Utente rimosso',
            via: o.spedizione ? o.spedizione.via + ', ' + o.spedizione.citta : 'N/D',
            prodotti: o.carrello ? o.carrello.map((item: any) => ({
              id: item.prodotto.id,
              marca: item.prodotto.marca,
              modello: item.prodotto.nome,
              quantita: item.quantita,
              prezzo: item.prezzo,
              immagine: (item.prodotto.immagini && item.prodotto.immagini.length > 0) 
                        ? item.prodotto.immagini[0] 
                        : 'assets/no-foto.png'
            })) : []
          }));
          this.caricamentoOrdini = false;
          this.cdr.detectChanges();
        },
        error: () => { this.caricamentoOrdini = false; this.cdr.detectChanges(); }
      });
    } catch (e) { this.caricamentoOrdini = false; }
  }

  async eliminaOrdineAdmin(id: number) {
    if (confirm("Sei sicuro di voler cancellare l'ordine #" + id + "?")) {
      try {
        const token = await this.keycloak.getToken();
        const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + token });
        this.http.delete('http://localhost:8080/ordine/elimina?id=' + id, { headers }).subscribe({
          next: () => {
            this.ordiniTutti = this.ordiniTutti.filter(o => o.id !== id);
            this.toastService.mostra('Ordine eliminato con successo!', 'success');
            this.cdr.detectChanges();
          },
          error: () => this.toastService.mostra("Errore durante l'eliminazione dell'ordine.", 'error')
        });
      } catch (e) { console.error(e); }
    }
  }

  apriDettaglioOrdine(ordine: any) {
    if (this.ordineSelezionato && this.ordineSelezionato.id === ordine.id) {
      this.ordineSelezionato = null;
    } else {
      this.ordineSelezionato = ordine;
    }
    this.cdr.detectChanges();
  }

  async cambiaStato(ordineId: number, nuovoStato: string) {
    try {
      const token = await this.keycloak.getToken();
      const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + token });
      const url = 'http://localhost:8080/ordine/aggiorna_stato?id=' + ordineId + '&stato=' + encodeURIComponent(nuovoStato);

      this.http.patch(url, null, { headers }).subscribe({
        next: () => {
          this.toastService.mostra('Stato aggiornato con successo!', 'success');
          this.caricaTuttiOrdini();
        }
      });
    } catch (e) { console.error(e); }
  }

  get ordiniFiltratiAdmin() {
    if (!this.termineRicercaOrdini) return this.ordiniTutti;
    const q = this.termineRicercaOrdini.toLowerCase().trim();
    return this.ordiniTutti.filter(o => 
      (o.id && o.id.toString().includes(q)) || 
      (o.clienteNome && o.clienteNome.toLowerCase().includes(q))
    );
  }
}