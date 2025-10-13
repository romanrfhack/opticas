// visita-detalle-modal.component.ts
import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VisitaCompleta } from '../../core/models/clinica.models';

//import { HistoriasService } from '../core/historias.service';
//import { VisitaCompleta, EstadoHistoria } from '../core/models/clinica.models';

@Component({
  standalone: true,
  selector: 'app-visita-detalle-modal',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white z-10 border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-800">Detalle de Visita</h2>
            <p class="text-sm text-gray-600">
              {{ data.fecha | date:'fullDate' }} - {{ data.usuarioNombre }}
            </p>
          </div>
          <button mat-icon-button (click)="cerrar()" class="text-gray-500 hover:text-gray-700">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- Contenido -->
      <div class="p-6 space-y-6">
        <!-- Estado y información general -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title class="flex items-center gap-2">
              <mat-icon [ngClass]="{
                'text-blue-500': data.estado === 'Borrador',
                'text-green-500': data.estado === 'EnviadoLaboratorio',
                'text-purple-500': data.estado === 'Recibido',
                'text-teal-500': data.estado === 'Entregado',
                'text-red-500': data.estado === 'Cancelado'
              }">circle</mat-icon>
              Estado: {{ data.estado }}
            </mat-card-title>
          </mat-card-header>
          <mat-card-content class="mt-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <label class="block text-gray-500 text-xs">Total</label>
                <span class="font-semibold">{{ data.total | currency }}</span>
              </div>
              <div>
                <label class="block text-gray-500 text-xs">A Cuenta</label>
                <span class="font-semibold">{{ data.aCuenta | currency }}</span>
              </div>
              <div>
                <label class="block text-gray-500 text-xs">Resta</label>
                <span class="font-semibold">{{ data.resta | currency }}</span>
              </div>
              <div>
                <label class="block text-gray-500 text-xs">Sucursal</label>
                <span class="font-semibold">{{ data.nombreSucursal }} </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Tabs para las diferentes secciones -->
        <mat-tab-group animationDuration="0ms">
          <!-- Agudeza Visual -->
          <mat-tab label="Agudeza Visual">
            <div class="mt-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <mat-card>
                  <mat-card-header>
                    <mat-card-title class="text-base">Sin Lentes</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="space-y-2">
                      <div *ngFor="let av of agudezasSinLentes" 
                           class="flex justify-between">
                        <span class="font-medium">{{ av.ojo }}:</span>
                        <span>20/{{ av.denominador }}</span>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>

                <mat-card>
                  <mat-card-header>
                    <mat-card-title class="text-base">Con Lentes</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="space-y-2">
                      <div *ngFor="let av of agudezasConLentes" 
                           class="flex justify-between">
                        <span class="font-medium">{{ av.ojo }}:</span>
                        <span>20/{{ av.denominador }}</span>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Prescripción RX -->
          <mat-tab label="Prescripción">
            <div class="mt-4">
              <div class="overflow-x-auto">
                <table class="w-full text-sm border border-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="p-2 border">Dist.</th>
                      <th class="p-2 border">Ojo</th>
                      <th class="p-2 border">Esf.</th>
                      <th class="p-2 border">Cyl.</th>
                      <th class="p-2 border">Eje</th>
                      <th class="p-2 border">ADD</th>
                      <th class="p-2 border">DIP</th>
                      <th class="p-2 border">Alt.Obl.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let r of data.rx" class="hover:bg-gray-50">
                      <td class="p-2 border text-center">{{ r.distancia }}</td>
                      <td class="p-2 border text-center">{{ r.ojo }}</td>
                      <td class="p-2 border text-center">{{ r.esf || '-' }}</td>
                      <td class="p-2 border text-center">{{ r.cyl || '-' }}</td>
                      <td class="p-2 border text-center">{{ r.eje || '-' }}</td>
                      <td class="p-2 border text-center">{{ r.add || '-' }}</td>
                      <td class="p-2 border text-center">{{ r.dip || '-' }}</td>
                      <td class="p-2 border text-center">{{ r.altOblea || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- Materiales y Armazones -->
          <mat-tab label="Materiales & Armazones">
            <div class="mt-4 space-y-4">
              <!-- Materiales -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title class="text-base">Materiales Seleccionados</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div *ngIf="data.materiales.length; else noMateriales" class="space-y-2">
                    <div *ngFor="let mat of data.materiales" 
                         class="p-3 border border-gray-200 rounded-lg">
                      <div class="font-medium">{{ mat.material.descripcion }}</div>
                      <div class="text-sm text-gray-600" *ngIf="mat.material?.marca">
                        Marca: {{ mat.material.marca }}
                      </div>
                      <div class="text-sm text-gray-600" *ngIf="mat.observaciones">
                        Observaciones: {{ mat.observaciones }}
                      </div>
                    </div>
                  </div>
                  <ng-template #noMateriales>
                    <p class="text-gray-500 text-sm">No se seleccionaron materiales</p>
                  </ng-template>
                </mat-card-content>
              </mat-card>

              <!-- Armazones -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title class="text-base">Armazones Seleccionados</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div *ngIf="data.armazones.length; else noArmazones" class="space-y-2">
                    <div *ngFor="let armazon of data.armazones" 
                         class="p-3 border border-gray-200 rounded-lg">
                      <div class="font-medium">{{ armazon.producto.nombre }}</div>
                      <div class="text-sm text-gray-600">
                        SKU: {{ armazon.producto.sku }}
                      </div>
                      <div class="text-sm text-gray-600" *ngIf="armazon.observaciones">
                        Observaciones: {{ armazon.observaciones }}
                      </div>
                    </div>
                  </div>
                  <ng-template #noArmazones>
                    <p class="text-gray-500 text-sm">No se seleccionaron armazones</p>
                  </ng-template>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Lentes de Contacto -->
          <mat-tab label="Lentes de Contacto">
            <div class="mt-4">
              <mat-card>
                <mat-card-content>
                  <div *ngIf="data.lentesContacto.length; else noLentesContacto" class="space-y-3">
                    <div *ngFor="let lc of data.lentesContacto" 
                         class="p-3 border border-gray-200 rounded-lg">
                      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <label class="block text-gray-500 text-xs">Tipo</label>
                          <span class="font-medium">{{ lc.tipo }}</span>
                        </div>
                        <div>
                          <label class="block text-gray-500 text-xs">Marca</label>
                          <span class="font-medium">{{ lc.marca || '-' }}</span>
                        </div>
                        <div>
                          <label class="block text-gray-500 text-xs">Modelo</label>
                          <span class="font-medium">{{ lc.modelo || '-' }}</span>
                        </div>
                        <div>
                          <label class="block text-gray-500 text-xs">Observaciones</label>
                          <span class="font-medium">{{ lc.observaciones || '-' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ng-template #noLentesContacto>
                    <p class="text-gray-500 text-sm">No se registraron lentes de contacto</p>
                  </ng-template>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Observaciones -->
          <mat-tab label="Observaciones">
            <div class="mt-4">
              <mat-card>
                <mat-card-content>
                  <p class="text-gray-700" *ngIf="data.observaciones; else noObservaciones">
                    {{ data.observaciones }}
                  </p>
                  <ng-template #noObservaciones>
                    <p class="text-gray-500">No hay observaciones registradas</p>
                  </ng-template>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .form-card {
      @apply rounded-lg shadow-sm border border-gray-200;
    }
  `]
})
export class VisitaDetalleModalComponent {
  private dialogRef = inject(MatDialogRef<VisitaDetalleModalComponent>);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: VisitaCompleta
  ) {}

  get agudezasSinLentes() {
    return this.data.agudezas?.filter(a => a.condicion === 'SinLentes') ?? [];
  }

  get agudezasConLentes() {
    return this.data.agudezas?.filter(a => a.condicion === 'ConLentes') ?? [];
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}