import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { KeycloakBearerInterceptor } from 'keycloak-angular';
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
registerLocaleData(localeIt, 'it-IT');

function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: 'http://localhost:8180',
        realm: 'luxurytime-backend', 
        clientId: 'luxurytime-backend'    
      },
      initOptions: {
        onLoad: 'check-sso', // Controlla se già loggato senza forzare la pagina di login
        checkLoginIframe: false
      },
      // Intercetta le chiamate HTTP e ci attacca il Token JWT
      enableBearerInterceptor: true,
      bearerExcludedUrls: ['/assets']
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    KeycloakService,
    { provide: HTTP_INTERCEPTORS, useClass: KeycloakBearerInterceptor, multi: true },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService]
    }
  ]
};