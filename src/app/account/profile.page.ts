import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../auth/auth.service';

function matchPassword(group: AbstractControl): ValidationErrors | null {
  const p1 = group.get('newPassword')?.value;
  const p2 = group.get('confirm')?.value;
  return p1 && p2 && p1 !== p2 ? { mismatch: true } : null;
}

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  template: `
  <section class="max-w-4xl mx-auto space-y-6">
    <header class="flex items-center gap-3">
      <button mat-icon-button type="button" (click)="goBack()" aria-label="Regresar">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1 class="text-2xl font-bold">Perfil</h1>
    </header>

    <!-- Perfil -->
    <mat-card class="p-4">
      <h2 class="text-lg font-semibold mb-4">Datos de usuario</h2>

      <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="grid gap-4 md:grid-cols-2">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" required />
          <mat-error *ngIf="profileForm.controls.name.hasError('required')">Requerido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" required />
          <mat-error *ngIf="profileForm.controls.email.hasError('required')">Requerido</mat-error>
          <mat-error *ngIf="profileForm.controls.email.hasError('email')">Formato inválido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full md:col-span-2">
          <mat-label>Teléfono</mat-label>
          <input matInput formControlName="phoneNumber" />
          <mat-icon matSuffix>phone</mat-icon>
        </mat-form-field>

        <div class="md:col-span-2 flex justify-end gap-3">
          <button mat-button type="button" (click)="resetProfile()">Restaurar</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="profileForm.invalid || savingProfile()">
            {{ savingProfile() ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>

        <div class="md:col-span-2 text-sm" *ngIf="profileOk() || profileErr()">
          <span class="text-green-600" *ngIf="profileOk()">Perfil actualizado</span>
          <span class="text-red-600" *ngIf="profileErr()">{{ profileErr() }}</span>
        </div>
      </form>
    </mat-card>

    <!-- Password -->
    <mat-card class="p-4">
      <h2 class="text-lg font-semibold mb-4">Cambiar contraseña</h2>

      <form [formGroup]="passForm" (ngSubmit)="changePass()" class="grid gap-4 md:grid-cols-2">
        <mat-form-field appearance="outline" class="w-full md:col-span-2">
          <mat-label>Contraseña actual</mat-label>
          <input matInput type="password" formControlName="currentPassword" required />
          <mat-error *ngIf="passForm.controls.currentPassword.hasError('required')">Requerida</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nueva contraseña</mat-label>
          <input matInput type="password" formControlName="newPassword" required minlength="6" />
          <mat-error *ngIf="passForm.controls.newPassword.hasError('required')">Requerida</mat-error>
          <mat-error *ngIf="passForm.controls.newPassword.hasError('minlength')">Mínimo 6 caracteres</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Confirmar nueva contraseña</mat-label>
          <input matInput type="password" formControlName="confirm" required />
          <mat-error *ngIf="passForm.hasError('mismatch')">No coincide</mat-error>
        </mat-form-field>

        <div class="md:col-span-2 flex justify-end gap-3">
          <button mat-flat-button color="primary" type="submit" [disabled]="passForm.invalid || savingPass()">
            {{ savingPass() ? 'Actualizando…' : 'Actualizar contraseña' }}
          </button>
        </div>

        <div class="md:col-span-2 text-sm" *ngIf="passOk() || passErr()">
          <span class="text-green-600" *ngIf="passOk()">Contraseña actualizada</span>
          <span class="text-red-600" *ngIf="passErr()">{{ passErr() }}</span>
        </div>
      </form>
    </mat-card>
  </section>
  `,
  styles: [`
    :host { display:block; }
    mat-card { border-radius: 12px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePage {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  savingProfile = signal(false);
  profileOk = signal(false);
  profileErr = signal<string | null>(null);

  savingPass = signal(false);
  passOk = signal(false);
  passErr = signal<string | null>(null);

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
    // Inicializa con datos del usuario actual si los tienes en AuthService
    const u = this.auth.user?.() ?? null;
    if (u) {
      this.profileForm.patchValue({
        name: u.name ?? '',
        email: u.email ?? '',
        phoneNumber: ''
      });
    }
  }

  resetProfile() {
    const u = this.auth.user?.() ?? null;
    if (u) {
      this.profileForm.reset({
        name: u.name ?? '',
        email: u.email ?? '',
        phoneNumber: ''
      });
      this.profileOk.set(false);
      this.profileErr.set(null);
    }
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    this.savingProfile.set(true); this.profileOk.set(false); this.profileErr.set(null);
    const v = this.profileForm.getRawValue();

    // Ajusta el método según tu AuthService: updateProfile o updateUser
    const req = (this.auth as any).updateProfile?.(v) || (this.auth as any).updateUser?.(v);

    if (!req || typeof req.subscribe !== 'function') {
      this.savingProfile.set(false);
      this.profileErr.set('No se encontró el método de actualización en AuthService.');
      return;
    }

    req.subscribe({
      next: () => { this.savingProfile.set(false); this.profileOk.set(true); },
      error: (e: any) => { this.savingProfile.set(false); this.profileErr.set(e?.error?.message || 'No se pudo actualizar'); }
    });
  }

  changePass() {
    if (this.passForm.invalid) return;
    this.savingPass.set(true); this.passOk.set(false); this.passErr.set(null);
    const v = this.passForm.getRawValue();
    if (!(this.auth as any).changePassword) {
      this.savingPass.set(false);
      this.passErr.set('No se encontró changePassword en AuthService.');
      return;
    }
    (this.auth as any).changePassword({ currentPassword: v.currentPassword!, newPassword: v.newPassword! })
      .subscribe({
        next: () => { this.savingPass.set(false); this.passOk.set(true); this.passForm.reset(); },
        error: (e: any) => { this.savingPass.set(false); this.passErr.set(e?.error?.message || 'No se pudo actualizar'); }
      });
  }

  goBack() { history.back(); }
}
