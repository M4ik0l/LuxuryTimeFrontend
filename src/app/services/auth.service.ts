import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  
  private keycloakUrl = 'http://localhost:8180/realms/luxurytime-backend/protocol/openid-connect/token'; 
  private springSyncUrl = 'http://localhost:8080/auth/sync';

  login(credenziali: any) {
    const body = new HttpParams()
      .set('client_id', 'luxurytime-backend')
      .set('grant_type', 'password')           
      .set('username', credenziali.username)
      .set('password', credenziali.password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post<any>(this.keycloakUrl, body.toString(), { headers }).pipe(
      tap(response => {
        if (response && response.access_token) {
          localStorage.setItem('jwt_token', response.access_token);
          this.syncWithBackend(response.access_token);
        }
      })
    );
  }

  private syncWithBackend(token: string) {
    const authHeaders = new HttpHeaders({
      'Authorization': 'Bearer ' + token 
    });
    
    this.http.get(this.springSyncUrl, { headers: authHeaders }).subscribe({
      next: (user) => console.log('Sincronizzazione MySQL ok:', user),
      error: (err) => console.error('Errore sync MySQL:', err)
    });
  }

  logout() {
    localStorage.removeItem('jwt_token');

    const urlKeycloak = 'http://localhost:8180';
    const nomeRealm = 'luxurytime-backend';
    const nomeClient = 'luxurytime-backend';
    const redirectUri = window.location.origin;
    const logoutUrl = urlKeycloak + '/realms/' + nomeRealm + '/protocol/openid-connect/logout?client_id=' + nomeClient + '&post_logout_redirect_uri=' + encodeURIComponent(redirectUri);
    window.location.href = logoutUrl;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('jwt_token');
  }
}