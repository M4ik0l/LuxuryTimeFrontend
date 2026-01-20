import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../services/wishlist';
import { Prodotto } from '../../models/prodotto.model';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wishlist.html',
  styleUrls: ['./wishlist.css']
})
export class WishlistComponent implements OnInit {
  public wishlistService = inject(WishlistService);
  private keycloak = inject(KeycloakService);
  private cdr = inject(ChangeDetectorRef);
  
  preferiti: Prodotto[] = [];

  // Usiamo async/await per aspettare Keycloak
  async ngOnInit() {
    const isLoggedIn = await this.keycloak.isLoggedIn();
    
    if (!isLoggedIn) {
      // Se non è loggato lo mandiamo al form, e poi lo facciamo tornare qui
      await this.keycloak.login({
        redirectUri: window.location.origin + '/wishlist'
      });
    } else {
      await this.wishlistService.inizializzaWishlist();
      // Solo se è loggato gli mostriamo i preferiti
      this.caricaPreferiti();
      this.cdr.detectChanges();
    }
  }

  caricaPreferiti() {
    this.preferiti = this.wishlistService.getWishlist();
  }

  async rimuovi(prodotto: Prodotto) {
    await this.wishlistService.toggleWishlist(prodotto);
    this.caricaPreferiti(); // Aggiorna la vista istantaneamente
    this.cdr.detectChanges();
  }
}