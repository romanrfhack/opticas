import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../../core/branches.service';
import { CanDirective } from '../../shared/can.directive';
import { SucursalSwitcherComponent } from "../../shared/sucursal-switcher-component/sucursal-switcher-component";

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule,
    CanDirective,
    SucursalSwitcherComponent
],
  template: `
  <div [class]="'h-[100dvh] ' + (isDarkMode() ? 'dark bg-gray-900' : 'bg-gray-50')">
    <mat-sidenav-container class="h-full">
      <mat-sidenav
        #sidenav
        [mode]="handset() ? 'over' : 'side'"
        [opened]="!handset() && opened()"
        class="w-72 border-r"
        [class.border-gray-200]="!isDarkMode()"
        [class.border-gray-700]="isDarkMode()"
        [class.bg-white]="!isDarkMode()"
        [class.bg-gray-800]="isDarkMode()">

        <div class="p-4">
          <div class="flex items-center gap-3">
            <div class="avatar w-10 h-10 rounded-full flex items-center justify-center bg-cyan-100 text-cyan-700">
              <mat-icon>visibility</mat-icon>
            </div>
            <div>
              <div class="text-lg font-semibold">Ópticas Olivar</div>
              <div class="text-xs opacity-80" *appCan="['Admin','Optometrista']">Panel de administración</div>
            </div>
          </div>
        </div>

        <div class="border-t" [class.border-gray-200]="!isDarkMode()" [class.border-gray-700]="isDarkMode()"></div>

        <!-- Navegación en HTML puro (sin MatList) -->
        <nav class="px-2 py-3">
          <ul class="space-y-1">
            <li>
              <a routerLink="/dashboard" routerLinkActive="active"
                 class="nav-item" [class.dark-item]="isDarkMode()">
                <mat-icon class="mr-3 text-cyan-600">dashboard</mat-icon>
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a routerLink="/inventario" routerLinkActive="active"
                 class="nav-item" [class.dark-item]="isDarkMode()">
                <mat-icon class="mr-3 text-cyan-600">inventory_2</mat-icon>
                <span>Inventario</span>
              </a>
            </li>
            <li>
              <a routerLink="/clientes" routerLinkActive="active"
                 class="nav-item" [class.dark-item]="isDarkMode()">
                <mat-icon class="mr-3 text-cyan-600">groups</mat-icon>
                <span>Clientes</span>
              </a>
            </li>
            <li>
              <a routerLink="/clinica/historia" routerLinkActive="active"
                 class="nav-item" [class.dark-item]="isDarkMode()">
                <mat-icon class="mr-3 text-cyan-600">visibility</mat-icon>
                <span>Historias</span>
              </a>
            </li>
            <li>
              <a routerLink="/ordenes" routerLinkActive="active"
                 class="nav-item" [class.dark-item]="isDarkMode()">
                <mat-icon class="mr-3 text-cyan-600">assignment</mat-icon>
                <span>Órdenes</span>
              </a>
            </li>
          </ul>
        </nav>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar class="sticky top-0 z-20"
                     [class.bg-white]="!isDarkMode()"
                     [class.bg-gray-800]="isDarkMode()"
                     [class.text-gray-900]="!isDarkMode()"
                     [class.text-gray-100]="isDarkMode()"
                     [class.border-b]="true"
                     [class.border-gray-200]="!isDarkMode()"
                     [class.border-gray-700]="isDarkMode()">
          <div class="w-full max-w-7xl mx-auto">
            <div class="toolbar-content flex items-center gap-2 px-2">
              <button mat-icon-button (click)="toggle()" class="md:hidden">
                <mat-icon>menu</mat-icon>
              </button>

              <div class="flex items-center gap-2">
                <mat-icon class="text-cyan-600">visibility</mat-icon>
                <div class="hidden sm:block font-semibold">Ópticas Olivar</div>
              </div>

              <span class="flex-grow"></span>

              <!-- Switch de sucursal -->
              <app-sucursal-switcher class="hidden md:block"></app-sucursal-switcher>

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
                  <mat-icon>bug_report</mat-icon>
                  <span>Reportar problema</span>
                </button>
              </mat-menu>

              <!-- Menú de usuario -->
              <button mat-button [matMenuTriggerFor]="userMenu">
                <div class="flex items-center gap-2">
                  <div class="avatar w-8 h-8 rounded-full flex items-center justify-center">
                    <mat-icon>person</mat-icon>
                  </div>
                  <div class="hidden md:flex flex-col items-start">
                    <span class="text-sm font-medium">{{ auth.user()?.name ?? 'Usuario' }}</span>
                    <span class="user-menu-email text-xs opacity-80">{{ auth.user()?.email ?? '' }}</span>
                  </div>
                  <mat-icon>expand_more</mat-icon>
                </div>
              </button>
              <mat-menu #userMenu="matMenu">
                <button mat-menu-item routerLink="/perfil">
                  <mat-icon>account_circle</mat-icon>
                  <span>Perfil</span>
                </button>
                <button mat-menu-item (click)="toggleDarkMode()">
                  <mat-icon>{{ isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
                  <span>{{ isDarkMode() ? 'Modo claro' : 'Modo oscuro' }}</span>
                </button>
                <button mat-menu-item (click)="logout()">
                  <mat-icon>logout</mat-icon>
                  <span>Salir</span>
                </button>
              </mat-menu>
            </div>
          </div>
        </mat-toolbar>

        <main class="main-content" [class.bg-gray-50]="!isDarkMode()" [class.bg-gray-900]="isDarkMode()">
          <div class="content-container">
            <router-outlet />
          </div>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  </div>
  `,
  styles: [`
    .main-content { min-height: calc(100dvh - 64px); }
    .main-content{
  min-height: 100dvh;
  flex: 1 1 auto;     /* ocupa todo el espacio disponible */
  overflow: auto;
  padding: 16px 24px;
  background: url('/assets/img/fondo.webp') center / cover no-repeat fixed;
}
    .content-container { max-width: 1120px; margin: 0 auto; padding: 16px; }
    .help-button { display: flex; align-items: center; gap: 6px; }

    .nav-item {
      display: flex; align-items: center; padding: 10px 12px; border-radius: 8px;
      color: #374151; /* gray-700 */
    }
    .nav-item.active { background: #e5f3ff; } /* estado activo simple */
    .dark .nav-item { color: #d1d5db; }      
    .dark .nav-item.active { background: #1f2937; } /* gray-800 */

    .avatar { background-color: #ecfeff; color: #155e75; }
    .dark .avatar { background-color: #164e63; color: #a5f3fc; }

    @media (max-width: 768px) {
      .toolbar-content { padding: 0 12px; }
      .title-section .divider { display: none; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShellComponent {
  opened = signal(true);
  handset = signal(false);
  isDarkMode = signal(false);
  auth = inject(AuthService);
  branchesService = inject(BranchesService);

  constructor(bp: BreakpointObserver) {
    bp.observe([Breakpoints.Handset]).pipe(takeUntilDestroyed())
      .subscribe(s => this.handset.set(s.matches));

    const darkModePref = localStorage.getItem('darkMode') === 'true';
    this.isDarkMode.set(darkModePref);
  }

  toggle() { this.opened.set(!this.opened()); }
  toggleDarkMode() {
    this.isDarkMode.set(!this.isDarkMode());
    localStorage.setItem('darkMode', String(this.isDarkMode()));
  }
  logout() { this.auth.logout(); location.href = '/login'; }
}
