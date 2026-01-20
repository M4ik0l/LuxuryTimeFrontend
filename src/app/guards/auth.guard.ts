import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

export const authGuard: CanActivateFn = async (route, state) => {
  const keycloak = inject(KeycloakService);
  const router = inject(Router);
  const isLoggedIn = await keycloak.isLoggedIn();

  if (!isLoggedIn) {
    // Se non è loggato, lo manda a Keycloak e poi lo fa tornare esattamente alla pagina che aveva richiesto
    await keycloak.login({
      redirectUri: window.location.origin + state.url
    });
    return false;
  }
  
  // Controlliamo se la rotta richiede un ruolo specifico 
  const requiredRoles = route.data['roles'];

  // Se la rotta non ha ruoli richiesti, lo facciamo passare
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // Controlliamo se l'utente ha il ruolo richiesto
  const userRoles = keycloak.getUserRoles();
  const hasRole = requiredRoles.every((role: string) => userRoles.includes(role));

  if (!hasRole) {
    // Se è loggato ma non è admin, lo rispediamo alla home invece di fargli vedere il pannello
    router.navigate(['/']);
    return false;
  }

  return true;
};