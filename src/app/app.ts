import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { HttpClient } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
import { CarrelloComponent } from "./components/carrello/carrello.component";
import { CommonModule } from '@angular/common';
import { ToastComponent } from './components/toast/toast';
import { filter } from 'rxjs';
import { routes } from './app.routes';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, NavbarComponent, CarrelloComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit{
  private keycloak = inject(KeycloakService);
  private http = inject(HttpClient);
  private router = inject(Router);
  

  async ngOnInit() {
    // Ogni volta che finisce una navigazione, torna in cima alla pagina
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      window.scrollTo(0, 0);
    });

    // Ogni volta che l'app si carica, controlliamo se l'utente è loggato
    if (await this.keycloak.isLoggedIn()) {
      // Se è loggato, chiamiamo il LoginController per assicurarmi che sia nel DB
      this.http.get('http://localhost:8080/auth/sync').subscribe({
        next: (u) => console.log('Utente allineato con MySQL:', u),
        error: (e) => console.error('Errore allineamento utente:', e)
      });
    }
  }
}


