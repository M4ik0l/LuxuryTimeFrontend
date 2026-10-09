# LuxuryTime — Luxury Watches E-Commerce (Frontend)

![Angular](https://img.shields.io/badge/Angular_21-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![RxJS](https://img.shields.io/badge/RxJS-B7178C?style=for-the-badge&logo=reactivex&logoColor=white)
![Keycloak](https://img.shields.io/badge/OAuth2_/_OIDC-Keycloak-4D4D4D?style=for-the-badge&logo=keycloak&logoColor=white)
![CSS3](https://img.shields.io/badge/Responsive_UI-CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

Single Page Application (SPA) sviluppata con **Angular 21.1.4** per **LuxuryTime**, boutique digitale dedicata alla compravendita di orologi di lusso (Rolex, Patek Philippe, Audemars Piguet, Omega).

**Repository Backend (Spring Boot):** [LuxuryTime-Backend](https://github.com/M4ik0l/LuxuryTime-Backend)

---

## Architettura e Funzionalità Principali

* **🛍️ Catalogo Interattivo & Ricerca Avanzata:**
    * Esplorazione del catalogo con filtri dinamici per brand, fascia di prezzo, in offerta e categoria.
    * Visualizzazione chiara delle referenze con indicazione dello stato di disponibilità in magazzino.

* **Carrello Reattivo con Prenotazione Stock:**
    * Gestione reattiva dello stato del carrello tramite **RxJS ("BehaviorSubject")** sincronizzato con il backend.
    * Controllo rigoroso delle quantità massime acquistabili in base allo stock residuo e gestione degli errori di concorrenza.

* **Sicurezza OAuth2 / JWT & Role-Based Access Control:**
    * Login, registrazione e gestione sessione integrati con **Keycloak**.
    * **HTTP Interceptor** e gestione degli header "Authorization: Bearer" per le chiamate API protette.
    * **Route Guards** per proteggere le rotte riservate agli utenti autenticati ("USER") e il pannello di amministrazione ("ADMIN").

* **Dashboard Amministratore:**
    * Interfaccia dedicata per la creazione, modifica della disponibilità/prezzo, rimozione dei prodotti dal catalogo e aggiornamento dello stato degli ordini.

* **Area Personale, Rubrica Indirizzi & Checkout:**
    * Gestione degli indirizzi di spedizione, riepilogo ordine e consultazione dello storico acquisti.

---

## Stack Tecnologico

* **Framework:** Angular 21.1.4 (Standalone Components Architecture)
* **Linguaggio:** TypeScript
* **State Management & Async:** RxJS
* **Identity Provider:** Keycloak (OAuth2 / OIDC)
* **Test Runner:** Vitest

---

## onfigurazione e Avvio Rapido

### 1. Prerequisiti
* **Node.js** e **npm**
* **Angular CLI** (versione 21+)
* Backend **LuxuryTime** attivo sulla porta "8080" e **Keycloak** attivo sulla porta "8180"

### 2. Installazione dipendenze

    npm install

### 3. Avvio del server di sviluppo

    ng serve

Una volta avviato il server, apri il browser all'indirizzo "http://localhost:4200/". L'applicazione si ricaricherà automaticamente ad ogni modifica dei file sorgente.

### 4. Build di produzione

    ng build

Compila il progetto e salva gli artefatti ottimizzati nella cartella "dist/".

---

## 👤 Autore
Sviluppato da **[M4ik0l](https://github.com/M4ik0l)** — Progetto di *Piattaforme Software per Applicazioni sul Web (PSW)*.
