import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-supporto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './supporto.html',
  styleUrl: './supporto.css'
})
export class SupportoComponent {
  
  // Modello dei dati del modulo
  contatto = {
    nome: '',
    email: '',
    telefono: '',
    argomento: 'Supporto Generale', 
    messaggio: ''
  };

  messaggioInviato = false;
  errore = '';

  inviaMessaggio() {
    // Controllo base
    if (!this.contatto.nome || !this.contatto.email || !this.contatto.messaggio) {
      this.errore = 'Per favore, compila tutti i campi obbligatori (*).';
      return;
    }

    console.log("Dati pronti per l'invio mail:", this.contatto);

    // Mostriamo il messaggio di successo
    this.errore = '';
    this.messaggioInviato = true;

    // Resettiamo il form
    this.contatto = {
      nome: '',
      email: '',
      telefono: '',
      argomento: 'Supporto Generale',
      messaggio: ''
    };

    // Nascondiamo il messaggio verde dopo 5 secondi
    setTimeout(() => {
      this.messaggioInviato = false;
    }, 5000);
  }
}