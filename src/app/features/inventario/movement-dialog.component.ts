import { Component, Inject, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  template: `
  <h2 mat-dialog-title class="dialog-title">Movimiento de inventario</h2>
  <div class="px-4 text-sm text-gray-600">
    Producto: <strong>{{ data.productoNombre }}</strong>
  </div>

  <form class="p-4 space-y-4" [formGroup]="form" (ngSubmit)="save()">
    <div class="grid md:grid-cols-3 gap-4">
      <mat-form-field appearance="fill" class="field no-outline">
        <mat-label>Tipo</mat-label>
        <mat-select formControlName="tipo" required (selectionChange)="onTipoChange()" panelClass="select-panel">
          <mat-option *ngFor="let t of tipos" [value]="t">{{ t }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="fill" class="field no-outline" *ngIf="showDesde()">
        <mat-label>Desde sucursal</mat-label>
        <mat-select formControlName="desdeSucursalId" panelClass="select-panel">
          <mat-option *ngFor="let b of branches" [value]="b.id">{{ b.nombre }}</mat-option>
        </mat-select>
        <mat-hint>Actual: {{ data.sucursalNombreActual }}</mat-hint>
        <mat-error *ngIf="form.controls.desdeSucursalId.hasError('required')">Obligatorio</mat-error>
      </mat-form-field>

      <mat-form-field appearance="fill" class="field no-outline" *ngIf="showHacia()">
        <mat-label>Hacia sucursal</mat-label>
        <mat-select formControlName="haciaSucursalId" panelClass="select-panel">
          <mat-option *ngFor="let b of branches" [value]="b.id">{{ b.nombre }}</mat-option>
        </mat-select>
        <mat-error *ngIf="form.controls.haciaSucursalId.hasError('required')">Obligatorio</mat-error>
        <mat-error *ngIf="form.hasError('sameBranch')">No puede ser la misma sucursal.</mat-error>
      </mat-form-field>
    </div>

    <div class="grid md:grid-cols-3 gap-4">
      <mat-form-field appearance="fill" class="field no-outline">
        <mat-label>Cantidad</mat-label>
        <input matInput type="number" formControlName="cantidad" min="1" step="1" required>
        <mat-error *ngIf="form.controls.cantidad.hasError('required')">Requerido</mat-error>
        <mat-error *ngIf="form.controls.cantidad.hasError('min')">Debe ser mayor a 0</mat-error>
      </mat-form-field>

      <mat-form-field appearance="fill" class="field no-outline md:col-span-2">
        <mat-label>Motivo (opcional)</mat-label>
        <input matInput formControlName="motivo" maxlength="300">
      </mat-form-field>
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <button mat-button type="button" (click)="close()">Cancelar</button>
      <button mat-flat-button type="submit" class="btn-primary" [disabled]="form.invalid || saving()">
        Guardar
      </button>
    </div>
  </form>
  `,
  styles: [`
  /* ---------- Colores/base ---------- */
  :host { display: block; }
  .dialog-title { color: #0f172a; margin-bottom: .25rem; }

  /* Botón primario */
  .btn-primary {
    background-color: #06b6d4 !important;
    color: #fff !important;
  }
  .btn-primary:hover { filter: brightness(.95); }
  .btn-primary[disabled] { opacity: .7; }

  /* Form-field sin “rayita” */
  .no-outline .mdc-line-ripple,
  .no-outline .mat-mdc-form-field-focus-overlay,
  .no-outline .mat-mdc-form-field-subscript-wrapper { display: none !important; }

  .field .mdc-text-field {
    background: transparent !important;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    min-height: 44px;
    padding: 0 12px;
    transition: border-color .2s, box-shadow .2s;
  }
  .field .mdc-text-field:hover { border-color: #06b6d4; }
  .field .mdc-text-field.mdc-text-field--focused {
    border-color: #06b6d4;
    box-shadow: 0 0 0 2px rgba(6,182,212,.18);
  }

  /* Panel del select */
  .select-panel {
    border-radius: 10px !important;
    border: 1px solid #e2e8f0 !important;
    box-shadow: 0 4px 20px rgba(0,0,0,.12) !important;
  }
  .select-panel .mat-mdc-option { min-height: 44px; }
  .select-panel .mat-mdc-option:hover:not(.mdc-list-item--disabled) { background: #f0f9ff !important; }
  .select-panel .mat-mdc-option.mat-mdc-option-active { background: #ecfeff !important; }

  /* Modo oscuro */
  .dark .field .mdc-text-field { border-color: #4b5563; }
  .dark .field .mdc-text-field:hover,
  .dark .field .mdc-text-field.mdc-text-field--focused { border-color: #06b6d4; }
  .dark .select-panel { background: #1f2937 !important; border-color: #4b5563 !important; }
  .dark .select-panel .mat-mdc-option .mdc-list-item__primary-text { color: #e5e7eb; }
  `]
})
export class MovementDialogComponent {
  tipos: MovementType[] = ['Entrada', 'Salida', 'Traslado'];
  branches: Branch[] = [];
  saving = signal(false);

  private fb = inject(FormBuilder);
  private svc = inject(MovementsService);
  private toast = inject(Toast);
  private ref = inject(MatDialogRef<MovementDialogComponent>);
  private branchesSvc = inject(BranchesService);

  /* ✅ Definimos el validator ANTES de crear el form */
  private readonly notSameBranchValidator: ValidatorFn = (group: AbstractControl) => {
    const tipo = group.get('tipo')?.value as MovementType;
    if (tipo !== 'Traslado') return null;
    const d = group.get('desdeSucursalId')?.value;
    const h = group.get('haciaSucursalId')?.value;
    return d && h && d === h ? { sameBranch: true } : null;
  };

  /* Ahora sí podemos crear el form y usar el validator */
  form = this.fb.group({
    tipo: ['Entrada' as MovementType, Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    motivo: [''],
    desdeSucursalId: [''],
    haciaSucursalId: ['']
  }, { validators: this.notSameBranchValidator });

  constructor(@Inject(MAT_DIALOG_DATA) public data: MovementData) {
    this.branchesSvc.list().subscribe({
      next: (bs) => { this.branches = bs; },
      error: () => {
        this.branches = [{ id: data.sucursalIdActual, nombre: data.sucursalNombreActual }];
      }
    });

    // Default: Entrada -> hacia la sucursal actual (o activa en localStorage)
    this.form.patchValue({
      desdeSucursalId: '',
      haciaSucursalId: this.getDefaultTargetBranchId()
    });
    this.applyValidators(this.form.controls.tipo.value as MovementType);
  }

  /* ---------- Helpers de UI ---------- */
  showDesde() { return this.form.value.tipo === 'Salida' || this.form.value.tipo === 'Traslado'; }
  showHacia() { return this.form.value.tipo === 'Entrada' || this.form.value.tipo === 'Traslado'; }

  onTipoChange() {
    const tipo = this.form.controls.tipo.value as MovementType;
    const actual = this.data.sucursalIdActual;

    if (tipo === 'Entrada') {
      this.form.patchValue({ desdeSucursalId: '', haciaSucursalId: this.getDefaultTargetBranchId() });
    } else if (tipo === 'Salida') {
      this.form.patchValue({ desdeSucursalId: actual, haciaSucursalId: '' });
    } else { // Traslado
      this.form.patchValue({ desdeSucursalId: actual, haciaSucursalId: '' });
    }
    this.applyValidators(tipo);
  }

  private getDefaultTargetBranchId(): string {
    return localStorage.getItem('sucursal_id') || this.data.sucursalIdActual;
  }

  /** Reglas de required según el tipo */
  private applyValidators(tipo: MovementType) {
    const desde = this.form.controls.desdeSucursalId;
    const hacia = this.form.controls.haciaSucursalId;

    desde.clearValidators();
    hacia.clearValidators();

    if (tipo === 'Entrada') {
      hacia.setValidators([Validators.required]);
    } else if (tipo === 'Salida') {
      desde.setValidators([Validators.required]);
    } else { // Traslado
      desde.setValidators([Validators.required]);
      hacia.setValidators([Validators.required]);
    }

    desde.updateValueAndValidity({ emitEvent: false });
    hacia.updateValueAndValidity({ emitEvent: false });
    this.form.updateValueAndValidity({ emitEvent: false });
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
      next: () => {
        this.toast.ok('Movimiento registrado');
        this.ref.close(true);
      },
      error: e => {
        this.toast.err(e?.error?.message ?? 'Error en movimiento');
        this.saving.set(false);
      }
    });
  }
}
