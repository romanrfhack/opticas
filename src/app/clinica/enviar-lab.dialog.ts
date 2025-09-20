import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormArray, FormBuilder, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

@Component({
  standalone: true,
  selector: 'app-enviar-lab-dialog',
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatSelectModule],
  template: `
  <h2 class="text-lg font-semibold mb-4">Enviar a laboratorio</h2>
  <form [formGroup]="form" class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <mat-form-field appearance="outline">
        <mat-label>Total</mat-label>
        <input matInput type="number" formControlName="total" required>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Fecha estimada entrega</mat-label>
        <input matInput type="date" formControlName="fechaEstimadaEntrega">
      </mat-form-field>
    </div>

    <div class="font-medium">Pagos</div>
    <div formArrayName="pagos" class="space-y-2">
      <div class="grid grid-cols-12 gap-2 items-end" *ngFor="let g of pagos.controls; let i = index" [formGroupName]="i">
        <mat-form-field class="col-span-3" appearance="outline">
          <mat-label>Método</mat-label>
          <mat-select formControlName="metodo">
            <mat-option value="Efectivo">Efectivo</mat-option>
            <mat-option value="Tarjeta">Tarjeta</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field class="col-span-3" appearance="outline">
          <mat-label>Monto</mat-label>
          <input matInput type="number" formControlName="monto">
        </mat-form-field>
        <mat-form-field class="col-span-3" appearance="outline">
          <mat-label>Autorización</mat-label>
          <input matInput formControlName="autorizacion">
        </mat-form-field>
        <mat-form-field class="col-span-3" appearance="outline">
          <mat-label>Nota</mat-label>
          <input matInput formControlName="nota">
        </mat-form-field>
      </div>
      <button mat-button type="button" (click)="addPago()">+ Agregar pago</button>
    </div>

    <div class="flex justify-end gap-2 pt-4">
      <button mat-button type="button" (click)="close()">Cancelar</button>
      <button mat-flat-button color="primary" type="button" (click)="ok()" [disabled]="form.invalid">Enviar</button>
    </div>
  </form>
  `
})
export class EnviarLabDialog {
  private fb = inject(FormBuilder);
  private ref = inject(MatDialogRef<EnviarLabDialog>);
  data = inject(MAT_DIALOG_DATA);

  form = this.fb.group({
    total: [0, [Validators.required, Validators.min(0)]],
    fechaEstimadaEntrega: [''],
    pagos: this.fb.array([])
  });

  get pagos() { return this.form.get('pagos') as FormArray; }

  addPago() {
    this.pagos.push(this.fb.group({
      metodo: ['Efectivo'],
      monto: [0, [Validators.min(0)]],
      autorizacion: [''],
      nota: ['']
    }));
  }

  close(){ this.ref.close(); }
  ok(){ if(this.form.valid){ this.ref.close(this.form.value); } }
}
