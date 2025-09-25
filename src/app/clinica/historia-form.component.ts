import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { PacientesService } from '../core/pacientes.service';
import { HistoriasService } from '../core/historias.service';
import { MaterialesService } from '../core/materiales.service';
import { AgudezaDto, CrearHistoriaRequest, LcDto, MaterialDto, MaterialItem, PacienteItem } from '../core/models/clinica.models';
import { EnviarLabDialog } from './enviar-lab.dialog';
import { UltimasVisitasComponent } from './ultimas-visitas.component';

@Component({
  standalone: true,
  selector: 'app-historia-form',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatAutocompleteModule, MatSelectModule, MatDialogModule, UltimasVisitasComponent,
    MatSnackBarModule, MatProgressBarModule, MatCardModule
  ],
  template: `
  <div class="max-w-7xl mx-auto space-y-8 p-4 dashboard-container">
    <!-- Progress Bar -->
    <mat-progress-bar mode="indeterminate" *ngIf="loading()" class="rounded-full"></mat-progress-bar>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 dashboard-container">
      <!-- Col 1-2: Formulario principal -->
      <div class="lg:col-span-2 space-y-8 dashboard-container">
        <!-- Paciente Section -->
        <mat-card class="form-card">
          <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
            <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
              <mat-icon class="text-primary">person</mat-icon>
              Datos del Paciente
            </mat-card-title>
            <mat-card-subtitle class="text-gray-600">Buscar o crear nuevo paciente</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="pacForm" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <mat-form-field appearance="fill" class="w-full md:col-span-2 custom-form-field">
                <mat-label>Nombre completo</mat-label>
                <input matInput formControlName="nombre" [matAutocomplete]="auto" placeholder="Buscar o escribir nombre..." required>
                <mat-icon matPrefix class="prefix-icon">search</mat-icon>
                <mat-autocomplete #auto="matAutocomplete" (optionSelected)="selectPaciente($event.option.value)">
                  <mat-option *ngFor="let p of sugeridos()" [value]="p" class="flex justify-between items-center">
                    <span>{{ p.nombre }}</span>
                    <span class="text-xs text-gray-500 ml-2">{{ p.telefono }}</span>
                  </mat-option>
                </mat-autocomplete>
                <mat-error *ngIf="pacForm.controls.nombre.hasError('required')">Campo requerido</mat-error>
              </mat-form-field>

              <mat-form-field appearance="fill" class="w-full custom-form-field">
                <mat-label>Edad</mat-label>
                <input matInput type="number" formControlName="edad" required min="0" max="120">
                <mat-icon matPrefix class="prefix-icon">calendar_today</mat-icon>
                <mat-error *ngIf="pacForm.controls.edad.hasError('required')">Campo requerido</mat-error>
                <mat-error *ngIf="pacForm.controls.edad.hasError('min')">Edad mínima: 0</mat-error>
                <mat-error *ngIf="pacForm.controls.edad.hasError('max')">Edad máxima: 120</mat-error>
              </mat-form-field>

              <mat-form-field appearance="fill" class="w-full custom-form-field">
                <mat-label>Teléfono</mat-label>
                <input matInput formControlName="telefono" pattern="^[0-9\\s\\-()+]{7,}$">
                <mat-icon matPrefix class="prefix-icon">phone</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="fill" class="w-full custom-form-field">
                <mat-label>Ocupación</mat-label>
                <input matInput formControlName="ocupacion">
                <mat-icon matPrefix class="prefix-icon">work</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="fill" class="w-full md:col-span-2 custom-form-field">
                <mat-label>Dirección</mat-label>
                <input matInput formControlName="direccion">
                <mat-icon matPrefix class="prefix-icon">home</mat-icon>
              </mat-form-field>
            </form>

            <div class="flex gap-3 mt-4 pt-4 border-t border-gray-100">
              <button mat-stroked-button 
                      color="primary" 
                      (click)="crearPaciente()" 
                      *ngIf="!pacienteId()" 
                      [disabled]="pacForm.invalid"
                      class="action-button">
                <mat-icon>person_add</mat-icon>
                Crear Paciente
              </button>
              <div class="flex items-center text-sm text-green-600" *ngIf="pacienteId()">
                <mat-icon class="text-base mr-1">check_circle</mat-icon>
                Paciente seleccionado: <strong class="ml-1">{{ pacForm.value.nombre }}</strong>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Agudeza Visual Section -->
        <mat-card class="form-card">
          <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
            <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
              <mat-icon class="text-primary">visibility</mat-icon>
              Agudeza Visual (20/…)
            </mat-card-title>
            <mat-card-subtitle class="text-gray-600">Mediciones de agudeza visual</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div class="font-medium mb-4 flex items-center gap-2">
                  <mat-icon class="text-gray-600 text-base">remove_red_eye</mat-icon>
                  Sin lentes
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <mat-form-field appearance="fill" class="custom-form-field">
                    <mat-label>O.D.</mat-label>
                    <input matInput type="number" min="10" max="200" [ngModelOptions]="{standalone:true}" [(ngModel)]="avSinOD">
                    <mat-icon matPrefix class="prefix-icon">visibility</mat-icon>
                  </mat-form-field>
                  <mat-form-field appearance="fill" class="custom-form-field">
                    <mat-label>O.I.</mat-label>
                    <input matInput type="number" min="10" max="200" [ngModelOptions]="{standalone:true}" [(ngModel)]="avSinOI">
                    <mat-icon matPrefix class="prefix-icon">visibility</mat-icon>
                  </mat-form-field>
                </div>
              </div>
              <div>
                <div class="font-medium mb-4 flex items-center gap-2">
                  <mat-icon class="text-gray-600 text-base">lens</mat-icon>
                  Con lentes
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <mat-form-field appearance="fill" class="custom-form-field">
                    <mat-label>O.D.</mat-label>
                    <input matInput type="number" min="10" max="200" [ngModelOptions]="{standalone:true}" [(ngModel)]="avConOD">
                    <mat-icon matPrefix class="prefix-icon">lens</mat-icon>
                  </mat-form-field>
                  <mat-form-field appearance="fill" class="custom-form-field">
                    <mat-label>O.I.</mat-label>
                    <input matInput type="number" min="10" max="200" [ngModelOptions]="{standalone:true}" [(ngModel)]="avConOI">
                    <mat-icon matPrefix class="prefix-icon">lens</mat-icon>
                  </mat-form-field>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- RX Section -->
        <mat-card class="form-card">
          <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
            <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
              <mat-icon class="text-primary">healing</mat-icon>
              R.X. - Prescripción
            </mat-card-title>
            <mat-card-subtitle class="text-gray-600">Valores de lejos y cerca</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="overflow-auto rounded-lg border border-gray-200">
              <table class="w-full text-sm bg-white">
                <thead class="bg-gray-50">
                  <tr class="text-left text-gray-700">
                    <th class="w-24 py-3 px-4 font-medium">Distancia</th>
                    <th class="w-16 py-3 px-4 font-medium">Ojo</th>
                    <th class="py-3 px-4 font-medium">Esf.</th>
                    <th class="py-3 px-4 font-medium">Cyl.</th>
                    <th class="py-3 px-4 font-medium">Eje</th>
                    <th class="py-3 px-4 font-medium">ADD</th>
                    <th class="py-3 px-4 font-medium">D.I.P.</th>
                    <th class="py-3 px-4 font-medium">ALT. OBLEA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of filasRx; let i = index" 
                      [class.bg-gray-50]="i % 2 === 0"
                      class="transition-colors hover:bg-blue-50">
                    <td class="py-3 px-4 font-medium">{{ r.dist }}</td>
                    <td class="py-3 px-4 font-medium">{{ r.ojo }}</td>
                    <td class="py-3 px-4">
                      <input class="rx-input" type="number" [ngModelOptions]="{standalone:true}" [(ngModel)]="r.esf" placeholder="0.00">
                    </td>
                    <td class="py-3 px-4">
                      <input class="rx-input" type="number" [ngModelOptions]="{standalone:true}" [(ngModel)]="r.cyl" placeholder="0.00">
                    </td>
                    <td class="py-3 px-4">
                      <input class="rx-input" type="number" [ngModelOptions]="{standalone:true}" [(ngModel)]="r.eje" placeholder="0">
                    </td>
                    <td class="py-3 px-4">
                      <input class="rx-input" type="number" [ngModelOptions]="{standalone:true}" [(ngModel)]="r.add" placeholder="0.00">
                    </td>
                    <td class="py-3 px-4">
                      <input class="rx-input" type="text" [ngModelOptions]="{standalone:true}" [(ngModel)]="r.dip" placeholder="55-70">
                    </td>
                    <td class="py-3 px-4">
                      <input class="rx-input" type="number" [ngModelOptions]="{standalone:true}" [(ngModel)]="r.altOblea" placeholder="0">
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Materiales Section -->
        <mat-card class="form-card">
          <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
            <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
              <mat-icon class="text-primary">inventory</mat-icon>
              Materiales y Lentes
            </mat-card-title>
            <mat-card-subtitle class="text-gray-600">Selecciona materiales requeridos</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="grid grid-cols-12 gap-4 items-end">
              <mat-form-field appearance="fill" class="col-span-5 custom-form-field">
                <mat-label>Selecciona material</mat-label>
                <mat-select [(ngModel)]="materialSelId" [ngModelOptions]="{standalone:true}">
                  <mat-option *ngFor="let m of materiales()" [value]="m.id">
                    {{ m.descripcion }} <span *ngIf="m.marca" class="text-gray-500">— {{ m.marca }}</span>
                  </mat-option>
                </mat-select>
                <mat-icon matPrefix class="prefix-icon">inventory_2</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="fill" class="col-span-5 custom-form-field">
                <mat-label>Observaciones</mat-label>
                <input matInput [(ngModel)]="materialObs" [ngModelOptions]="{standalone:true}" placeholder="Observaciones del material">
                <mat-icon matPrefix class="prefix-icon">note</mat-icon>
              </mat-form-field>

              <div class="col-span-2">
                <button mat-flat-button 
                        color="primary" 
                        (click)="agregarMaterial()" 
                        [disabled]="!materialSelId"
                        class="add-button">
                  <mat-icon>add</mat-icon>
                  Agregar
                </button>
              </div>
            </div>

            <div class="mt-6" *ngIf="materialesSel().length">
              <div class="text-sm font-medium mb-3 flex items-center gap-2">
                <mat-icon class="text-base">checklist</mat-icon>
                Materiales Seleccionados
              </div>
              <ul class="space-y-2">
                <li *ngFor="let x of materialesSel(); let i=index" 
                    class="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3 transition-all hover:bg-blue-100">
                  <div class="flex items-center gap-3">
                    <mat-icon class="text-primary text-base">lens</mat-icon>
                    <div>
                      <span class="font-medium text-gray-800">{{ x.descripcion }}</span>
                      <span class="text-xs text-gray-600 ml-2" *ngIf="x.marca">{{ x.marca }}</span>
                      <div class="text-xs text-gray-500 mt-1" *ngIf="x.observaciones">{{ x.observaciones }}</div>
                    </div>
                  </div>
                  <button mat-icon-button 
                          (click)="quitarMaterial(i)" 
                          title="Quitar"
                          class="remove-button">
                    <mat-icon>close</mat-icon>
                  </button>
                </li>
              </ul>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Lente de Contacto Section -->
        <mat-card class="form-card">
          <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
            <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
              <mat-icon class="text-primary">contact_lens</mat-icon>
              Lentes de Contacto
            </mat-card-title>
            <mat-card-subtitle class="text-gray-600">Especificaciones de lentes de contacto</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="grid grid-cols-12 gap-4 items-end">
              <mat-form-field appearance="fill" class="col-span-3 custom-form-field">
                <mat-label>Tipo</mat-label>
                <mat-select [(ngModel)]="lcTipo" [ngModelOptions]="{standalone:true}">
                  <mat-option value="Esferico">Esférico</mat-option>
                  <mat-option value="Torico">Tórico</mat-option>
                  <mat-option value="Otro">Otro</mat-option>
                </mat-select>
                <mat-icon matPrefix class="prefix-icon">category</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="fill" class="col-span-3 custom-form-field">
                <mat-label>Marca</mat-label>
                <input matInput [(ngModel)]="lcMarca" [ngModelOptions]="{standalone:true}" placeholder="ACUVUE OASYS, Biofinity...">
                <mat-icon matPrefix class="prefix-icon">branding_watermark</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="fill" class="col-span-3 custom-form-field">
                <mat-label>Modelo</mat-label>
                <input matInput [(ngModel)]="lcModelo" [ngModelOptions]="{standalone:true}" placeholder="ULTRA, XR...">
                <mat-icon matPrefix class="prefix-icon">model_training</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="fill" class="col-span-3 custom-form-field">
                <mat-label>Observaciones</mat-label>
                <input matInput [(ngModel)]="lcObs" [ngModelOptions]="{standalone:true}">
                <mat-icon matPrefix class="prefix-icon">notes</mat-icon>
              </mat-form-field>
            </div>

            <button mat-stroked-button 
                    (click)="agregarLC()"
                    class="action-button mt-4">
              <mat-icon>add_circle</mat-icon>
              Agregar Lente de Contacto
            </button>

            <div class="mt-6" *ngIf="lcSel().length">
              <div class="text-sm font-medium mb-3 flex items-center gap-2">
                <mat-icon class="text-base">checklist</mat-icon>
                Lentes de Contacto Seleccionados
              </div>
              <ul class="space-y-2">
                <li *ngFor="let x of lcSel(); let i=index" 
                    class="flex items-center justify-between bg-green-50 rounded-lg px-4 py-3 transition-all hover:bg-green-100">
                  <div class="flex items-center gap-3">
                    <mat-icon class="text-primary text-base">contact_lens</mat-icon>
                    <div>
                      <span class="font-medium text-gray-800">{{ x.tipo }}</span>
                      <span class="text-xs text-gray-600 ml-2" *ngIf="x.marca">• {{ x.marca }}</span>
                      <span class="text-xs text-gray-600 ml-1" *ngIf="x.modelo">• {{ x.modelo }}</span>
                      <div class="text-xs text-gray-500 mt-1" *ngIf="x.observaciones">{{ x.observaciones }}</div>
                    </div>
                  </div>
                  <button mat-icon-button 
                          (click)="quitarLC(i)" 
                          title="Quitar"
                          class="remove-button">
                    <mat-icon>close</mat-icon>
                  </button>
                </li>
              </ul>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Observaciones y Acciones Section -->
        <mat-card class="form-card">
          <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
            <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
              <mat-icon class="text-primary">notes</mat-icon>
              Observaciones Finales
            </mat-card-title>
            <mat-card-subtitle class="text-gray-600">Notas adicionales y acciones</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <mat-form-field appearance="fill" class="w-full custom-form-field">
              <mat-label>Observaciones y notas del examen</mat-label>
              <textarea rows="4" matInput [(ngModel)]="observaciones" [ngModelOptions]="{standalone:true}" placeholder="Escribe aquí cualquier observación importante..."></textarea>
              <mat-icon matPrefix class="prefix-icon">notes</mat-icon>
            </mat-form-field>

            <div class="flex gap-4 pt-4">
              <button mat-flat-button 
                      color="primary" 
                      (click)="guardar()" 
                      [disabled]="!pacienteId()"
                      class="action-button flex-1">
                <mat-icon>save</mat-icon>
                Guardar Borrador
              </button>
              <button mat-flat-button 
                      color="primary" 
                      (click)="abrirEnviarLab()" 
                      [disabled]="!historiaId()"
                      class="save-button flex-1">
                <mat-icon>send</mat-icon>
                Registrar pago / adelanto
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Col 3: Últimas visitas -->
      <div class="space-y-8">
        <mat-card class="form-card">
          <mat-card-header class="border-b border-gray-100 pb-4">
            <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
              <mat-icon class="text-primary">history</mat-icon>
              Historial del Paciente
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <app-ultimas-visitas [pacienteId]="pacienteId()"></app-ultimas-visitas>            
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  </div>
  `,
  styles: [`
  .dashboard-container{
  padding: 20px;
  background: rgba(245, 245, 245, 0.8); /* 80% opaco */
  /* equivalente moderno: background: #f5f5f5cc;  cc ≈ 0.8 */
  min-height: 100vh;
}
    :host { 
      display: block; 
      padding: 1rem;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      min-height: 100vh;
    }

    .form-card { 
      border-radius: 16px; 
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border-left: 4px solid #06b6d4;
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }

    .form-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    .text-primary {
      color: #06b6d4;
    }

    .save-button {
      background-color: #06b6d4 !important;
      color: white !important;
      border-radius: 8px;
      padding: 0 20px;
      transition: all 0.3s ease;
    }

    .save-button:hover:not(:disabled) {
      background-color: #0891b2 !important;
      transform: scale(1.02);
    }

    .save-button:disabled {
      background-color: #cbd5e1 !important;
      transform: none;
    }

    .action-button {
      border-color: #94a3b8;
      color: #64748b;
      border-radius: 8px;
      padding: 0 20px;
      transition: all 0.3s ease;
    }

    .action-button:hover:not(:disabled) {
      border-color: #06b6d4;
      color: #06b6d4;
      transform: scale(1.02);
    }

    .add-button {
      background-color: #06b6d4 !important;
      color: white !important;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .add-button:hover:not(:disabled) {
      background-color: #0891b2 !important;
      transform: scale(1.05);
    }

    .remove-button {
      color: #94a3b8;
      transition: all 0.3s ease;
    }

    .remove-button:hover {
      color: #ef4444;
      background-color: rgba(239, 68, 68, 0.1);
      transform: scale(1.1);
    }

    /* Estilos para los campos de formulario */
    .custom-form-field {
      width: 100%;
    }

    .prefix-icon {
      color: #06b6d4;
      margin-right: 8px;
    }

    /* Estilos para mat-form-field fill */
    .mat-form-field-appearance-fill .mat-form-field-flex {
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: 8px;
      padding: 0.75em 0.75em 0 0.75em;
      transition: all 0.3s ease;
    }

    .mat-form-field-appearance-fill.mat-form-field-can-float.mat-form-field-should-float .mat-form-field-label {
      transform: translateY(-0.5em) scale(0.75);
    }

    .mat-form-field-appearance-fill .mat-form-field-underline::before {
      background-color: #e2e8f0;
    }

    .mat-form-field-appearance-fill.mat-focused .mat-form-field-flex {
      background-color: rgba(255, 255, 255, 1);
      box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2);
    }

    .mat-form-field-appearance-fill.mat-focused .mat-form-field-label {
      color: #06b6d4;
    }

    .mat-form-field-appearance-fill.mat-focused .mat-form-field-ripple {
      background-color: #06b6d4;
    }

    .mat-form-field.mat-form-field-invalid .mat-form-field-flex {
      background-color: rgba(254, 242, 242, 0.9);
    }

    /* Estilos para la tabla RX */
    .rx-input {
      width: 100%;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 0.5rem;
      font-size: 0.875rem;
      transition: all 0.3s ease;
    }

    .rx-input:focus {
      outline: none;
      border-color: #06b6d4;
      box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2);
    }

    .rx-input:hover {
      border-color: #cbd5e1;
    }

    /* Progress bar personalizado */
    .mat-progress-bar {
      border-radius: 4px;
    }

    .mat-progress-bar-fill::after {
      background-color: #06b6d4;
    }

    mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* Asegurar que no haya líneas no deseadas */
    .mat-form-field-appearance-fill .mat-form-field-infix {
      border-top: 0;
    }

    .mat-form-field-appearance-fill .mat-form-field-prefix {
      top: 0;
      margin-right: 8px;
    }

    .mat-form-field-appearance-fill .mat-form-field-prefix, 
    .mat-form-field-appearance-fill .mat-form-field-suffix {
      align-self: flex-start;
      margin-top: 0.5em;
    }
  `]
})
export class HistoriaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private pacApi = inject(PacientesService);
  private hisApi = inject(HistoriasService);
  private matApi = inject(MaterialesService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  loading = signal(false);

  // Paciente
  pacForm = this.fb.group({
    nombre: ['', Validators.required],
    edad:   [0, [Validators.required, Validators.min(0), Validators.max(120)]],
    telefono: [''],
    ocupacion: [''],
    direccion: ['']
  });
  pacienteId = signal<string | null>(null);  
  sugeridos = signal<PacienteItem[]>([]);

  // AV
  avSinOD?: number; avSinOI?: number;
  avConOD?: number; avConOI?: number;

  // RX 4 filas
  filasRx: any[] = [
    { dist: 'Lejos', ojo: 'OD', esf: null, cyl: null, eje: null, add: null, dip: '', altOblea: null },
    { dist: 'Lejos', ojo: 'OI', esf: null, cyl: null, eje: null, add: null, dip: '', altOblea: null },
    { dist: 'Cerca', ojo: 'OD', esf: null, cyl: null, eje: null, add: null, dip: '', altOblea: null },
    { dist: 'Cerca', ojo: 'OI', esf: null, cyl: null, eje: null, add: null, dip: '', altOblea: null },
  ];

  // Materiales
  materiales = signal<MaterialItem[]>([]);
  materialesSel = signal<(MaterialItem & { observaciones?: string })[]>([]);
  materialSelId: string | null = null;
  materialObs: string = '';

  // Lente de contacto
  lcSel = signal<LcDto[]>([]);
  lcTipo: LcDto['tipo'] = 'Esferico';
  lcMarca = ''; lcModelo = ''; lcObs = '';

  observaciones: string = '';
  historiaId = signal<string | null>(null);

  ngOnInit() {
    // Autocomplete de pacientes
    this.pacForm.controls.nombre.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(v => {
        if (!v || (this.pacienteId() && v === this.pacForm.value.nombre)) return of([]);
        return this.pacApi.search(v);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(list => this.sugeridos.set(list));

    // Cargar catálogo de materiales
    this.matApi.list().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (list) => this.materiales.set(list || []),
      error: () => this.materiales.set([])
    });
  }  

  selectPaciente(p: PacienteItem) {
  this.pacienteId.set(p.id);
  this.pacForm.patchValue({
    nombre: p.nombre,
    edad: p.edad,
    telefono: p.telefono,
    ocupacion: p.ocupacion
  });
}

  crearPaciente() {
    if (!this.pacForm.valid) return;
    this.loading.set(true);
    const req = this.pacForm.value as any;
    this.pacApi.create(req).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: p => {
        this.pacienteId.set(p.id);
        this.snack.open('✅ Paciente creado exitosamente', 'Cerrar', { 
          duration: 3000,
          panelClass: ['bg-green-500', 'text-white']
        });
      },
      error: () => this.snack.open('❌ Error al crear paciente', 'Cerrar', { 
        duration: 3000,
        panelClass: ['bg-red-500', 'text-white']
      }),
      complete: () => this.loading.set(false)
    });
  }

  agregarMaterial() {
    const id = this.materialSelId;
    if (!id) return;
    const mat = this.materiales().find(m => m.id === id);
    if (!mat) return;
    this.materialesSel.update(arr => [...arr, { ...mat, observaciones: this.materialObs || undefined }]);
    this.materialSelId = null; 
    this.materialObs = '';
  }

  quitarMaterial(i: number) {
    this.materialesSel.update(arr => arr.filter((_, idx) => idx !== i));
  }

  agregarLC() {
    this.lcSel.update(arr => [...arr, {
      tipo: this.lcTipo, 
      marca: this.lcMarca || null, 
      modelo: this.lcModelo || null, 
      observaciones: this.lcObs || null
    }]);
    this.lcTipo = 'Esferico'; 
    this.lcMarca = ''; 
    this.lcModelo = ''; 
    this.lcObs = '';
  }

  quitarLC(i: number) {
    this.lcSel.update(arr => arr.filter((_, idx) => idx !== i));
  }

  private clampAV(n?: number) {
    if (n == null) return n;
    return Math.min(200, Math.max(10, n));
  }

  private buildPayload(): CrearHistoriaRequest | null {
    const pid = this.pacienteId();
    if (!pid) { 
      this.snack.open('⚠️ Selecciona o crea un paciente primero', 'Cerrar', { 
        duration: 3000,
        panelClass: ['bg-yellow-500', 'text-white']
      }); 
      return null; 
    }

    const av: AgudezaDto[] = [];
    if (this.avSinOD) av.push({ condicion: 'SinLentes', ojo: 'OD', denominador: this.clampAV(this.avSinOD)! });
    if (this.avSinOI) av.push({ condicion: 'SinLentes', ojo: 'OI', denominador: this.clampAV(this.avSinOI)! });
    if (this.avConOD) av.push({ condicion: 'ConLentes', ojo: 'OD', denominador: this.clampAV(this.avConOD)! });
    if (this.avConOI) av.push({ condicion: 'ConLentes', ojo: 'OI', denominador: this.clampAV(this.avConOI)! });

    const rx = this.filasRx.map(r => ({
      ojo: r.ojo, 
      distancia: r.dist,
      esf: r.esf != null ? +r.esf : null,
      cyl: r.cyl != null ? +r.cyl : null,
      eje: r.eje != null ? +r.eje : null,
      add: r.add != null ? +r.add : null,
      dip: r.dip || null,
      altOblea: r.altOblea != null ? +r.altOblea : null
    }));

    const materiales: MaterialDto[] = this.materialesSel().map(x => ({ 
      materialId: x.id, 
      observaciones: x.observaciones || null 
    }));
    
    const lentesContacto: LcDto[] = this.lcSel();

    const payload: CrearHistoriaRequest = {
      pacienteId: pid,
      observaciones: this.observaciones || null,
      av, rx, materiales, lentesContacto
    };
    return payload;
  }

  guardar() {
    const payload = this.buildPayload();
    if (!payload) return;
    this.loading.set(true);
    this.hisApi.crear(payload).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => { 
        this.historiaId.set(res.id); 
        this.snack.open('✅ Historia guardada exitosamente', 'Cerrar', { 
          duration: 3000,
          panelClass: ['bg-green-500', 'text-white']
        }); 
      },
      error: () => this.snack.open('❌ Error al guardar historia', 'Cerrar', { 
        duration: 3000,
        panelClass: ['bg-red-500', 'text-white']
      }),
      complete: () => this.loading.set(false)
    });
  }

  abrirEnviarLab() {
    if (!this.historiaId()) return;
    const ref = this.dialog.open(EnviarLabDialog, { 
      width: '720px',
      panelClass: ['rounded-2xl', 'shadow-xl']
    });
    ref.afterClosed().subscribe(data => {
      if (!data) return;
      this.loading.set(true);
      this.hisApi.enviarALab(this.historiaId()!, {
        total: +data.total,
        pagos: (data.pagos || []).map((p: any) => ({
          metodo: p.metodo, 
          monto: +p.monto, 
          autorizacion: p.autorizacion || null, 
          nota: p.nota || null
        })),
        fechaEstimadaEntrega: data.fechaEstimadaEntrega || null
      }).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => this.snack.open('✅ Orden enviada a laboratorio', 'Cerrar', { 
          duration: 3000,
          panelClass: ['bg-green-500', 'text-white']
        }),
        error: () => this.snack.open('❌ Error al enviar a laboratorio', 'Cerrar', { 
          duration: 3000,
          panelClass: ['bg-red-500', 'text-white']
        }),
        complete: () => this.loading.set(false)
      });
    });
  }
}