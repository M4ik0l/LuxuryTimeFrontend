import { Routes } from '@angular/router';
import { NegozioProdottiComponent } from './components/negozio-prodotti/negozio-prodotti';
import { authGuard } from './guards/auth.guard';
import { AdminDashboard } from './components/admin-dashboard/admin-dashboard';
import { DettaglioProdottoComponent } from './components/dettaglio-prodotto/dettaglio-prodotto';
import { HomeComponent } from './components/home/home.component';
import { WishlistComponent } from './components/wishlist/wishlist';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { ProfiloComponent } from './components/profilo/profilo';
import { SupportoComponent } from './components/supporto/supporto';


export const routes: Routes = [

  { path: '', component: HomeComponent },

  { path: 'prodotti', component: NegozioProdottiComponent },
  { path: 'prodotto/:id', component: DettaglioProdottoComponent },

  { path: 'admin', component: AdminDashboard, canActivate: [authGuard], data: { roles: ['admin']}},

  { path: 'wishlist', component: WishlistComponent },

  { path: 'checkout', component: CheckoutComponent },

  { path: 'profilo', component: ProfiloComponent },

  { path: 'supporto', component: SupportoComponent },
  
  // Qualsiasi altra cosa scritta a caso porta alla Home Page
  { path: '**', component: HomeComponent }

];