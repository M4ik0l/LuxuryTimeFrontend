import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Utente } from '../models/utente.model';

@Injectable({
  providedIn: 'root'
})
export class UtenteService {
  
  private http = inject(HttpClient);
  
  private apiUrl = 'http://localhost:8080/utente'; 

  // Metodo per inviare un nuovo utente al database
  creaUtente(utente: Utente): Observable<Utente> {
    return this.http.post<Utente>(this.apiUrl + '/crea_utente', utente);
  }
}