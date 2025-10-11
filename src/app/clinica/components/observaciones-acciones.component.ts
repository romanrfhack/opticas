import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-observaciones-acciones',
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, 
    MatButtonModule, MatIconModule
  ],
  template: `
    <mat-card class="form-card">
      <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
        <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
          <mat-icon [style.color]="'#06b6d4'" class="text-primary">notes</mat-icon>
          Observaciones Finales
        </mat-card-title>
        <mat-card-subtitle class="text-gray-600">Notas adicionales y acciones</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <mat-form-field [style.color]="'#06b6d4'" appearance="fill" class="w-full custom-form-field">
          <mat-label>Observaciones y notas del examen</mat-label>
          <textarea rows="4" matInput [(ngModel)]="observaciones" placeholder="Escribe aquí cualquier observación importante..."></textarea>
          <mat-icon matPrefix class="prefix-icon">notes</mat-icon>
        </mat-form-field>

        <div class="flex gap-4 pt-4">
          <button mat-flat-button 
                  color="primary" 
                  (click)="guardar.emit()" 
                  [disabled]="!pacienteId"
                  class="save-button flex-1">
            <mat-icon>save</mat-icon>
            Guardar Borrador
          </button>
          <button mat-flat-button 
                  color="primary" 
                  (click)="abrirEnviarLab.emit()" 
                  [disabled]="!historiaId"
                  class="save-button flex-1">
            <mat-icon>send</mat-icon>
            Registrar pago / adelanto
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `
})
export class ObservacionesAccionesComponent {
  @Input() observaciones: string = '';
  @Input() pacienteId: string | null = null;
  @Input() historiaId: string | null = null;
  
  @Output() observacionesChange = new EventEmitter<string>();
  @Output() guardar = new EventEmitter<void>();
  @Output() abrirEnviarLab = new EventEmitter<void>();
}