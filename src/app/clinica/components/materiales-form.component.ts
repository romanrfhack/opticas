import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { 
  MaterialItem, 
  ProductDto, 
  ArmazonHistoriaDto,
  MaterialHistoriaDto, 
  ArmazonesDto
} from '../../core/models/clinica.models';
import { ProductosService } from '../../core/productos.service';

@Component({
  standalone: true,
  selector: 'app-materiales-form',
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, 
    MatSelectModule, MatButtonModule, MatIconModule,
    MatAutocompleteModule
  ],
  template: `
    <mat-card class="form-card">
      <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
        <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
          <mat-icon [style.color]="'#06b6d4'" class="text-primary">inventory</mat-icon>
          Materiales, Lentes y Armazones
        </mat-card-title>
        <mat-card-subtitle class="text-gray-600">Selecciona los productos requeridos</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content class="space-y-6">
        <!-- Sección de Armazones -->
<div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
  <h3 class="font-medium text-gray-800 mb-3 flex items-center gap-2">
    <mat-icon class="text-gray-600 text-base">face</mat-icon>
    Armazones
  </h3>
  
  <div class="grid grid-cols-12 gap-3 items-end">
    <mat-form-field appearance="fill" class="col-span-6 custom-form-field">
      <mat-label>Buscar armazón</mat-label>
      <input matInput 
             [(ngModel)]="armazonBusqueda" 
             (input)="buscarArmazones()"
             [matAutocomplete]="autoArmazones"
             placeholder="Escribe para buscar armazones...">
      <mat-icon matPrefix class="prefix-icon">search</mat-icon>
      <mat-autocomplete #autoArmazones="matAutocomplete" 
                       (optionSelected)="seleccionarArmazon($event.option.value)"
                       [displayWith]="mostrarArmazon">
        <mat-option *ngFor="let armazon of armazonesFiltrados" [value]="armazon">
          <div class="flex justify-between items-center w-full">
            <div class="flex flex-col">
              <span class="font-medium">{{ armazon.nombre }}</span>
              <span class="text-xs text-gray-500">{{ armazon.sku }}</span>
            </div>
            <div class="flex items-center gap-2 ml-2">
              <!-- Stock en sucursal activa -->
              <span *ngIf="armazon.enSucursalActiva" 
                    class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap">
                Stock: {{ armazon.stock }}
              </span>
              
              <!-- Disponible en otras sucursales -->
              <span *ngIf="!armazon.enSucursalActiva && armazon.sucursalesConStock.length > 0"
                    class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap">
                En {{ armazon.sucursalesConStock.length }} sucursal(es)
              </span>
              
              <!-- Sin stock en ninguna sucursal -->
              <span *ngIf="!armazon.enSucursalActiva && armazon.sucursalesConStock.length === 0"
                    class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded whitespace-nowrap">
                Sin stock
              </span>
            </div>
          </div>
        </mat-option>
      </mat-autocomplete>
    </mat-form-field>

    <mat-form-field appearance="fill" class="col-span-4 custom-form-field">
      <mat-label>Observaciones</mat-label>
      <input matInput [(ngModel)]="armazonObs" placeholder="Color, medidas, etc.">
    </mat-form-field>

    <div class="col-span-2">
      <button mat-flat-button 
              color="primary" 
              (click)="agregarArmazon()" 
              [disabled]="!armazonSeleccionado"
              class="add-button w-full">
        <mat-icon>add</mat-icon>
        Agregar
      </button>
    </div>
  </div>

  <!-- Lista de armazones seleccionados -->
  <div class="mt-4" *ngIf="armazonesSel.length">
    <div class="text-sm font-medium mb-2 text-gray-700">Armazones Seleccionados</div>
    <ul class="space-y-2">
      <li *ngFor="let armazon of armazonesSel; let i=index" 
          class="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-200 transition-all hover:border-blue-300">
        <div class="flex items-center gap-3">
          <mat-icon class="text-gray-600 text-base">face</mat-icon>
          <div>
            <span class="font-medium text-gray-800 text-sm">{{ armazon.nombre }}</span>
            <span class="text-xs text-gray-500 ml-2">SKU: {{ armazon.sku }}</span>
            <!-- Mostrar información de stock en el armazón seleccionado -->
            <div class="flex gap-2 mt-1">
              <span *ngIf="armazon.enSucursalActiva" 
                    class="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                Stock disponible: {{ armazon.stock }}
              </span>
              <span *ngIf="!armazon.enSucursalActiva && armazon.sucursalesConStock.length > 0"
                    class="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                Disponible en otras sucursales
              </span>
              <span *ngIf="!armazon.enSucursalActiva && armazon.sucursalesConStock.length === 0"
                    class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                Sin stock
              </span>
            </div>
            <div class="text-xs text-gray-500 mt-1" *ngIf="armazon.observaciones">{{ armazon.observaciones }}</div>
          </div>
        </div>
        <button mat-icon-button 
                (click)="quitarArmazon(i)" 
                title="Quitar armazón"
                class="remove-button">
          <mat-icon>close</mat-icon>
        </button>
      </li>
    </ul>
  </div>
</div>

        <!-- Sección de Materiales y Lentes -->
        <div>
          <h3 class="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <mat-icon class="text-gray-600 text-base">lens</mat-icon>
            Materiales y Lentes
          </h3>
          
          <div class="grid grid-cols-12 gap-3 items-end">
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
              <input matInput [(ngModel)]="materialObs" placeholder="Tratamientos, color, etc.">
              <mat-icon matPrefix class="prefix-icon">note</mat-icon>
            </mat-form-field>

            <div class="col-span-2">
              <button mat-flat-button 
                      color="primary" 
                      (click)="agregarMaterial.emit()" 
                      [disabled]="!materialSelId"
                      class="add-button w-full">
                <mat-icon>add</mat-icon>
                Agregar
              </button>
            </div>
          </div>

          <!-- Lista de materiales seleccionados -->
          <div class="mt-4" *ngIf="materialesSel.length">
            <div class="text-sm font-medium mb-2 text-gray-700">Materiales Seleccionados</div>
            <ul class="space-y-2">
              <li *ngFor="let x of materialesSel; let i=index" 
                  class="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2 transition-all hover:bg-blue-100">
                <div class="flex items-center gap-3">
                  <mat-icon class="text-primary text-base">lens</mat-icon>
                  <div>
                    <span class="font-medium text-gray-800 text-sm">{{ x.descripcion }}</span>
                    <span class="text-xs text-gray-600 ml-2" *ngIf="x.marca">{{ x.marca }}</span>
                    <div class="text-xs text-gray-500 mt-1" *ngIf="x.observaciones">
                      <strong>Observaciones:</strong> {{ x.observaciones }}
                    </div>
                  </div>
                </div>
                <button mat-icon-button 
                        (click)="quitarMaterial.emit(i)" 
                        title="Quitar material"
                        class="remove-button">
                  <mat-icon>close</mat-icon>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `
})
export class MaterialesFormComponent implements OnInit {
  private productosService = inject(ProductosService);

//   interface SucursalStockDto {
//   sucursalId: string;
//   nombreSucursal: string;
//   stock: number;
// }

//  interface ArmazonesDto {
//   id: string;
//   sku: string;
//   nombre: string;
//   categoria: string;
//   activo: boolean;
//   stock: number;
//   enSucursalActiva: boolean;
//   sucursalesConStock: SucursalStockDto[];
// }

  @Input() materiales: MaterialItem[] = [];
  @Input() materialesSel: (MaterialItem & { observaciones?: string | null })[] = [];
  @Input() materialSelId: string | null = null;
  @Input() materialObs: string = '';    
  @Output() materialSelIdChange = new EventEmitter<string | null>();
  @Output() materialObsChange = new EventEmitter<string>();
  @Output() agregarMaterial = new EventEmitter<void>();
  @Output() quitarMaterial = new EventEmitter<number>();

  // Nuevas propiedades para armazones
  armazonBusqueda: string = '';  
  armazonObs: string = '';
  armazonesSel: (ArmazonesDto & { observaciones?: string | null })[] = [];

  armazonesFiltrados: ArmazonesDto[] = [];
  armazonSeleccionado?: ArmazonesDto;  

  // Output para armazones
  @Output() armazonesChange = new EventEmitter<ArmazonHistoriaDto[]>();

  ngOnInit() {
    this.buscarArmazones();
  }

  // Métodos para armazones
  buscarArmazones() {
    this.productosService.getArmazones(this.armazonBusqueda).subscribe({
      next: (armazones) => {
        this.armazonesFiltrados = armazones.sort((a, b) => {
          // 1. Primero los que tienen stock en sucursal activa
          if (a.enSucursalActiva && !b.enSucursalActiva) return -1;
          if (!a.enSucursalActiva && b.enSucursalActiva) return 1;
          
          // 2. Ambos en sucursal activa: ordenar por stock (mayor primero)
          if (a.enSucursalActiva && b.enSucursalActiva) {
            if (b.stock !== a.stock) return b.stock - a.stock;
          }
          
          // 3. Ambos NO en sucursal activa: los que tienen stock en otras sucursales primero
          if (!a.enSucursalActiva && !b.enSucursalActiva) {
            if (a.sucursalesConStock.length > 0 && b.sucursalesConStock.length === 0) return -1;
            if (a.sucursalesConStock.length === 0 && b.sucursalesConStock.length > 0) return 1;
          }
          
          // 4. Orden alfabético como último criterio
          return a.nombre.localeCompare(b.nombre);
        });
      },
      error: (err) => {
        console.error('Error al buscar armazones:', err);
        this.armazonesFiltrados = [];
      }
    });
  }


  

  seleccionarArmazon(armazon: ArmazonesDto) {
    this.armazonSeleccionado = armazon;
  }

  agregarArmazon() {
    if (!this.armazonSeleccionado) return;
    
    this.armazonesSel.push({
      ...this.armazonSeleccionado,
      observaciones: this.armazonObs
    });

    // Emitir los armazones seleccionados
    this.emitArmazones();

    // Limpiar selección
    this.armazonSeleccionado = undefined;
    this.armazonBusqueda = '';
    this.armazonObs = '';
    this.armazonesFiltrados = [];
  }

  quitarArmazon(index: number) {
    this.armazonesSel.splice(index, 1);
    this.emitArmazones();
  }

  private emitArmazones() {
    const armazonesParaHistoria: ArmazonHistoriaDto[] = this.armazonesSel.map(armazon => ({
      productoId: armazon.id,
      observaciones: armazon.observaciones || null
    }));
    this.armazonesChange.emit(armazonesParaHistoria);
  }  

  mostrarArmazon(armazon: ArmazonesDto | string): string {
  if (!armazon) return '';
  if (typeof armazon === 'string') return armazon;
  return armazon.nombre || armazon.sku || '';
}
}