import { ChangeDetectionStrategy, Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

export interface EnviarLabData {
  ordenId?: string;
  pacienteNombre?: string;
  productoNombre?: string;
  total?: number; // si lo envías, mostramos el total y podemos validar pagos
}

@Component({
  standalone: true,
  selector: 'app-enviar-lab-dialog',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule
  ],
  template: `
  <h2 class="text-lg font-semibold mb-1">Enviar a laboratorio</h2>
  <p class="text-sm text-gray-500 mb-4" *ngIf="data?.pacienteNombre || data?.productoNombre">
    <ng-container *ngIf="data?.pacienteNombre">Paciente: <strong>{{ data.pacienteNombre }}</strong></ng-container>
    <ng-container *ngIf="data?.pacienteNombre && data?.productoNombre"> · </ng-container>
    <ng-container *ngIf="data?.productoNombre">Producto: <strong>{{ data.productoNombre }}</strong></ng-container>
  </p>

  <form [formGroup]="form" class="space-y-4" (ngSubmit)="ok()">
    <div class="grid md:grid-cols-2 gap-3">
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Laboratorio</mat-label>
        <input matInput formControlName="laboratorio" placeholder="Nombre del laboratorio" required />
        <mat-error *ngIf="form.controls.laboratorio.hasError('required')">Requerido</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Servicio</mat-label>
        <mat-select formControlName="servicio" required>
          <mat-option value="Mica">Mica</mat-option>
          <mat-option value="Armazón">Armazón</mat-option>
          <mat-option value="Montaje">Montaje</mat-option>
          <mat-option value="Otro">Otro</mat-option>
        </mat-select>
        <mat-error *ngIf="form.controls.servicio.hasError('required')">Requerido</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="md:col-span-2">
        <mat-label>Indicaciones / Observaciones</mat-label>
        <input matInput formControlName="indicaciones" maxlength="300" placeholder="Detalles técnicos, color, acabado, etc." />
      </mat-form-field>
    </div>

    <div class="grid md:grid-cols-3 gap-3">
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Fecha promesa (opcional)</mat-label>
        <input matInput type="date" formControlName="fechaPromesa" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Referencia externa (opcional)</mat-label>
        <input matInput formControlName="referenciaExterna" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Costo estimado (opcional)</mat-label>
        <input matInput type="number" formControlName="costo" min="0" step="0.01" />
      </mat-form-field>
    </div>

    <div *ngIf="data?.total as t" class="text-sm text-gray-600">
      Total a cubrir: <strong>{{ t | number:'1.2-2' }}</strong>
    </div>

    <!-- Pagos -->
    <section formArrayName="pagos" class="space-y-2">
      <div class="flex items-center justify-between">
        <h3 class="font-medium">Pagos</h3>
        <button mat-stroked-button type="button" (click)="addPago()">+ Agregar pago</button>
      </div>

      <div class="grid grid-cols-12 gap-2 items-end"
           *ngFor="let g of pagos.controls; let i = index; trackBy: trackByIndex"
           [formGroupName]="i">
        <mat-form-field class="col-span-4 md:col-span-3" appearance="outline">
          <mat-label>Método</mat-label>
          <mat-select formControlName="metodo">
            <mat-option value="Efectivo">Efectivo</mat-option>
            <mat-option value="Tarjeta">Tarjeta</mat-option>
            <mat-option value="Transferencia">Transferencia</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="col-span-4 md:col-span-3" appearance="outline">
          <mat-label>Monto</mat-label>
          <input matInput type="number" formControlName="monto" min="0" step="0.01" />
          <mat-error *ngIf="g.get('monto')?.hasError('min')">Debe ser ≥ 0</mat-error>
        </mat-form-field>

        <mat-form-field class="col-span-4 md:col-span-3" appearance="outline">
          <mat-label>Autorización</mat-label>
          <input matInput formControlName="autorizacion" />
        </mat-form-field>

        <div class="col-span-12 md:col-span-2 flex items-center gap-2">
          <mat-form-field class="flex-1" appearance="outline">
            <mat-label>Nota</mat-label>
            <input matInput formControlName="nota" />
          </mat-form-field>
          <button mat-button color="warn" type="button" (click)="removePago(i)">Quitar</button>
        </div>
      </div>
    </section>

    <div class="flex items-center justify-between text-sm text-gray-600" *ngIf="data?.total as t">
      <span>Pagado: <strong>{{ totalPagos | number:'1.2-2' }}</strong></span>
      <span>Pendiente: <strong>{{ (t - totalPagos) | number:'1.2-2' }}</strong></span>
    </div>

    <div class="flex justify-end gap-2 pt-4">
      <button mat-button type="button" (click)="close()">Cancelar</button>
      <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
        Enviar
      </button>
    </div>
  </form>
  `,
  styles: [`
    :host { display:block; max-width: 880px; }
    .mat-mdc-form-field { width: 100%; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnviarLabDialog {
  private fb = inject(FormBuilder);
  private ref = inject(MatDialogRef<EnviarLabDialog>);
  constructor(@Inject(MAT_DIALOG_DATA) public data: EnviarLabData) {}

  form = this.fb.group({
    laboratorio: ['', Validators.required],
    servicio: ['Mica', Validators.required],
    indicaciones: [''],
    fechaPromesa: [''],
    referenciaExterna: [''],
    costo: [null as number | null, [Validators.min(0)]],
    pagos: this.fb.array([
      this.fb.group({
        metodo: ['Efectivo'],
        monto: [0, [Validators.min(0)]],
        autorizacion: [''],
        nota: ['']
      })
    ])
  });

  get pagos(): FormArray { return this.form.get('pagos') as FormArray; }

  get totalPagos(): number {
    return this.pagos.controls.reduce((acc, c) => acc + Number(c.get('monto')?.value || 0), 0);
  }

  addPago() {
    this.pagos.push(this.fb.group({
      metodo: ['Efectivo'],
      monto: [0, [Validators.min(0)]],
      autorizacion: [''],
      nota: ['']
    }));
  }

  removePago(i: number) {
    if (this.pagos.length > 1) this.pagos.removeAt(i);
  }

  trackByIndex = (_: number, __: unknown) => _;

  close() { this.ref.close(); }

  ok() {
    if (this.form.invalid) return;
    // Si envías data.total, opcional: validar que totalPagos <= total
    if (typeof this.data?.total === 'number' && this.totalPagos > this.data.total) {
      // podrías mostrar un snackbar/toast si tienes uno; por simplicidad, bloqueamos
      return;
    }
    this.ref.close(this.form.getRawValue());
  }
}
