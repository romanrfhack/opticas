import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-rx-form',
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatIconModule
  ],
  template: `
    <mat-card class="form-card">
      <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
        <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
          <mat-icon [style.color]="'#06b6d4'" class="text-primary">healing</mat-icon>
          R.X. - Prescripción
        </mat-card-title>
        <mat-card-subtitle class="text-gray-600">
          Valores de lejos y cerca • Los valores de cerca se calculan automáticamente
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <!-- Resumen de estado -->
        <div *ngIf="hasAnyError()" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center gap-2 text-red-700">
            <mat-icon class="text-red-500 text-sm">error_outline</mat-icon>
            <span class="text-sm font-medium">Corrige los valores fuera de rango:</span>
          </div>
        </div>

        <div class="overflow-auto rounded-lg border border-gray-200">
          <table class="w-full text-sm bg-white">
            <thead class="bg-gray-50">
              <tr class="text-left text-gray-700 text-xs">
                <th class="w-20 py-2 px-2 font-medium">Distancia</th>
                <th class="w-12 py-2 px-2 font-medium">Ojo</th>
                <th class="w-16 py-2 px-2 font-medium">Esf.</th>
                <th class="w-16 py-2 px-2 font-medium">Cyl.</th>
                <th class="w-14 py-2 px-2 font-medium">Eje</th>
                <th class="w-16 py-2 px-2 font-medium">ADD</th>
                <th class="w-16 py-2 px-2 font-medium">D.I.P.</th>
                <th class="w-20 py-2 px-2 font-medium">ALT. OBLEA</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of filasRx; let i = index" 
                  [class.bg-gray-50]="i % 2 === 0"
                  class="transition-colors hover:bg-blue-50 text-xs">
                
                <!-- Distancia -->
                <td class="py-2 px-2 font-medium">
                  <span class="text-xs">{{ r.dist }}</span>
                </td>
                
                <!-- Ojo -->
                <td class="py-2 px-2 font-medium">
                  <span class="text-xs">{{ r.ojo }}</span>
                </td>
                
                <!-- Esf -->
                <td class="py-2 px-2">
                  <input class="rx-input compact-input" 
                         type="number" 
                         step="0.25"
                         [(ngModel)]="r.esf" 
                         (ngModelChange)="onEsfChange(r, $event)"
                         [class.error]="hasError(r, 'esf')"
                         placeholder="0.00"
                         title="Esfera: -20 a +20">
                  <div *ngIf="hasError(r, 'esf')" class="text-red-500 text-xs mt-1">
                    {{ getErrorMessage(r, 'esf') }}
                  </div>
                </td>
                
                <!-- Cyl -->
                <td class="py-2 px-2">
                  <input class="rx-input compact-input" 
                         type="number" 
                         step="0.25"
                         [(ngModel)]="r.cyl" 
                         (ngModelChange)="onCylChange(r, $event)"
                         [class.error]="hasError(r, 'cyl')"
                         placeholder="0.00"
                         title="Cilindro: -10 a +10">
                  <div *ngIf="hasError(r, 'cyl')" class="text-red-500 text-xs mt-1">
                    {{ getErrorMessage(r, 'cyl') }}
                  </div>
                </td>
                
                <!-- Eje -->
                <td class="py-2 px-2">
                  <input class="rx-input compact-input" 
                         type="number" 
                         [(ngModel)]="r.eje" 
                         (ngModelChange)="onEjeChange(r, $event)"
                         [class.error]="hasError(r, 'eje')"
                         placeholder="0"
                         title="Eje: 0 a 180">
                  <div *ngIf="hasError(r, 'eje')" class="text-red-500 text-xs mt-1">
                    {{ getErrorMessage(r, 'eje') }}
                  </div>
                </td>
                
                <!-- ADD -->
                <td class="py-2 px-2">
                  <input class="rx-input compact-input" 
                         type="number" 
                         step="0.25"
                         [(ngModel)]="r.add" 
                         (ngModelChange)="onAddChange(r, $event)"
                         [class.error]="hasError(r, 'add')"
                         placeholder="0.00"
                         title="ADD: 1 a 9">
                  <div *ngIf="hasError(r, 'add')" class="text-red-500 text-xs mt-1">
                    {{ getErrorMessage(r, 'add') }}
                  </div>
                </td>
                
                <!-- D.I.P. -->
                <td class="py-2 px-2">
                  <input class="rx-input compact-input" 
                         type="number" 
                         [(ngModel)]="r.dip" 
                         (ngModelChange)="onDipChange(r, $event)"
                         [class.error]="hasError(r, 'dip')"
                         placeholder="55-70"
                         title="D.I.P.: 55 a 70">
                  <div *ngIf="hasError(r, 'dip')" class="text-red-500 text-xs mt-1">
                    {{ getErrorMessage(r, 'dip') }}
                  </div>
                </td>
                
                <!-- ALT. OBLEA -->
                <td class="py-2 px-2">
                  <input class="rx-input compact-input" 
                         type="number" 
                         [(ngModel)]="r.altOblea" 
                         (ngModelChange)="onAltObleaChange(r, $event)"
                         [class.error]="hasError(r, 'altOblea')"
                         placeholder="0"
                         title="ALT. OBLEA: 10 a 25">
                  <div *ngIf="hasError(r, 'altOblea')" class="text-red-500 text-xs mt-1">
                    {{ getErrorMessage(r, 'altOblea') }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Leyenda de rangos -->
        <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-center gap-2 text-blue-700 mb-2">
            <mat-icon class="text-blue-500 text-sm">info</mat-icon>
            <span class="text-sm font-medium">Rangos válidos:</span>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-blue-600">
            <div>• Esf: -20 a +20</div>
            <div>• Cyl: -10 a +10</div>
            <div>• Eje: 0 a 180</div>
            <div>• ADD: 1 a 9</div>
            <div>• D.I.P.: 55 a 70</div>
            <div>• ALT. OBLEA: 10 a 25</div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .compact-input {
      @apply w-full text-xs px-2 py-1 border border-gray-300 rounded transition-colors;
      min-width: 60px;
    }

    .compact-input:focus {
      @apply outline-none border-blue-500 ring-1 ring-blue-500;
    }

    .compact-input.error {
      @apply border-red-500 bg-red-50;
    }

    .compact-input.error:focus {
      @apply border-red-500 ring-1 ring-red-500;
    }

    /* Hacer la tabla más compacta */
    table {
      font-size: 0.75rem;
    }

    th, td {
      padding: 0.25rem 0.5rem;
    }
  `]
})
export class RxFormComponent {
  @Input() filasRx: any[] = [];
  @Output() filasRxChange = new EventEmitter<any[]>();

  // Rangos válidos
  private readonly RANGOS = {
    esf: { min: -20, max: 20 },
    cyl: { min: -10, max: 10 },
    eje: { min: 0, max: 180 },
    add: { min: 1, max: 9 },
    dip: { min: 55, max: 70 },
    altOblea: { min: 10, max: 25 }
  };

  // Objeto para rastrear errores por fila y campo
  errors: { [key: string]: { [field: string]: string } } = {};

  // Métodos para manejar cambios con validación
  onEsfChange(fila: any, value: number): void {
    this.validateField(fila, 'esf', value);
    this.calcularValoresCerca(fila);
  }

  onCylChange(fila: any, value: number): void {
    this.validateField(fila, 'cyl', value);
    this.calcularValoresCerca(fila);
  }

  onEjeChange(fila: any, value: number): void {
    this.validateField(fila, 'eje', value);
    this.calcularValoresCerca(fila);
  }

  onAddChange(fila: any, value: number): void {
    this.validateField(fila, 'add', value);
    this.calcularValoresCerca(fila);
  }

  onDipChange(fila: any, value: number): void {
    this.validateField(fila, 'dip', value);
    this.calcularValoresCerca(fila);
  }

  onAltObleaChange(fila: any, value: number): void {
    this.validateField(fila, 'altOblea', value);
  }

  // Validación de campo individual
  validateField(fila: any, field: string, value: number): void {
    const filaKey = this.getFilaKey(fila);
    
    if (value === null || value === undefined) {
      this.setError(filaKey, field, '');
      return;
    }

    if (isNaN(value)) {
      this.setError(filaKey, field, 'Solo números permitidos');
      return;
    }

    const rango = this.RANGOS[field as keyof typeof this.RANGOS];
    if (value < rango.min || value > rango.max) {
      this.setError(filaKey, field, `${rango.min} a ${rango.max}`);
      return;
    }

    // Si pasa todas las validaciones, eliminar el error
    this.clearError(filaKey, field);
  }

  // Cálculo automático de valores para cerca
  calcularValoresCerca(filaLejos: any): void {
    if (filaLejos.dist !== 'Lejos') return;

    const ojo = filaLejos.ojo;
    const filaCerca = this.filasRx.find(f => f.dist === 'Cerca' && f.ojo === ojo);
    
    if (!filaCerca) return;

    // Aplicar reglas de cálculo
    if (filaLejos.esf !== null && filaLejos.esf !== undefined && 
        filaLejos.add !== null && filaLejos.add !== undefined) {
      // Esf (cerca) = Esf (lejos) + ADD
      filaCerca.esf = this.roundToQuarter(Number(filaLejos.esf) + Number(filaLejos.add));
    }

    // CYL = igual a CYL distancia lejos
    if (filaLejos.cyl !== null && filaLejos.cyl !== undefined) {
      filaCerca.cyl = Number(filaLejos.cyl);
    }

    // EJE = igual a EJE distancia lejos
    if (filaLejos.eje !== null && filaLejos.eje !== undefined) {
      filaCerca.eje = Number(filaLejos.eje);
    }

    // D.I.P. = igual a D.I.P. distancia lejos
    if (filaLejos.dip !== null && filaLejos.dip !== undefined) {
      filaCerca.dip = Number(filaLejos.dip);
    }

    // ADD y ALT. OBLEA no se calculan - se dejan como están
  }

  // Redondear a 0.25 (cuartos)
  private roundToQuarter(value: number): number {
    return Math.round(value * 4) / 4;
  }

  // Métodos auxiliares para errores
  private getFilaKey(fila: any): string {
    return `${fila.dist}-${fila.ojo}`;
  }

  private setError(filaKey: string, field: string, message: string): void {
    if (!this.errors[filaKey]) {
      this.errors[filaKey] = {};
    }
    this.errors[filaKey][field] = message;
  }

  private clearError(filaKey: string, field: string): void {
    if (this.errors[filaKey]) {
      delete this.errors[filaKey][field];
      if (Object.keys(this.errors[filaKey]).length === 0) {
        delete this.errors[filaKey];
      }
    }
  }

  // Métodos para la plantilla
  hasError(fila: any, field: string): boolean {
    const filaKey = this.getFilaKey(fila);
    return !!(this.errors[filaKey] && this.errors[filaKey][field]);
  }

  getErrorMessage(fila: any, field: string): string {
    const filaKey = this.getFilaKey(fila);
    return this.errors[filaKey]?.[field] || '';
  }

  hasAnyError(): boolean {
    return Object.keys(this.errors).length > 0;
  }
}