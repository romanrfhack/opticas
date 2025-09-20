import { Component, inject, signal, effect, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../../core/branches.service';
import { SucursalSwitcherComponent } from '../../shared/sucursal-switcher-component/sucursal-switcher-component';
import { CanDirective } from '../../shared/can.directive';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [ 
    CommonModule,
    RouterOutlet, RouterLink, RouterLinkActive, MatSnackBarModule,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule, 
    MatListModule, MatDividerModule, MatMenuModule,
    SucursalSwitcherComponent, CanDirective, NgIf
  ],
  template: `
  <!-- Contenedor principal con modo oscuro/claro -->
  <div [class]="'h-[100dvh] ' + (isDarkMode() ? 'dark bg-gray-900' : 'bg-gray-50')">
    <mat-sidenav-container class="h-full">
      <!-- Sidebar con diseño mejorado -->
      <mat-sidenav
        #sidenav
        [mode]="handset() ? 'over' : 'side'"
        [opened]="!handset() && opened()"
        class="w-72 border-r"
        [class.border-gray-200]="!isDarkMode()"
        [class.border-gray-700]="isDarkMode()"
        [class.bg-white]="!isDarkMode()"
        [class.bg-gray-800]="isDarkMode()">
        
        <!-- Header del sidebar -->
        <div class="p-5 bg-cyan-600 text-white">
          <div class="flex items-center">
            <img src="assets/img/logo.png" alt="Logo Óptica" class="h-10 w-10 mr-3 rounded-full bg-white p-1">
            <div>
              <div class="text-lg font-semibold">Ópticas Olivar</div>
              <div class="text-xs opacity-80" *appCan="['Admin','Optometrista']">Panel de administración</div>
            </div>
          </div>
        </div>
        
        <mat-divider></mat-divider>      
        
        <!-- Menú de navegación -->
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active" 
             [class]="isDarkMode() ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'">
            <mat-icon matListItemIcon class="text-cyan-600">dashboard</mat-icon>
            <div matListItemTitle>Dashboard</div>
          </a>
          
          <a mat-list-item routerLink="/inventario" routerLinkActive="active"
             [class]="isDarkMode() ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'">
            <mat-icon matListItemIcon class="text-cyan-600">inventory_2</mat-icon>
            <div matListItemTitle>Inventario</div>
          </a>
          
          <a mat-list-item routerLink="/clientes" routerLinkActive="active"
             [class]="isDarkMode() ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'">
            <mat-icon matListItemIcon class="text-cyan-600">groups</mat-icon>
            <div matListItemTitle>Clientes</div>
          </a>
          
          <a mat-list-item routerLink="/clinica/historia" routerLinkActive="active"
             [class]="isDarkMode() ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'">
            <mat-icon matListItemIcon class="text-cyan-600">visibility</mat-icon>
            <div matListItemTitle>Historias</div>
          </a>
          
          <a mat-list-item routerLink="/ordenes" routerLinkActive="active"
             [class]="isDarkMode() ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'">
            <mat-icon matListItemIcon class="text-cyan-600">assignment</mat-icon>
            <div matListItemTitle>Órdenes</div>
          </a>
        </mat-nav-list>
        
        <!-- Footer del sidebar -->
        <div class="absolute bottom-0 w-full p-4 border-t hidden"
             [class.border-gray-200]="!isDarkMode()"
             [class.border-gray-700]="isDarkMode()">
          <button mat-button class="w-full flex items-center justify-center" (click)="toggleDarkMode()">
            <mat-icon>{{ isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            <span class="ml-2">{{ isDarkMode() ? 'Modo claro' : 'Modo oscuro' }}</span>
          </button>
        </div>
      </mat-sidenav>

      <!-- Contenido principal -->
      <mat-sidenav-content class="flex flex-col">
        <!-- Barra de herramientas superior - CORREGIDA DEFINITIVAMENTE -->
        <mat-toolbar class="custom-toolbar fixed-toolbar sticky top-0 !bg-white border-b border-gray-200"
                    [class.bg-white]="!isDarkMode()"
                    [class.bg-gray-800]="isDarkMode()"
                    [class.border-gray-200]="!isDarkMode()"
                    [class.border-gray-700]="isDarkMode()"
                    [class.text-gray-900]="!isDarkMode()"
                    [class.text-white]="isDarkMode()">
          
          <div class="toolbar-content">
            <!-- Botón menú -->
            <button mat-icon-button (click)="handset() ? sidenav.toggle() : toggle()" class="menu-button">
              <mat-icon>menu</mat-icon>
            </button>
            
            <!-- Título y información de sucursal -->
            <div class="title-section">
              <span class="app-title">Sistema de Gestión</span>
              <!-- <span class="divider">|</span>
              <span class="branch-info" *ngIf="auth.user() as u">
                Sucursal: {{ getSucursalName(u.sucursalId) }}
              </span> -->
            </div>
            
            <span class="flex-grow"></span>
            
            <!-- Menú de ayuda -->
            <button mat-button [matMenuTriggerFor]="helpMenu" class="help-button">
              <mat-icon>help_outline</mat-icon>
              <span>Ayuda</span>
            </button>
            
            <mat-menu #helpMenu="matMenu">
              <button mat-menu-item>
                <mat-icon>menu_book</mat-icon>
                <span>Documentación</span>
              </button>
              <button mat-menu-item>
                <mat-icon>support_agent</mat-icon>
                <span>Soporte técnico</span>
              </button>
            </mat-menu>
                      
            
            <div class="sucursal-switcher-container relative pt-2">
              <app-sucursal-switcher></app-sucursal-switcher>
            </div>
            
            <!-- Información de usuario -->
            <div *ngIf="auth.user() as u" class="user-section">
              <div class="user-info">
                <span class="user-name">{{ u.name }}</span>
                <span class="user-branch branch-info">Sucursal: {{ getSucursalName(u.sucursalId) }}</span>
              </div>
              
              <button mat-icon-button [matMenuTriggerFor]="userMenu" class="user-avatar">
                <div class="avatar">
                  {{ u.name.charAt(0) }}
                </div>
              </button>
              
              <mat-menu #userMenu="matMenu">
                <div class="user-menu-header">
                  <div class="user-menu-name">{{ u.name }}</div>
                  <div class="user-menu-email">{{ u.email }}</div>
                  <div class="user-menu-branch">
                    Sucursal: {{ getSucursalName(u.sucursalId) }}
                  </div>
                </div>
                <button mat-menu-item routerLink="/perfil">
                  <mat-icon>person</mat-icon>
                  <span>Mi perfil</span>
                </button>
                <button mat-menu-item (click)="logout()">
                  <mat-icon>logout</mat-icon>
                  <span>Cerrar sesión</span>
                </button>
              </mat-menu>
            </div>
          </div>
        </mat-toolbar>

        <!-- Área de contenido principal -->
        <main class="main-content" 
              [class.bg-gray-50]="!isDarkMode()"
              [class.bg-gray-900]="isDarkMode()">
          <div class="content-container">
            <router-outlet />
          </div>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  </div>
  `,
  styles: [`
    :host { 
      display: contents; 
    }
        
    .custom-toolbar {
      min-height: 64px !important;
      height: auto !important;
      padding: 0 !important;
      z-index: 1000;
    }
    
    .custom-toolbar .toolbar-content {
      display: flex;
      align-items: center;
      width: 100%;
      height: 64px;
      padding: 0 16px;
    }
    
    /* Eliminar completamente la línea del toolbar */
    .custom-toolbar::before,
    .custom-toolbar::after,
    .custom-toolbar .mat-toolbar-row::before,
    .custom-toolbar .mat-toolbar-row::after {
      display: none !important;
      content: none !important;
    }
    
    .menu-button {
      margin-right: 12px;
    }
    
    .title-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .app-title {
      font-weight: 600;
      font-size: 16px;
    }
    
    .divider {
      color: #cbd5e1;
    }
    
    .branch-info {
      font-size: 14px;
      font-weight: 500;
      color: #06b6d4;
    }
    
    .flex-grow {
      flex-grow: 1;
    }
    
    .help-button {
      margin-right: 12px;
      display: flex;
      align-items: center;
    }
    
    .switcher-container {
      margin: 0 12px;
    }
    
    .user-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      margin-right: 12px;
    }
    
    .user-name {
      font-size: 14px;
      font-weight: 500;
    }
    
    .user-branch {
      font-size: 12px;
      color: #64748b;
    }
    
    .user-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #cffafe;
      color: #0891b2;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .user-menu-header {
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      min-width: 220px;
    }
    
    .user-menu-name {
      font-weight: 600;
      color: #1f2937;
    }
    
    .user-menu-email {
      font-size: 14px;
      color: #6b7280;
      margin-top: 4px;
    }
    
    .user-menu-branch {
      font-size: 12px;
      color: #06b6d4;
      margin-top: 4px;
    }

    .page{
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
    
 .main-content{
  min-height: 100dvh;
  flex: 1 1 auto;     /* ocupa todo el espacio disponible */
  overflow: auto;
  padding: 16px 24px;
  background: url('/assets/img/fondo.png') center / cover no-repeat fixed;
}
    
    .content-container {
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;      
    }
    
    /* Estilos para modo oscuro */
    .dark .divider {
      color: #4b5563;
    }
    
    .dark .user-branch {
      color: #9ca3af;
    }
    
    .dark .user-menu-header {
      border-bottom-color: #374151;
    }
    
    .dark .user-menu-name {
      color: #f9fafb;
    }
    
    .dark .user-menu-email {
      color: #d1d5db;
    }
    
    .dark .avatar {
      background-color: #164e63;
      color: #a5f3fc;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .toolbar-content {
        padding: 0 12px;
      }
      
      .title-section .divider,
      .title-section .branch-info,
      .help-button span,
      .user-info,
      .switcher-container {
        display: none;
      }
      
      .app-title {
        font-size: 14px;
      }
      
      .main-content {
        padding: 12px 16px;
      }
    }
    
    /* Estilos para el item activo del menú */
    .active {
      background: rgba(6, 182, 212, 0.1) !important;
      border-right: 3px solid #06b6d4;
    }
    
    .active .mdc-list-item__primary-text {
      color: #06b6d4 !important;
      font-weight: 500;
    }
    
    .mat-mdc-menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class ShellComponent {
  opened = signal(true);
  handset = signal(false);
  isDarkMode = signal(false);
  auth = inject(AuthService);
  branchesService = inject(BranchesService);
  
  branches = signal<{ id: string; nombre: string }[]>([]);

  constructor(bp: BreakpointObserver) {
    bp.observe([Breakpoints.Handset]).pipe(takeUntilDestroyed())
      .subscribe(s => this.handset.set(s.matches));
      
    const darkModePref = localStorage.getItem('darkMode') === 'true';
    this.isDarkMode.set(darkModePref);
    
    this.loadBranches();
    
    effect(() => {
      if (this.isDarkMode()) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
      localStorage.setItem('darkMode', this.isDarkMode().toString());
    });
  }

  loadBranches() {
    this.branchesService.list().subscribe({
      next: (branches) => this.branches.set(branches),
      error: (error) => console.error('Error loading branches:', error)
    });
  }

  getSucursalName(sucursalId: string): string {
    const branch = this.branches().find(b => b.id === sucursalId);
    return branch ? branch.nombre : `Sucursal ${sucursalId.slice(0, 8)}`;
  }

  toggle() { 
    this.opened.set(!this.opened()); 
  }
  
  toggleDarkMode() {
    this.isDarkMode.set(!this.isDarkMode());
  }
  
  logout() { 
    this.auth.logout(); 
    location.href = '/login'; 
  }
}