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
  <h2 mat-dialog-title class="dialog-title">
    {{ mode==='create' ? 'Nuevo producto' : 'Editar producto' }}
  </h2>

  <form class="p-4 space-y-4" [formGroup]="form" (ngSubmit)="save()">
    <div class="grid md:grid-cols-2 gap-4">
      <mat-form-field appearance="fill" class="field no-outline">
        <mat-label>SKU</mat-label>
        <input matInput formControlName="sku" required maxlength="60">
        <mat-error *ngIf="form.controls.sku.hasError('required')">SKU requerido</mat-error>
      </mat-form-field>

      <mat-form-field appearance="fill" class="field no-outline">
        <mat-label>Categoría</mat-label>
        <mat-select formControlName="categoria" required panelClass="select-panel">
          <mat-option *ngFor="let c of categorias" [value]="c">{{c}}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <mat-form-field appearance="fill" class="field no-outline w-full">
      <mat-label>Nombre</mat-label>
      <input matInput formControlName="nombre" required maxlength="200">
      <mat-error *ngIf="form.controls.nombre.hasError('required')">Nombre requerido</mat-error>
    </mat-form-field>

    <div class="flex items-center justify-between" *ngIf="mode==='edit'">
      <div class="text-sm text-gray-500">
        Estado: <strong>{{ form.value.activo ? 'Activo' : 'Inactivo' }}</strong>
      </div>
      <button mat-stroked-button type="button" class="btn-outline" (click)="toggleActivo()">
        {{ form.value.activo ? 'Desactivar' : 'Activar' }}
      </button>
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <button mat-button type="button" (click)="close()">Cancelar</button>
      <button mat-flat-button type="submit" class="btn-primary" [disabled]="form.invalid || saving()">
        {{ saving() ? 'Guardando…' : 'Guardar' }}
      </button>
    </div>
  </form>
  `,
  styles: [`
  :host { display: block; }

  .dialog-title { color: #0f172a; margin-bottom: .25rem; }

  /* ---------- Botón primario ---------- */
  .btn-primary {
    background-color: #06b6d4 !important;
    color: #fff !important;
  }
  .btn-primary:hover { filter: brightness(.95); }
  .btn-primary[disabled] { opacity: .7; }

  /* ---------- Botón outline (activar/desactivar) ---------- */
  .btn-outline {
    border-color: #06b6d4 !important;
    color: #06b6d4 !important;
  }
  .btn-outline:hover {
    background: rgba(6,182,212,.06) !important;
  }

  /* ---------- Form-field sin “rayita” y con borde propio ---------- */
  .no-outline .mdc-line-ripple,
  .no-outline .mat-mdc-form-field-focus-overlay,
  .no-outline .mat-mdc-form-field-subscript-wrapper { display: none !important; }

  .field .mdc-text-field {
    background: transparent !important;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    min-height: 44px;
    padding: 0 12px;
    transition: border-color .2s ease, box-shadow .2s ease;
  }
  .field .mdc-text-field:hover { border-color: #06b6d4; }
  .field .mdc-text-field.mdc-text-field--focused {
    border-color: #06b6d4;
    box-shadow: 0 0 0 2px rgba(6,182,212,.18);
  }

  /* ---------- Panel del select ---------- */
  .select-panel {
    border-radius: 10px !important;
    border: 1px solid #e2e8f0 !important;
    box-shadow: 0 4px 20px rgba(0,0,0,.12) !important;
  }
  .select-panel .mat-mdc-option { min-height: 44px; }
  .select-panel .mat-mdc-option:hover:not(.mdc-list-item--disabled) { background: #f0f9ff !important; }
  .select-panel .mat-mdc-option.mat-mdc-option-active { background: #ecfeff !important; }

  /* ---------- Dark mode opcional ---------- */
  .dark .field .mdc-text-field { border-color: #4b5563; }
  .dark .field .mdc-text-field:hover,
  .dark .field .mdc-text-field.mdc-text-field--focused { border-color: #06b6d4; }
  .dark .select-panel { background: #1f2937 !important; border-color: #4b5563 !important; }
  .dark .select-panel .mat-mdc-option .mdc-list-item__primary-text { color: #e5e7eb; }
  `]
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
      // Si quisieras bloquear el SKU en edición:
      // this.form.controls.sku.disable();
    }
  }

  toggleActivo() {
    this.form.patchValue({ activo: !this.form.value.activo });
  }

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
