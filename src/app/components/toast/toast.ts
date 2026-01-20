import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css'
})
export class ToastComponent implements OnInit, OnDestroy {
  private toastService = inject(ToastService);
  private subscription?: Subscription;
  
  toast: ToastMessage | null = null;
  private timeout: any;

  ngOnInit() {
    this.subscription = this.toastService.toast$.subscribe(nuovoToast => {
      this.toast = nuovoToast;
      
      if (this.timeout) clearTimeout(this.timeout);
      
      this.timeout = setTimeout(() => {
        this.chiudi();
      }, 4000);
    });
  }

  chiudi() {
    this.toast = null;
    if (this.timeout) clearTimeout(this.timeout);
  }

  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
    if (this.timeout) clearTimeout(this.timeout);
  }
}