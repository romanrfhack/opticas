import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap, startWith } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { InventoryService, InventorySearchItem } from './inventory.service';
import { ProductsService, Product } from './products.service';
import { ProductDialogComponent } from './product-dialog.component';
import { MovementDialogComponent } from './movement-dialog.component';
import { Toast } from '../../shared/ui/toast.service';
//install toast service



@Component({
  standalone: true,
  selector: 'app-inventario',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatTableModule, MatIconModule,
    MatProgressSpinnerModule, MatChipsModule, MatTooltipModule, MatButtonModule, MatDialogModule
  ],
  template: `
  <section class="space-y-4">
    <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <h1 class="text-2xl font-bold">Inventario</h1>

      <div class="flex items-center gap-3">
        <mat-form-field appearance="outline" class="w-72">
          <mat-label>Buscar (SKU / nombre)</mat-label>
          <input matInput [formControl]="q" placeholder="ej. ARZ-001 o 'estuche'">
          <button mat-icon-button matSuffix *ngIf="q.value" (click)="q.setValue('')" aria-label="Limpiar">
            <mat-icon>close</mat-icon>
          </button>
        </mat-form-field>

        <button mat-flat-button color="primary" (click)="nuevoProducto()">
          <mat-icon>add</mat-icon> Nuevo producto
        </button>
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
          <td mat-cell *matCellDef="let r"><span class="font-mono">{{ r.sku }}</span></td>
        </ng-container>

        <!-- Nombre -->
        <ng-container matColumnDef="nombre">
          <th mat-header-cell *matHeaderCellDef>Producto</th>
          <td mat-cell *matCellDef="let r">
            <div class="flex items-center gap-2">
              <button mat-button (click)="editarProducto(r)" class="!p-0 !min-w-0">
                <span class="font-medium">{{ r.nombre }}</span>
              </button>
              <mat-chip *ngIf="r.shared" matTooltip="Inventario compartido entre sucursales">Compartido</mat-chip>
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
            <button mat-icon-button matTooltip="Entrada" (click)="openMovimiento(r, 'Entrada')">
              <mat-icon>add</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Salida" (click)="openMovimiento(r, 'Salida')">
              <mat-icon>remove</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Traslado" (click)="openMovimiento(r, 'Traslado')">
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
  private products = inject(ProductsService);
  private dialog = inject(MatDialog);
  private toast = inject(Toast);

  q = new FormControl('', { nonNullable: true });
  loading = signal(false);
  data = signal<InventorySearchItem[]>([]);
  displayedColumns = ['sku','nombre','sucursal','stock','acciones'];

  constructor() {
    this.q.valueChanges.pipe(
      startWith(''),
      debounceTime(250),
      distinctUntilChanged(),
      tap(() => this.loading.set(true)),
      switchMap(txt => this.svc.search(txt ?? ''))
    ).subscribe({
      next: res => { this.data.set(res); this.loading.set(false); },
      error: _ => { this.data.set([]); this.loading.set(false); }
    });
  }

  rows = computed(() => this.data());

  nuevoProducto() {
    this.dialog.open(ProductDialogComponent, { data: { mode: 'create' } })
      .afterClosed().subscribe(created => {
        if (created) {
          this.toast.ok('Producto creado');
          this.q.setValue(this.q.value);
        }
      });
  }

  editarProducto(r: InventorySearchItem) {
    this.products.list(r.sku).subscribe({
      next: list => {
        const p = list.find(x => x.id === r.productId);
        if (!p) return;
        this.dialog.open(ProductDialogComponent, { data: { mode: 'edit', product: p } })
          .afterClosed().subscribe(updated => {
            if (updated) {
              this.toast.ok('Producto actualizado');
              this.q.setValue(this.q.value);
            }
          });
      }
    });
  }

  openMovimiento(r: InventorySearchItem, tipo: 'Entrada'|'Salida'|'Traslado') {
    const ref = this.dialog.open(MovementDialogComponent, {
      data: {
        productoId: r.productId,
        productoNombre: r.nombre,
        sucursalIdActual: r.sucursalId,
        sucursalNombreActual: r.sucursalNombre
      }
    });
    ref.componentInstance.form.patchValue({ tipo });
    ref.afterClosed().subscribe(ok => { if (ok) this.q.setValue(this.q.value); });
  }
}
