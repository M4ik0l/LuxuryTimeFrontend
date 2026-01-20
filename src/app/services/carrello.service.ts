import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CarrelloService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/carrello'; 

  public isCartOpen = new BehaviorSubject<boolean>(false);
  private counterSubject = new BehaviorSubject<number>(0);
  counter$ = this.counterSubject.asObservable();
  
  aggiornaConteggio(email?: string) {
    this.getCarrello().subscribe(articoli => {
      const totalePezzi = articoli.reduce((acc, item) => acc + item.quantita, 0);
      this.counterSubject.next(totalePezzi);
      if (totalePezzi === 0) {
        this.rimuoviScadenzaCarrello();
      }
    });
  }

  aggiungiProdotto(emailOrIgnorato: string, idProdotto: number, quantita: number = 1): Observable<any> {
    const params = new HttpParams()
      .set('codice', idProdotto.toString())
      .set('quantita', quantita.toString());

    return this.http.post(this.apiUrl + '/add_prodotto', null, { params }).pipe(
      tap(() => {
        this.impostaScadenzaCarrello();
        this.aggiornaConteggio();
      })
    );
  }

  getCarrello(email?: string): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl + '/get_carrello');
  }

  rimuoviProdotto(emailOrIgnorato: string, codiceCarrello: number): Observable<any> {
    const params = new HttpParams()
      .set('codice', codiceCarrello.toString());

    return this.http.delete(this.apiUrl + '/elimina_tutto', { params }).pipe(
      tap(() => this.aggiornaConteggio())
    );
  }

  diminuisciProdotto(emailOrIgnorato: string, codiceCarrello: number): Observable<any> {
    const params = new HttpParams()
      .set('codice', codiceCarrello.toString());
      
    return this.http.delete(this.apiUrl + '/elimina', { params }).pipe(
      tap(() => this.aggiornaConteggio())
    );
  }

  toggleCart() {
    this.isCartOpen.next(!this.isCartOpen.value);
  }

  impostaScadenzaCarrello() {
    const scadenza = new Date().getTime() + 10 * 60 * 1000; 
    localStorage.setItem('cart_expiration_time', scadenza.toString());
  }

  rimuoviScadenzaCarrello() {
    localStorage.removeItem('cart_expiration_time');
  }
}