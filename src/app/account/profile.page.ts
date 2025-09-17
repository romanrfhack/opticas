import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth/auth.service';

function matchPassword(group: AbstractControl): ValidationErrors | null {
  const p1 = group.get('newPassword')?.value;
  const p2 = group.get('confirm')?.value;
  return p1 && p2 && p1 !== p2 ? { mismatch: true } : null;
}

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="flex items-center mb-6">
        <button class="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 mr-3 hover:bg-cyan-600 hover:text-white transition-colors duration-200" (click)="goBack()">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl font-semibold text-gray-900">Mi Perfil</h1>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <!-- Tarjeta de Perfil -->
        <mat-card class="p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <h2 class="text-lg font-semibold mb-5 flex items-center text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Mi perfil
          </h2>
          
          <form [formGroup]="profileForm" class="space-y-5" (ngSubmit)="saveProfile()">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label class="text-gray-600">Email</mat-label>
              <input matInput [value]="auth.user()?.email" readonly class="text-gray-500">
              <mat-icon matSuffix class="text-gray-400">email</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label class="text-gray-600">Nombre</mat-label>
              <input matInput formControlName="fullName" required class="placeholder-gray-400">
              <span matSuffix class="text-red-500">*</span>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label class="text-gray-600">Teléfono</mat-label>
              <input matInput formControlName="phoneNumber" class="placeholder-gray-400">
              <mat-icon matSuffix class="text-gray-400">phone</mat-icon>
            </mat-form-field>

            <div class="flex justify-end gap-3 pt-2">
              <button mat-button type="button" 
                class="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                (click)="resetProfile()">
                Restaurar
              </button>
              <button mat-flat-button color="primary" 
                class="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                [disabled]="profileForm.invalid || savingProfile()">
                Guardar
              </button>
            </div>
            
            <div class="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200" *ngIf="profileOk()">
              Perfil actualizado.
            </div>
            <div class="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200" *ngIf="profileErr()">
              {{ profileErr() }}
            </div>
          </form>
        </mat-card>

        <!-- Tarjeta de Cambio de Contraseña -->
        <mat-card class="p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <h2 class="text-lg font-semibold mb-5 flex items-center text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Cambiar contraseña
          </h2>
          
          <form [formGroup]="passForm" class="space-y-5" (ngSubmit)="changePass()">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label class="text-gray-600">Contraseña actual</mat-label>
              <input matInput type="password" formControlName="currentPassword" required class="placeholder-gray-400">
              <span matSuffix class="text-red-500">*</span>
            </mat-form-field>

            <div class="grid md:grid-cols-2 gap-4">
              <mat-form-field appearance="outline">
                <mat-label class="text-gray-600">Nueva contraseña</mat-label>
                <input matInput type="password" formControlName="newPassword" required class="placeholder-gray-400">
                <span matSuffix class="text-red-500">*</span>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label class="text-gray-600">Confirmar</mat-label>
                <input matInput type="password" formControlName="confirm" required class="placeholder-gray-400">
                <span matSuffix class="text-red-500">*</span>
              </mat-form-field>
            </div>

            <div class="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200" *ngIf="passForm.hasError('mismatch')">
              Las contraseñas no coinciden
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button mat-button type="button" 
                class="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                (click)="passForm.reset()">
                Limpiar
              </button>
              <button mat-flat-button color="primary" 
                class="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                [disabled]="passForm.invalid || savingPass()">
                Actualizar
              </button>
            </div>
            
            <div class="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200" *ngIf="passOk()">
              Contraseña actualizada.
            </div>
            <div class="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200" *ngIf="passErr()">
              {{ passErr() }}
            </div>
          </form>
        </mat-card>
      </div>
    </div>
  </div>
  `
})
export class ProfilePage {
  auth = inject(AuthService);
  fb = inject(FormBuilder);

  profileForm = this.fb.group({
    fullName: [this.auth.user()?.name ?? '', [Validators.required]],
    phoneNumber: ['']
  });
  passForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirm: ['', Validators.required]
  }, { validators: matchPassword });

  savingProfile = signal(false);
  profileOk = signal(false);
  profileErr = signal<string | null>(null);

  savingPass = signal(false);
  passOk = signal(false);
  passErr = signal<string | null>(null);

  resetProfile(){
    this.profileForm.patchValue({ fullName: this.auth.user()?.name ?? '', phoneNumber: '' });
  }

  saveProfile(){
    if (this.profileForm.invalid) return;
    this.savingProfile.set(true); this.profileOk.set(false); this.profileErr.set(null);
    const v = this.profileForm.value as any;
    this.auth.updateProfile({ fullName: v.fullName!, phoneNumber: v.phoneNumber || undefined }).subscribe({
      next: _ => { this.savingProfile.set(false); this.profileOk.set(true); this.auth.syncUserName(v.fullName!); },
      error: (e) => { this.savingProfile.set(false); this.profileErr.set(e?.error?.message || 'Error al actualizar'); }
    });
  }

  changePass(){
    if (this.passForm.invalid) return;
    this.savingPass.set(true); this.passOk.set(false); this.passErr.set(null);
    const v = this.passForm.value as any;
    this.auth.changePassword({ currentPassword: v.currentPassword!, newPassword: v.newPassword! }).subscribe({
      next: _ => { this.savingPass.set(false); this.passOk.set(true); this.passForm.reset(); },
      error: (e) => { this.savingPass.set(false); this.passErr.set(e?.error?.message || 'No se pudo actualizar'); }
    });
  }

  goBack() {
    // Implementar lógica para retroceder
    window.history.back();
  }
}