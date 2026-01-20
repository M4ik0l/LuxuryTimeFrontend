import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  messaggio: string;
  tipo: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toast$ = new Subject<ToastMessage>();

  mostra(messaggio: string, tipo: 'success' | 'error' | 'info' = 'success') {
    this.toast$.next({ messaggio, tipo });
  }
}
