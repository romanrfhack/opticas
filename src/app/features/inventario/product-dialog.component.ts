import { Component, Inject, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ProductsService, Product } from './products.service';
import { Toast } from '../../shared/ui/toast.service';

type Mode = 'create'|'edit';

@Component({
  standalone: true,
  selector: 'app-product-dialog',
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
  <h2 mat-dialog-title>{{ mode==='create' ? 'Nuevo producto' : 'Editar producto' }}</h2>

  <form class="p-4 space-y-4" [formGroup]="form" (ngSubmit)="save()">
    <div class="grid md:grid-cols-2 gap-4">
      <mat-form-field appearance="outline">
        <mat-label>SKU</mat-label>
        <input matInput formControlName="sku" required maxlength="60">
        <mat-error *ngIf="form.controls.sku.hasError('required')">SKU requerido</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Categoría</mat-label>
        <mat-select formControlName="categoria" required>
          <mat-option *ngFor="let c of categorias" [value]="c">{{c}}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <mat-form-field appearance="outline" class="w-full">
      <mat-label>Nombre</mat-label>
      <input matInput formControlName="nombre" required maxlength="200">
      <mat-error *ngIf="form.controls.nombre.hasError('required')">Nombre requerido</mat-error>
    </mat-form-field>

    <div class="flex items-center justify-between" *ngIf="mode==='edit'">
      <div class="text-sm text-gray-500">Estado: {{ form.value.activo ? 'Activo' : 'Inactivo' }}</div>
      <button mat-stroked-button type="button" (click)="toggleActivo()">
        {{ form.value.activo ? 'Desactivar' : 'Activar' }}
      </button>
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <button mat-button type="button" (click)="close()">Cancelar</button>
      <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
        {{ saving() ? 'Guardando…' : 'Guardar' }}
      </button>
    </div>
  </form>
  `
})
export class ProductDialogComponent {
  categorias = ['Armazon','Accesorio','Cristal','LenteContacto','Servicio','Otro'] as const;
  mode: Mode = 'create';
  product?: Product;
  saving = signal(false);

  private fb = inject(FormBuilder);
  private svc = inject(ProductsService);
  private toast = inject(Toast);
  private ref = inject(MatDialogRef<ProductDialogComponent>);

  form = this.fb.group({
    sku: ['', [Validators.required, Validators.maxLength(60)]],
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    categoria: ['Armazon', Validators.required],
    activo: [true]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { mode: Mode; product?: Product } ){
    this.mode = data.mode;
    if (data.product) {
      this.product = data.product;
      this.form.patchValue({
        sku: data.product.sku,
        nombre: data.product.nombre,
        categoria: data.product.categoria,
        activo: data.product.activo
      });
    }
  }

  toggleActivo() { this.form.patchValue({ activo: !this.form.value.activo }); }
  close() { this.ref.close(null); }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.value as any;

    if (this.mode==='create') {
      this.svc.create({ sku: v.sku, nombre: v.nombre, categoria: v.categoria })
        .subscribe({
          next: p => { this.toast.ok('Producto creado'); this.ref.close(p); },
          error: e => { this.toast.err(e?.error?.message ?? 'Error al crear'); this.saving.set(false); }
        });
    } else if (this.product) {
      this.svc.update(this.product.id, { sku: v.sku, nombre: v.nombre, categoria: v.categoria, activo: v.activo })
        .subscribe({
          next: p => { this.toast.ok('Producto actualizado'); this.ref.close(p); },
          error: e => { this.toast.err(e?.error?.message ?? 'Error al actualizar'); this.saving.set(false); }
        });
    }
  }
}
