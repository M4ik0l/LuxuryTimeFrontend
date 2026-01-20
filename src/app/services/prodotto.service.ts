import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Prodotto } from '../models/prodotto.model';

@Injectable({
  providedIn: 'root'
})
export class ProdottoService {
  
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/prodotto'; 

  // Metodo per ottenere tutti i prodotti dal database
  getTuttiIProdotti(): Observable<Prodotto[]> {
    return this.http.get<Prodotto[]>(this.apiUrl + '/get_paginate'); 
  }

  public getProdottoById(id: number): Observable<Prodotto> {
    return this.http.get<Prodotto>(this.apiUrl + '/get/' + id);
  }

  aggiungiProdotto(nuovoProdotto: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/add', nuovoProdotto);
  }

  aggiornaProdotto(prodotto: Prodotto): Observable<Prodotto> {
    return this.http.put<Prodotto>(this.apiUrl + '/update', prodotto);
  }

  eliminaProdotto(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.delete(this.apiUrl + '/delete', { params });
  }

  getProdotti(): Observable<Prodotto[]> {
    return this.http.get<Prodotto[]>(this.apiUrl + '/get_all');
  }

  toggleVisibilita(id: number): Observable<any> {
    return this.http.put(this.apiUrl + '/' + id + '/toggle-visibilita', {});
  }
}