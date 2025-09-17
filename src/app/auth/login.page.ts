import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule],
  template: `
  <div class="min-h-[80vh] grid place-items-center">
    <mat-card class="p-6 w-full max-w-md">
      <h1 class="text-xl font-bold mb-4">Iniciar sesión</h1>
      <form [formGroup]="form" class="space-y-4" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" required>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Contraseña</mat-label>
          <input matInput formControlName="password" type="password" required>
        </mat-form-field>
        <button mat-flat-button color="primary" class="w-full" [disabled]="form.invalid || loading()">Entrar</button>
        <div class="text-sm text-red-600" *ngIf="error()">{{ error() }}</div>
      </form>
    </mat-card>
  </div>
  `
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });


submit() {
  if (this.form.invalid) return;
  this.loading.set(true); this.error.set(null);
  const { email, password } = this.form.value as any;

  this.auth.login(email, password).subscribe({
    next: res => {
      this.auth.persist(res);         // <-- guarda access/refresh
      this.router.navigate(['/']);    // o a /inventario
    },
    error: _ => { this.error.set('Credenciales inválidas'); this.loading.set(false); }
  });
}

}
