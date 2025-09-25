import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../admin/users/users.service';

function matchPassword(group: AbstractControl): ValidationErrors | null {
  const p1 = group.get('newPassword')?.value;
  const p2 = group.get('confirm')?.value;
  return p1 && p2 && p1 !== p2 ? { mismatch: true } : null;
}

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatCardModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
  <section class="max-w-4xl mx-auto space-y-8 p-4">
    <!-- Header -->
    <header class="flex items-center gap-4 mb-2">
      <button mat-icon-button 
              type="button" 
              (click)="goBack()" 
              aria-label="Regresar"
              class="back-button">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Perfil de Usuario</h1>
        <p class="text-gray-600 text-sm">Gestiona tu información personal y seguridad</p>
      </div>
    </header>

    <!-- Perfil Section -->
    <mat-card class="profile-card">
      <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
        <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
          <mat-icon class="text-primary">person</mat-icon>
          Información Personal
        </mat-card-title>
        <mat-card-subtitle class="text-gray-600">Actualiza tus datos de contacto</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="grid gap-6 md:grid-cols-2">
          <mat-form-field appearance="fill" class="w-full custom-form-field">
            <mat-label>Nombre completo</mat-label>
            <input matInput formControlName="name" required />
            <mat-icon matPrefix class="prefix-icon">person</mat-icon>
            <mat-error *ngIf="profileForm.controls.name.hasError('required')">Campo requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill" class="w-full custom-form-field">
            <mat-label>Correo electrónico</mat-label>
            <input matInput formControlName="email" type="email" required />
            <mat-icon matPrefix class="prefix-icon">email</mat-icon>
            <mat-error *ngIf="profileForm.controls.email.hasError('required')">Campo requerido</mat-error>
            <mat-error *ngIf="profileForm.controls.email.hasError('email')">Formato de email inválido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill" class="w-full md:col-span-2 custom-form-field">
            <mat-label>Teléfono</mat-label>
            <input matInput formControlName="phoneNumber" />
            <mat-icon matPrefix class="prefix-icon">phone</mat-icon>
          </mat-form-field>

          <div class="md:col-span-2 flex justify-end gap-3 pt-4">
            <button mat-stroked-button 
                    type="button" 
                    (click)="resetProfile()"
                    class="cancel-button">
              <mat-icon>refresh</mat-icon>
              Restaurar
            </button>
            <button mat-flat-button 
                    type="submit" 
                    [disabled]="profileForm.invalid || savingProfile() || !profileForm.dirty"
                    class="save-button">
              <mat-icon>{{ savingProfile() ? 'hourglass_empty' : 'save' }}</mat-icon>
              {{ savingProfile() ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <!-- Password Section -->
    <mat-card class="profile-card">
      <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
        <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
          <mat-icon class="text-primary">lock</mat-icon>
          Seguridad y Contraseña
        </mat-card-title>
        <mat-card-subtitle class="text-gray-600">Cambia tu contraseña periódicamente</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <form [formGroup]="passForm" (ngSubmit)="changePass()" class="grid gap-6 md:grid-cols-2">
          <mat-form-field appearance="fill" class="w-full md:col-span-2 custom-form-field">
            <mat-label>Contraseña actual</mat-label>
            <input matInput 
                   type="password" 
                   formControlName="currentPassword" 
                   required 
                   autocomplete="current-password" />
            <mat-icon matPrefix class="prefix-icon">vpn_key</mat-icon>
            <mat-error *ngIf="passForm.controls.currentPassword.hasError('required')">Campo requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill" class="w-full custom-form-field">
            <mat-label>Nueva contraseña</mat-label>
            <input matInput 
                   type="password" 
                   formControlName="newPassword" 
                   required 
                   minlength="6"
                   autocomplete="new-password" />
            <mat-icon matPrefix class="prefix-icon">password</mat-icon>
            <mat-error *ngIf="passForm.controls.newPassword.hasError('required')">Campo requerido</mat-error>
            <mat-error *ngIf="passForm.controls.newPassword.hasError('minlength')">Mínimo 6 caracteres</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill" class="w-full custom-form-field">
            <mat-label>Confirmar contraseña</mat-label>
            <input matInput 
                   type="password" 
                   formControlName="confirm" 
                   required 
                   autocomplete="new-password" />
            <mat-icon matPrefix class="prefix-icon">check_circle</mat-icon>
            <mat-error *ngIf="passForm.hasError('mismatch')">Las contraseñas no coinciden</mat-error>
          </mat-form-field>

          <div class="md:col-span-2 flex justify-end gap-3 pt-4">
            <button mat-flat-button 
                    type="submit" 
                    [disabled]="passForm.invalid || savingPass()"
                    class="save-button">
              <mat-icon>{{ savingPass() ? 'hourglass_empty' : 'lock_reset' }}</mat-icon>
              {{ savingPass() ? 'Actualizando...' : 'Actualizar contraseña' }}
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  </section>
  `,
  styles: [`
    :host { 
      display: block; 
      padding: 1rem;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      min-height: 100vh;
    }

    .profile-card { 
      border-radius: 16px; 
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border-left: 4px solid #06b6d4;
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }

    .profile-card:hover {
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

    .cancel-button {
      border-color: #94a3b8;
      color: #64748b;
      border-radius: 8px;
      padding: 0 20px;
      transition: all 0.3s ease;
    }

    .cancel-button:hover {
      border-color: #06b6d4;
      color: #06b6d4;
    }

    .back-button {
      color: #06b6d4;
      transition: all 0.3s ease;
    }

    .back-button:hover {
      background-color: rgba(6, 182, 212, 0.1);
      transform: scale(1.1);
    }

    /* Estilos mejorados para los campos de formulario */
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePage {
  private auth = inject(AuthService);
  private userService = inject(UsersService); 
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  savingProfile = signal(false);
  savingPass = signal(false);

  profileForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['']
  });

  passForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirm: ['', Validators.required],
  }, { validators: matchPassword });

  constructor() {
    this.initializeForm();
  }

  private initializeForm(): void {
    const user = this.auth.user?.() ?? null;    
    this.userService.getUserById(user?.id || '').subscribe({
      next: (data) => {        
        this.profileForm.patchValue({
          name: user?.name ?? '',
          email: data.email ?? '',
          phoneNumber: data.phoneNumber ?? ''
        });        
      },
      error: () => {
        this.showMessage('Error al restaurar los datos', 'error');
      }
    });
    if (user) {
      this.profileForm.patchValue({
        name: user.name ?? '',
        email: user.email ?? '',
        phoneNumber:  ''
      });
    }
  }

  resetProfile(): void {
    const user = this.auth.user?.() ?? null;    
    this.userService.getUserById(user?.id || '').subscribe({
      next: (data) => {        
        this.profileForm.patchValue({
          name: user?.name ?? '',
          email: data.email ?? '',
          phoneNumber: data.phoneNumber ?? ''
        });        
      },
      error: () => {
        this.showMessage('Error al restaurar los datos', 'error');
      }
    });
    if (user) {
      this.profileForm.reset({
        name: user.name ?? '',
        email: user.email ?? '',
        phoneNumber:  ''
      });
      this.showMessage('Cambios descartados', 'info');
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid || !this.profileForm.dirty) return;
    
    this.savingProfile.set(true);
    const formValue = this.profileForm.getRawValue();

    const updateMethod = (this.auth as any).updateProfile?.bind(this.auth) || 
                        (this.auth as any).updateUser?.bind(this.auth);

    if (!updateMethod || typeof updateMethod !== 'function') {
      this.handleError('No se encontró el método de actualización en AuthService.');
      return;
    }

    updateMethod(formValue)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.handleSuccess('Perfil actualizado correctamente'),
        error: (error: any) => this.handleError(error?.error?.message || 'Error al actualizar el perfil')
      });
  }

  changePass(): void {
    if (this.passForm.invalid) return;
    
    this.savingPass.set(true);
    const formValue = this.passForm.getRawValue();

    if (!(this.auth as any).changePassword) {
      this.handleError('No se encontró changePassword en AuthService.');
      return;
    }

    (this.auth as any).changePassword({ 
      currentPassword: formValue.currentPassword!, 
      newPassword: formValue.newPassword! 
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleSuccess('Contraseña actualizada correctamente');
          this.passForm.reset();
        },
        error: (error: any) => this.handleError(error?.error?.message || 'Error al actualizar la contraseña')
      });
  }

  private handleSuccess(message: string): void {
    this.savingProfile.set(false);
    this.savingPass.set(false);
    this.showMessage(message, 'success');
  }

  private handleError(errorMessage: string): void {
    this.savingProfile.set(false);
    this.savingPass.set(false);
    this.showMessage(errorMessage, 'error');
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: [
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' : 'bg-blue-500',
        'text-white'
      ]
    });
  }

  goBack(): void {
    history.back();
  }
}