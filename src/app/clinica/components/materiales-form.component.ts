import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MaterialItem } from '../../core/models/clinica.models';

@Component({
  standalone: true,
  selector: 'app-materiales-form',
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, 
    MatSelectModule, MatButtonModule, MatIconModule
  ],
  template: `
    <mat-card class="form-card">
      <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
        <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
          <mat-icon [style.color]="'#06b6d4'" class="text-primary">inventory</mat-icon>
          Materiales y Lentes
        </mat-card-title>
        <mat-card-subtitle class="text-gray-600">Selecciona materiales requeridos</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div class="grid grid-cols-12 gap-4 items-end">
          <mat-form-field appearance="fill" class="col-span-5 custom-form-field">
            <mat-label>Selecciona material</mat-label>
            <mat-select [(ngModel)]="materialSelId">
              <mat-option *ngFor="let m of materiales" [value]="m.id">
                {{ m.descripcion }} <span *ngIf="m.marca" class="text-gray-500">— {{ m.marca }}</span>
              </mat-option>
            </mat-select>
            <mat-icon matPrefix class="prefix-icon">inventory_2</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="fill" class="col-span-5 custom-form-field">
            <mat-label>Observaciones</mat-label>
            <input matInput [(ngModel)]="materialObs" placeholder="Observaciones del material">
            <mat-icon matPrefix class="prefix-icon">note</mat-icon>
          </mat-form-field>

          <div class="col-span-2">
            <button mat-flat-button 
                    color="primary" 
                    (click)="agregarMaterial.emit()" 
                    [disabled]="!materialSelId"
                    class="add-button">
              <mat-icon>add</mat-icon>
              Agregar
            </button>
          </div>
        </div>

        <div class="mt-6" *ngIf="materialesSel.length">
          <div class="text-sm font-medium mb-3 flex items-center gap-2">
            <mat-icon class="text-base">checklist</mat-icon>
            Materiales Seleccionados
          </div>
          <ul class="space-y-2">
            <li *ngFor="let x of materialesSel; let i=index" 
                class="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3 transition-all hover:bg-blue-100">
              <div class="flex items-center gap-3">
                <mat-icon class="text-primary text-base">lens</mat-icon>
                <div>
                  <span class="font-medium text-gray-800">{{ x.descripcion }}</span>
                  <span class="text-xs text-gray-600 ml-2" *ngIf="x.marca">{{ x.marca }}</span>
                  <div class="text-xs text-gray-500 mt-1" *ngIf="x.observaciones">{{ x.observaciones }}</div>
                </div>
              </div>
              <button mat-icon-button 
                      (click)="quitarMaterial.emit(i)" 
                      title="Quitar"
                      class="remove-button">
                <mat-icon>close</mat-icon>
              </button>
            </li>
          </ul>
        </div>
      </mat-card-content>
    </mat-card>
  `
})
export class MaterialesFormComponent {
  @Input() materiales: MaterialItem[] = [];
  @Input() materialesSel: (MaterialItem & { observaciones?: string })[] = [];
  @Input() materialSelId: string | null = null;
  @Input() materialObs: string = '';
  
  @Output() materialSelIdChange = new EventEmitter<string | null>();
  @Output() materialObsChange = new EventEmitter<string>();
  @Output() agregarMaterial = new EventEmitter<void>();
  @Output() quitarMaterial = new EventEmitter<number>();
}