import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="relative min-h-screen flex items-center justify-center p-4 bg-no-repeat bg-cover bg-center"
       [style.background-image]="'url(' + bgUrl + ')'">
    <!-- Overlay -->
    <div class="absolute inset-0 bg-black/10"></div>

    <div class="relative w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-md p-6">      
      <!-- Logo -->
      <div class="mb-4 flex justify-center">
        <img [src]="logoUrl" alt="Óptica" class="w-20 h-20 object-contain select-none" />
      </div>

      <!-- Encabezado -->
      <div class="mb-6 text-center">
        <div class="text-2xl font-semibold text-gray-900">Ópticas Olivar</div>
        <div class="text-sm text-gray-500">Acceso</div>
      </div>

      <form [formGroup]="form" class="space-y-4" (ngSubmit)="submit()">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Correo</label>
          <input type="email" formControlName="email"
                 class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input type="password" formControlName="password"
                 class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]" />
        </div>

        <div class="flex items-center justify-between text-sm">
          <a class="text-[#06b6d4] hover:underline cursor-pointer" (click)="goForgot()">¿Olvidó su contraseña?</a>
          <!-- <a class="text-gray-600 hover:underline cursor-pointer" (click)="goSoporte()">Soporte técnico</a> -->
        </div>

        <button type="submit"
                [disabled]="form.invalid || loading()"
                class="w-full rounded-lg bg-[#06b6d4] text-white py-2 font-medium hover:opacity-90 disabled:opacity-50 transition">
          {{ loading() ? 'Entrando…' : 'Entrar' }}
        </button>

        <p *ngIf="error()" class="text-center text-sm text-red-600">{{ error() }}</p>
      </form>
    </div>
  </div>
  `
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);

  logoUrl = 'assets/img/logo.webp';
  bgUrl = 'assets/img/fondo.webp';

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true); 
    this.error.set(null);
    const { email, password } = this.form.value as any;

    this.auth.login(email, password).subscribe({
        next: (res) => this.handleLoginSuccess(res),
        error: () => this.handleLoginError()
    });
  }

  private handleLoginSuccess(res: any): void {
      this.auth.persist(res);
      this.loading.set(false);
      
      const userRoles = this.auth.user()?.roles || [];
      console.log('Roles del usuario:', userRoles);

      this.navigateByRole(userRoles);
  }

  private handleLoginError(): void {
      this.error.set('Credenciales inválidas');
      this.loading.set(false);
  }

  private navigateByRole(roles: string[]): void {
    const navigationRoutes = {
          mensajero: '/ordenes',
          admin: '/dashboard',
          encargado: '/dashboard',
          default: '/clinica/historia'
      };

      if (roles.includes('Mensajero')) {
          console.log('El usuario es un Mensajero');
          this.router.navigate([navigationRoutes.mensajero]);
          return;
      }

      if (roles.includes('Admin') || roles.includes('Encargado')) {
          console.log('El usuario es Admin o Encargado');
          this.router.navigate([navigationRoutes.admin]);
          return;
      }

      console.log('Navegando a ruta por defecto');
      this.router.navigate([navigationRoutes.default]);
  }

  goLogin(){ this.router.navigateByUrl('/login'); }
  goForgot(){ this.router.navigateByUrl('/forgot-password'); }
  goSoporte(){ this.router.navigateByUrl('/soporte'); }
}
