import { Component, Inject, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MovementsService, MovementType } from './movements.service';
import { Toast } from '../../shared/ui/toast.service';
import { BranchesService, Branch } from '../../core/branches.service';

export interface MovementData {
  productoId: string;
  productoNombre: string;
  sucursalIdActual: string;
  sucursalNombreActual: string;
}

@Component({
  standalone: true,
  selector: 'app-movement-dialog',
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
  <h2 mat-dialog-title>Movimiento de inventario</h2>
  <div class="px-4 text-sm text-gray-600">Producto: <strong>{{ data.productoNombre }}</strong></div>

  <form class="p-4 space-y-4" [formGroup]="form" (ngSubmit)="save()">
    <div class="grid md:grid-cols-3 gap-4">
      <mat-form-field appearance="outline">
        <mat-label>Tipo</mat-label>
        <mat-select formControlName="tipo" required (selectionChange)="onTipoChange()">
          <mat-option *ngFor="let t of tipos" [value]="t">{{t}}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" *ngIf="showDesde()">
        <mat-label>Desde sucursal</mat-label>
        <mat-select formControlName="desdeSucursalId">
          <mat-option *ngFor="let b of branches" [value]="b.id">{{ b.nombre }}</mat-option>
        </mat-select>
        <mat-hint>Actual: {{ data.sucursalNombreActual }}</mat-hint>
      </mat-form-field>

      <mat-form-field appearance="outline" *ngIf="showHacia()">
        <mat-label>Hacia sucursal</mat-label>
        <mat-select formControlName="haciaSucursalId">
          <mat-option *ngFor="let b of branches" [value]="b.id">{{ b.nombre }}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <div class="grid md:grid-cols-3 gap-4">
      <mat-form-field appearance="outline">
        <mat-label>Cantidad</mat-label>
        <input matInput type="number" formControlName="cantidad" min="1" required>
        <mat-error *ngIf="form.controls.cantidad.hasError('min')">Debe ser mayor a 0</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="md:col-span-2">
        <mat-label>Motivo (opcional)</mat-label>
        <input matInput formControlName="motivo" maxlength="300">
      </mat-form-field>
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <button mat-button type="button" (click)="close()">Cancelar</button>
      <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">Guardar</button>
    </div>
  </form>
  `
})
export class MovementDialogComponent {
  tipos: MovementType[] = ['Entrada','Salida','Traslado'];
  branches: Branch[] = [];
  saving = signal(false);

  private fb = inject(FormBuilder);
  private svc = inject(MovementsService);
  private toast = inject(Toast);
  private ref = inject(MatDialogRef<MovementDialogComponent>);
  private branchesSvc = inject(BranchesService);

  form = this.fb.group({
    tipo: ['Entrada', Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    motivo: [''],
    desdeSucursalId: [''],
    haciaSucursalId: ['']
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: MovementData) {
    this.branchesSvc.list().subscribe({
      next: bs => this.branches = bs,
      error: _ => this.branches = [{ id: data.sucursalIdActual, nombre: data.sucursalNombreActual }]
    });
    this.form.patchValue({ desdeSucursalId: data.sucursalIdActual });
  }

  showDesde() { return this.form.value.tipo === 'Salida' || this.form.value.tipo === 'Traslado'; }
  showHacia() { return this.form.value.tipo === 'Entrada' || this.form.value.tipo === 'Traslado'; }
  onTipoChange() {
    if (this.form.value.tipo === 'Entrada') {
      this.form.patchValue({ desdeSucursalId: '', haciaSucursalId: localStorage.getItem('sucursal_id') || this.data.sucursalIdActual });
    } else if (this.form.value.tipo === 'Salida') {
      this.form.patchValue({ desdeSucursalId: this.data.sucursalIdActual, haciaSucursalId: '' });
    } else {
      this.form.patchValue({ desdeSucursalId: this.data.sucursalIdActual, haciaSucursalId: '' });
    }
  }

  close() { this.ref.close(null); }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.value as any;

    this.svc.create({
      tipo: v.tipo,
      productoId: this.data.productoId,
      cantidad: Number(v.cantidad),
      motivo: v.motivo || undefined,
      desdeSucursalId: v.desdeSucursalId || undefined,
      haciaSucursalId: v.haciaSucursalId || undefined
    }).subscribe({
      next: () => { this.toast.ok('Movimiento registrado'); this.ref.close(true); },
      error: e => { this.toast.err(e?.error?.message ?? 'Error en movimiento'); this.saving.set(false); }
    });
  }
}
