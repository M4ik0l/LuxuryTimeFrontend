import { inject, Injectable } from '@angular/core';
import { Prodotto } from '../models/prodotto.model'; 
import { KeycloakService } from 'keycloak-angular';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private keycloak = inject(KeycloakService);
  private wishlist: Prodotto[] = [];
  private storageKey = 'wishlist_guest';

  constructor() {
    this.inizializzaWishlist();
  }

  //Metodo che determina quale chiave di LocalStorage usare in base all'utente loggato
  async inizializzaWishlist(): Promise<void> {
    try {
      const loggedIn = await this.keycloak.isLoggedIn();
      if (loggedIn) {
        const profile = await this.keycloak.loadUserProfile();
        // Creiamo la chiave personalizzata: wishlist_nome@email.it
        this.storageKey = 'wishlist' + profile.email;
      } else {
        this.storageKey = 'wishlist_guest';
      }
    } catch (e) {
      console.error("Errore durante l'inizializzazione della wishlist:", e);
      this.storageKey = 'wishlist_guest';
    }

    // Una volta stabilita la chiave, carichiamo i dati
    const savedWishlist = localStorage.getItem(this.storageKey);
    this.wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
  }


  getWishlist(): Prodotto[] {
    return this.wishlist;
  }

  async toggleWishlist(product: Prodotto) {
    await this.inizializzaWishlist();
    const index = this.wishlist.findIndex(item => item.id === product.id);
    if (index > -1) {
      this.wishlist.splice(index, 1);
    } else {
      this.wishlist.push(product);
    }
    this.saveToStorage();
  }

  isInWishlist(productId: number | undefined): boolean {
    if (!productId) return false; 
    return this.wishlist.some(item => item.id === productId);
  }

  private saveToStorage() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.wishlist));  
  }

  svuotaMemoriaLocale() {
    this.wishlist = [];
    this.storageKey = 'wishlist_guest';
  }
}