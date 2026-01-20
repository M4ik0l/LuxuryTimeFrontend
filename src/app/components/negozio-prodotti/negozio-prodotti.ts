import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProdottoService } from '../../services/prodotto.service';
import { Prodotto } from '../../models/prodotto.model';
import { KeycloakService } from 'keycloak-angular';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CarrelloService } from '../../services/carrello.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { WishlistService } from '../../services/wishlist';

@Component({
  selector: 'app-negozio-prodotti',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './negozio-prodotti.html', 
  styleUrl: './negozio-prodotti.css'
})
export class NegozioProdottiComponent implements OnInit {
  
  private prodottoService = inject(ProdottoService);
  private keycloak = inject(KeycloakService);
  private carrelloService = inject(CarrelloService);
  private route = inject(ActivatedRoute); 
  private router = inject(Router);
  private toastService = inject(ToastService);
  public wishlistService = inject(WishlistService);

  constructor(private cdr: ChangeDetectorRef) {}
  isFiltriAperti: boolean = false;

  prodotti: Prodotto[] = [];
  caricamento = true;
  messaggioErrore: string = '';
  soloScontati: boolean = false;
  edizioneLimitata: boolean = false;
  
  // VARIABILI RICERCA E ORDINAMENTO 
  termineRicerca: string = ''; 
  ordinamento: string = '';
  ricercaDiametro: string = ''; 

  // NUOVI FILTRI MULTIPLI
  marcheSelezionate: string[] = [];
  prezziSelezionati: string[] = [];
  generiSelezionati: string[] = [];
  movimentiSelezionati: string[] = [];
  casseSelezionate: string[] = [];
  cinturiniSelezionati: string[] = [];
  diametriSelezionati: string[] = [];
  coloriSelezionati: string[] = [];
  condizioniSelezionate: string[] = [];
  vetriSelezionati: string[] = [];
  impermeabilitaSelezionate: string[] = [];
  garanzieSelezionate: string[] = [];

  ngOnInit(): void {
    this.prodottoService.getProdotti().subscribe({
      next: (dati) => {
        this.prodotti = dati;
        this.caricamento = false;

        this.route.queryParams.subscribe(params => {
          this.termineRicerca = params['q'] || ''; 
          
          if (params['marca']) {
            const marcaUrl = params['marca'].trim().toLowerCase();
            const marcaEsatta = this.marcheDisponibili.find(m => m.trim().toLowerCase() === marcaUrl);
            
            this.marcheSelezionate = marcaEsatta ? [marcaEsatta] : [params['marca']];
            this.menuAperti['marca'] = true;
          } else {
            this.marcheSelezionate = [];
          }
          this.soloScontati = params['sconto'] === 'true';
          this.edizioneLimitata = params['edizioneLimitata'] === 'true';

          this.cdr.detectChanges();
        });

      },
      error: () => {
        this.caricamento = false;
        this.messaggioErrore = "Il server non risponde.";      
      }
    });
  }

  async aggiungiAlCarrello(idProdotto: number) {
    const isLoggedIn = await this.keycloak.isLoggedIn();
    
    if (!isLoggedIn) {
      await this.keycloak.login();
    } else {
      this.carrelloService.aggiungiProdotto('', idProdotto, 1).subscribe({
        next: () => {
          this.toastService.mostra('Orologio aggiunto al carrello con successo!', 'success');
          this.carrelloService.isCartOpen.next(true);
        },
        error: (err) => {
          console.error("Errore durante l'aggiunta al carrello:", err);
          this.toastService.mostra('Errore: impossibile aggiungere il prodotto al carrello.', 'error');
        }
      });
    }
  }

  // LOGICA DI FILTRAGGIO E ORDINAMENTO
  get diametriDisponibili(): string[] {
    let unici = [...new Set(this.prodotti.map(p => p.diametroCassa).filter(d => d != null) as string[])];
    if (this.ricercaDiametro) {
      unici = unici.filter(d => (d || '').toLowerCase().includes(this.ricercaDiametro.toLowerCase()));
    }
    return unici.sort();
  }

  get marcheDisponibili(): string[] { return [...new Set(this.prodotti.map(p => p.marca).filter(c => c != null) as string[])].sort(); }
  get coloriDisponibili(): string[] { return [...new Set(this.prodotti.map(p => p.coloreQuadrante).filter(c => c != null) as string[])].sort(); }
  get condizioniDisponibili(): string[] { return [...new Set(this.prodotti.map(p => p.condizione).filter(c => c != null) as string[])].sort(); }
  get casseDisponibili(): string[] { return [...new Set(this.prodotti.map(p => p.materialeCassa).filter(c => c != null) as string[])].sort(); }
  get cinturiniDisponibili(): string[] { return [...new Set(this.prodotti.map(p => p.materialeCinturino).filter(c => c != null) as string[])].sort(); }
  get vetriDisponibili(): string[] { return [...new Set(this.prodotti.map(p => p.tipoVetro).filter(c => c != null) as string[])].sort(); }
  get impermeabilitaDisponibili(): string[] { return [...new Set(this.prodotti.map(p => p.resistenzaAcqua).filter(c => c != null) as string[])].sort(); }
  get garanzieDisponibili(): string[] { return [...new Set(this.prodotti.map(p => p.garanzia).filter(c => c != null) as string[])].sort(); }

  private controllaFiltro(selezionati: string[], valore: string | undefined | null): boolean {
    if (selezionati.length === 0) return true;
    if (!valore) return false;
    
    const selezionatiPuliti = selezionati.map(s => s.trim().toLowerCase());
    return selezionatiPuliti.includes(valore.trim().toLowerCase());
  }
  
  toggleSelezione(lista: string[], valore: string) {
    const index = lista.indexOf(valore);
    if (index > -1) {
      lista.splice(index, 1);
    } else {
      lista.push(valore);
    }
  }
  
  toggleFavorite(event: Event, prodotto: Prodotto) {
    event.stopPropagation(); 
    event.preventDefault();
    
    this.wishlistService.toggleWishlist(prodotto);
    
    if (this.wishlistService.isInWishlist(prodotto.id!)) {
      this.toastService.mostra('Aggiunto alla tua Watchlist', 'success');
    } else {
      this.toastService.mostra('Rimosso dalla tua Watchlist', 'info');
    }
  }

  // IL MOTORE DI FILTRAGGIO AGGIORNATO
  get prodottiFiltrati() {
    let filtrati = this.prodotti.filter(p => {
      
      if (p.attivo === false) 
        return false;

      let okRicerca = true;
      if (this.termineRicerca.trim() !== '') {
        const q = this.termineRicerca.toLowerCase();
        okRicerca = (p.marca || '').toLowerCase().includes(q) || 
                    (p.modello || '').toLowerCase().includes(q) || 
                    (p.nome || '').toLowerCase().includes(q);
      }

      let okMarca = this.marcheSelezionate.length === 0 || this.marcheSelezionate.includes(p.marca!);
      let okGenere = this.generiSelezionati.length === 0 || this.generiSelezionati.includes(p.genere!);
      let okMovimento = this.movimentiSelezionati.length === 0 || this.movimentiSelezionati.includes(p.movimento!);
      let okCassa = this.casseSelezionate.length === 0 || this.casseSelezionate.includes(p.materialeCassa!);
      let okCinturino = this.cinturiniSelezionati.length === 0 || this.cinturiniSelezionati.includes(p.materialeCinturino!);
      let okDiametro = this.diametriSelezionati.length === 0 || this.diametriSelezionati.includes(p.diametroCassa!);
      let okColore = this.coloriSelezionati.length === 0 || this.coloriSelezionati.includes(p.coloreQuadrante!);
      let okCondizione = this.condizioniSelezionate.length === 0 || this.condizioniSelezionate.includes(p.condizione!);
      let okVetro = this.vetriSelezionati.length === 0 || this.vetriSelezionati.includes(p.tipoVetro!);
      let okAcqua = this.impermeabilitaSelezionate.length === 0 || this.impermeabilitaSelezionate.includes(p.resistenzaAcqua!);
      let okGaranzia = this.garanzieSelezionate.length === 0 || this.garanzieSelezionate.includes(p.garanzia!);
      let okSconto = this.soloScontati ? (p.prezzoScontato != null && p.prezzoScontato > 0) : true;
      let okLimitata = this.edizioneLimitata ? p.edizioneLimitata === true : true;

      // Prezzo
      let okPrezzo = this.prezziSelezionati.length === 0;
      if (this.prezziSelezionati.length > 0) {
        okPrezzo = this.prezziSelezionati.some(fascia => {
          if (fascia === 'sotto5') return p.prezzo < 5000;
          if (fascia === 'tra5e10') return p.prezzo >= 5000 && p.prezzo <= 10000;
          if (fascia === 'tra10e20') return p.prezzo >= 10000 && p.prezzo <= 20000;
          if (fascia === 'tra20e40') return p.prezzo >= 20000 && p.prezzo <= 40000;
          if (fascia === 'sopra40') return p.prezzo > 40000;
          return false;
        });
      }
      return okRicerca && okMarca && okPrezzo && okGenere && okMovimento && okCassa && okCinturino && okDiametro && okColore && okCondizione && okVetro && okAcqua && okGaranzia && okSconto && okLimitata;
    });

    // Ordinamento: 1° criterio -> Disponibili sempre prima degli Esauriti
    //              2° criterio -> Scelta dell'utente dal menu a tendina
    filtrati.sort((a, b) => {
      const aDisp = (a.quantita && a.quantita > 0) ? 1 : 0;
      const bDisp = (b.quantita && b.quantita > 0) ? 1 : 0;
      if (aDisp !== bDisp) {
        return bDisp - aDisp; // Metti in fondo quelli con quantita <= 0
      }

      if (this.ordinamento === 'prezzoCresc') return a.prezzo - b.prezzo;
      if (this.ordinamento === 'prezzoDecresc') return b.prezzo - a.prezzo;
      if (this.ordinamento === 'annoCresc') return a.anno - b.anno;
      if (this.ordinamento === 'annoDecresc') return b.anno - a.anno;
      if (this.ordinamento === 'ultimiAggiunti') return b.id! - a.id!;
      return 0;
    });

    return filtrati;
  }

  impostaOrdinamento(event: any) { this.ordinamento = event.target.value; }

  pulisciFiltri() {
    this.marcheSelezionate = [];
    this.prezziSelezionati = [];
    this.generiSelezionati = [];
    this.movimentiSelezionati = [];
    this.casseSelezionate = [];
    this.cinturiniSelezionati = [];
    this.diametriSelezionati = [];
    this.coloriSelezionati = [];
    this.condizioniSelezionate = [];
    this.vetriSelezionati = [];
    this.impermeabilitaSelezionate = [];
    this.garanzieSelezionate = [];
    this.ordinamento = '';
    this.ricercaDiametro = '';
    this.edizioneLimitata = false;
    
    this.router.navigate([], { 
      relativeTo: this.route, 
      queryParams: { q: null, marca: null, edizioneLimitata: null, sconto: null}, 
      queryParamsHandling: 'merge' 
    });
  }

  // STATO SIDEBAR
  menuAperti: { [key: string]: boolean } = { marca: false, prezzo: false, genere: false, movimento: false, cassa: false, cinturino: false, diametro: false, colore: false, condizione: false, vetro: false, acqua: false, garanzia: false };

  apriFiltri() { this.isFiltriAperti = true; }
  chiudiFiltri() { this.isFiltriAperti = false; }
  toggleMenu(menu: string) { this.menuAperti[menu] = !this.menuAperti[menu]; }

}