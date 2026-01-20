import { Component, OnInit, inject, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';import { CommonModule } from '@angular/common';
import { RouterModule, Router} from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { CarrelloService } from '../../services/carrello.service';
import { WishlistService } from '../../services/wishlist';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.html', 
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit {
  public keycloak = inject(KeycloakService);
  public carrelloService = inject(CarrelloService);
  private cdr = inject(ChangeDetectorRef); 
  public wishlistService = inject(WishlistService);
  private router = inject(Router);

  isLoggedIn = false;
  nomeUtente = '';
  quantitaCarrello = 0;
  testoRicerca: string = '';
  @Output() apriLogin = new EventEmitter<void>();
  isMenuOpen = false;


  async ngOnInit() {
    try {
      this.isLoggedIn = await this.keycloak.isLoggedIn();
      
      if (this.isLoggedIn) {
        const userProfile = await this.keycloak.loadUserProfile();
        this.nomeUtente = this.keycloak.getUsername();    
        
        if (userProfile.email) {
            this.carrelloService.aggiornaConteggio(userProfile.email);
        }
      }

      this.cdr.detectChanges();

    } catch(errore) {
      console.warn('Profilo utente non ancora disponibile:', errore);
      this.isLoggedIn = false;
      this.cdr.detectChanges(); 
    }

    this.carrelloService.counter$.subscribe(count => {
      this.quantitaCarrello = count;
      this.cdr.detectChanges(); 
    });
  }

  login() {
    this.keycloak.login({
      redirectUri: window.location.href 
    });
  }
  
  async logout() {
    this.wishlistService.svuotaMemoriaLocale();
    await this.keycloak.logout(window.location.origin);
  }

  eseguiRicerca() {
    if (this.testoRicerca.trim()) {
      this.router.navigate(['/prodotti'], { queryParams: { q: this.testoRicerca.trim() } });
    } else {
      this.router.navigate(['/prodotti']);
    }
  }
  
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  chiudiMenu() {
    this.isMenuOpen = false;
  }

}