import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';

import { InventoryService, InventorySearchItem } from './inventory.service';
import { MovementsService } from './movements.service';
import { ProductsService } from './products.service';

@Component({
  standalone: true,
  selector: 'app-inventario',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatTableModule, MatIconModule,
    MatProgressSpinnerModule, MatChipsModule, MatTooltipModule, MatButtonModule
  ],
  template: `
  <section class="space-y-4">
    <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <h1 class="text-2xl font-bold">Inventario</h1>

      <div class="flex items-center gap-3">
        <mat-form-field appearance="outline" class="w-72">
          <mat-label>Buscar (SKU / nombre)</mat-label>
          <input matInput [formControl]="q" placeholder="ej. ARZ-123 o 'cuerda'">
          <button mat-icon-button matSuffix *ngIf="q.value" (click)="q.setValue('')" aria-label="Limpiar">
            <mat-icon>close</mat-icon>
          </button>
        </mat-form-field>
      </div>
    </header>

    <div class="card p-4">
      <div class="flex items-center gap-2 mb-3" *ngIf="loading()">
        <mat-spinner diameter="24"></mat-spinner>
        <span class="text-sm text-gray-600">Buscando…</span>
      </div>

      <table mat-table [dataSource]="rows()" class="w-full" [class.opacity-50]="loading()">

        <!-- SKU -->
        <ng-container matColumnDef="sku">
          <th mat-header-cell *matHeaderCellDef>SKU</th>
          <td mat-cell *matCellDef="let r">
            <span class="font-mono">{{ r.sku }}</span>
          </td>
        </ng-container>

        <!-- Nombre -->
        <ng-container matColumnDef="nombre">
          <th mat-header-cell *matHeaderCellDef>Producto</th>
          <td mat-cell *matCellDef="let r">
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ r.nombre }}</span>
              <mat-chip *ngIf="r.shared" matTooltip="Producto con inventario compartido entre sucursales">Compartido</mat-chip>
              <mat-chip *ngIf="r.bajoMin" color="warn">Bajo stock</mat-chip>
            </div>
            <div class="text-xs text-gray-500">{{ r.categoria }}</div>
          </td>
        </ng-container>

        <!-- Sucursal -->
        <ng-container matColumnDef="sucursal">
          <th mat-header-cell *matHeaderCellDef>Sucursal</th>
          <td mat-cell *matCellDef="let r">{{ r.sucursalNombre }}</td>
        </ng-container>

        <!-- Stock -->
        <ng-container matColumnDef="stock">
          <th mat-header-cell *matHeaderCellDef>Stock</th>
          <td mat-cell *matCellDef="let r">
            <span [class.text-red-600]="r.bajoMin">{{ r.stock }}</span>
            <span class="text-xs text-gray-400" *ngIf="r.stockMin">/ min {{ r.stockMin }}</span>
          </td>
        </ng-container>

        <!-- Acciones -->
        <ng-container matColumnDef="acciones">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let r">
            <button mat-icon-button matTooltip="Entrada" (click)="entrada(r)">
              <mat-icon>add</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Salida" (click)="salida(r)">
              <mat-icon>remove</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Traslado" (click)="traslado(r)">
              <mat-icon>swap_horiz</mat-icon>
            </button>
          </td>
        </ng-container>


        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      <div *ngIf="!loading() && rows().length === 0" class="text-center py-8 text-gray-500">
        No hay resultados.
      </div>
    </div>
  </section>
  `
})
export class InventarioPage {
  private svc = inject(InventoryService);

  q = new FormControl('', { nonNullable: true });
  loading = signal(false);
  data = signal<InventorySearchItem[]>([]);
  displayedColumns = ['sku','nombre','sucursal','stock','acciones'];
  private move = inject(MovementsService);

  constructor() {
    this.q.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      tap(() => this.loading.set(true)),
      switchMap(txt => this.svc.search(txt ?? ''))
    ).subscribe({
      next: res => { this.data.set(res); this.loading.set(false); },
      error: _ => { this.data.set([]); this.loading.set(false); }
    });
    this.q.setValue('');
  }

  rows = computed(() => this.data());


  entrada(r: InventorySearchItem) {
  const qty = Number(prompt(`Entrada para ${r.nombre} (${r.sucursalNombre}). Cantidad:`));
  if (!qty || qty <= 0) return;
  this.move.create({ tipo: 'Entrada', productoId: r.productId, cantidad: qty, haciaSucursalId: r.sucursalId })
    .subscribe(() => this.q.setValue(this.q.value)); // refresca
}

salida(r: InventorySearchItem) {
  const qty = Number(prompt(`Salida de ${r.nombre} (${r.sucursalNombre}). Cantidad:`));
  if (!qty || qty <= 0) return;
  this.move.create({ tipo: 'Salida', productoId: r.productId, cantidad: qty, desdeSucursalId: r.sucursalId })
    .subscribe(() => this.q.setValue(this.q.value)); // refresca
}

traslado(r: InventorySearchItem) {
  const hacia = prompt('GUID de sucursal destino (ej. 2222...):');
  const qty = Number(prompt(`Traslado de ${r.nombre} desde ${r.sucursalNombre}. Cantidad:`));
  if (!hacia || !qty || qty <= 0) return;
  this.move.create({ tipo: 'Traslado', productoId: r.productId, cantidad: qty, desdeSucursalId: r.sucursalId, haciaSucursalId: hacia })
    .subscribe(() => this.q.setValue(this.q.value)); // refresca
}
}
