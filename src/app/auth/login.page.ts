import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Pipe, PipeTransform } from '@angular/core';


@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>Sistema de Gestión Óptica</h1>
        <p>Acceda a su cuenta para continuar</p>
      </div>
      
      <div class="login-body">
        <div class="logo-container">
          <div class="logo">                        
            <img src="assets/img/logo.webp" alt="Logo Óptica" class="logo-image" />
          </div>
          <h2>Ópticas Olivar</h2>
        </div>
        
        <form [formGroup]="form" class="login-form" (ngSubmit)="submit()">
          <div class="form-field">
            <mat-form-field appearance="fill" class="custom-form-field">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" required>
            </mat-form-field>
          </div>
          
          <div class="form-field">
            <mat-form-field appearance="fill" class="custom-form-field">
              <mat-label>Contraseña</mat-label>
              <input matInput formControlName="password" type="password" required>
            </mat-form-field>
          </div>
          
          <button mat-flat-button class="login-button" 
                  [disabled]="form.invalid || loading()">
            {{ loading() ? 'CARGANDO...' : 'INICIAR SESIÓN' }}
          </button>
          
          <div class="error-message" *ngIf="error()">
            {{ error() }}
          </div>
        </form>
        
        <div class="footer-links">
          <a href="#">¿Olvidó su contraseña?</a> • 
          <a href="#">Soporte técnico</a>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100vw;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1000;
    }
    
    .login-container {
        background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), 
                url('/assets/img/fondo.webp')  
                no-repeat center center fixed;
      background-size: cover;
      height: 100vh;  
      width: 100vw;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .login-card {
      background: rgba(255, 255, 255, 0.92);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      width: 100%;
      max-width: 440px;
      animation: fadeIn 0.8s ease-out;
    }
    
    .login-header {
      background: #06b6d4;
      color: white;
      padding: 24px;
      text-align: center;
    }
    
    .login-header h1 {
      font-size: 24px;
      font-weight: 500;
      margin-bottom: 8px;
    }
    
    .login-header p {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .login-body {
      padding: 24px;
    }
    
    .logo-container {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .logo {
      width: 120px;
      height: 120px;
      background: #f0f9ff;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      border: 2px solid #a5f3fc;
    }
    
    .logo-image {
      width: 100px;
      height: 100px;
      object-fit: contain;
    }
    
    .logo-container h2 {
      color: #334155;
      margin-bottom: 8px;
    }
    
    .login-form {
      margin-bottom: 16px;
    }
    
    .form-field {
      margin-bottom: 20px;
    }
    
    .custom-form-field {
      width: 100%;
    }
    
    .custom-form-field .mat-form-field-wrapper {
      padding-bottom: 0;
    }
    
    .custom-form-field .mat-form-field-outline {
      color: #cbd5e1;
    }
    
    .custom-form-field .mat-form-field-outline-thick {
      color: #06b6d4;
    }
    
    .custom-form-field .mat-form-field-label {
      color: #64748b;
    }
    
    .custom-form-field .mat-input-element {
      color: #1e293b;
      padding: 12px 0;
    }
    
    .login-button {
      background-color: #06b6d4;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 12px 0;
      width: 100%;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.3s;
      margin-top: 8px;
    }
    
    .login-button:hover:not([disabled]) {
      background-color: #0891b2;
    }
    
    .login-button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    
    .error-message {
      color: #e53e3e;
      font-size: 14px;
      margin-top: 12px;
      text-align: center;
      padding: 8px;
      background-color: #fed7d7;
      border-radius: 4px;
    }
    
    .footer-links {
      text-align: center;
      margin-top: 20px;
      font-size: 14px;
      color: #718096;
    }
    
    .footer-links a {
      color: #06b6d4;
      text-decoration: none;
    }
    
    .footer-links a:hover {
      text-decoration: underline;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @media (max-width: 480px) {
      .login-card {
        border-radius: 8px;
      }
      
      .login-container {
        padding: 10px;
      }
    }
  `]
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
    this.loading.set(true); 
    this.error.set(null);
    const { email, password } = this.form.value as any;

    this.auth.login(email, password).subscribe({
      next: res => {
        this.auth.persist(res);
        this.router.navigate(['/dashboard']);
      },
      error: _ => { 
        this.error.set('Credenciales inválidas'); 
        this.loading.set(false); 
      }
    });
  }
}