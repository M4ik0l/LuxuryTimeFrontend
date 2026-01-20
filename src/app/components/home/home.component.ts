import { ChangeDetectorRef, Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProdottoService } from '../../services/prodotto.service'; 
import { Prodotto } from '../../models/prodotto.model';
import { WishlistService } from '../../services/wishlist';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink], 
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit { 
  private prodottoService = inject(ProdottoService);
  private cdr = inject(ChangeDetectorRef);
  public wishlistService = inject(WishlistService);
  
  orologiInEvidenza: Prodotto[] = [];
  isLoading = true;
  isScrolling = false;
  @ViewChild('heroVideo') videoElement!: ElementRef<HTMLVideoElement>;

  ngOnInit(): void {
    this.prodottoService.getProdotti().subscribe({
      next: (data: any) => {
        try {
          // 1. Controllo se Spring Boot ha mandato un Array o un oggetto "Page" 
          let arrayProdotti: any[] = [];
          if (Array.isArray(data)) {
            arrayProdotti = data;
          } else if (data && data.content && Array.isArray(data.content)) {
            arrayProdotti = data.content; // Lo estraiamo dall'oggetto
          }

          // Prendiamo solo i primi 8 orologi attivi e con quantità disponibile (> 0)
          const prodottiAttivi = arrayProdotti.filter(p => p.attivo !== false && p.quantita > 0);
          const orologiFiltrati = prodottiAttivi.slice(0, 8);

          this.orologiInEvidenza = orologiFiltrati.map(orologio => {
            let urlGrezzi: string[] = [];
            if (orologio.immagini) {
              if (typeof orologio.immagini === 'string') {
                urlGrezzi = [orologio.immagini];
              } else if (Array.isArray(orologio.immagini)) {
                urlGrezzi = orologio.immagini;
              }
            }
            orologio.immagini = urlGrezzi
              .join(',')
              .split(',')
              .map(url => url.trim())
              .filter(url => url.length > 5);

            return orologio;
          });

          this.isLoading = false;
          this.cdr.detectChanges(); // Forzo l'aggiornamento grafico
          
        } catch (e) {
          console.error("Errore durante la formattazione dei dati:", e);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error("Errore nella chiamata al backend (/get_all):", err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  async toggleFavorite(event: Event, orologio: Prodotto): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    
    if (orologio && orologio.id !== undefined) {
      await this.wishlistService.toggleWishlist(orologio); 
      this.cdr.detectChanges(); 
    }
  }

  scorriCarosello(elemento: HTMLElement, direzione: number) {
    if (this.isScrolling) return;
    this.isScrolling = true;

    const cardWidth = 340;

    if (direzione === 1) {
      elemento.scrollBy({ left: cardWidth, behavior: 'smooth' });

      setTimeout(() => {
        const primaCard = elemento.firstElementChild;
        if (primaCard) {
          elemento.style.scrollBehavior = 'auto';
          elemento.appendChild(primaCard);
          elemento.scrollLeft -= cardWidth;
          elemento.style.scrollBehavior = 'smooth';
        }
        this.isScrolling = false;
      }, 350);

    } else {
      const ultimaCard = elemento.lastElementChild;
      if (ultimaCard) {
        elemento.style.scrollBehavior = 'auto';
        elemento.prepend(ultimaCard);
        elemento.scrollLeft += cardWidth;
        elemento.style.scrollBehavior = 'smooth';

        setTimeout(() => {
          elemento.scrollBy({ left: -cardWidth, behavior: 'smooth' });
          
          setTimeout(() => {
            this.isScrolling = false;
          }, 350);
        }, 10);
      }
    }
  }

  ngAfterViewInit() {
    if (this.videoElement) {
      this.videoElement.nativeElement.muted = true; 

      this.videoElement.nativeElement.play().catch((errore: any) => {
        console.warn("Il browser ha bloccato l'autoplay. Motivo:", errore);
      });
    }
  }
}