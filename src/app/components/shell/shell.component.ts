import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule, MatListModule, MatDividerModule
  ],
  template: `
  <!-- usa 100dvh para móviles -->
  <mat-sidenav-container class="h-[100dvh]">
    <mat-sidenav
      #sidenav
      [mode]="handset() ? 'over' : 'side'"
      [opened]="!handset() && opened()"
      class="w-72">

      <div class="p-4">
        <div class="text-xl font-semibold mb-2">Óptica</div>
        <div class="text-xs text-gray-500">Panel de administración</div>
      </div>
      <mat-divider></mat-divider>

      <mat-nav-list>
        <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
          <mat-icon matListItemIcon>dashboard</mat-icon>
          <div matListItemTitle>Dashboard</div>
        </a>
        <a mat-list-item routerLink="/inventario" routerLinkActive="active">
          <mat-icon matListItemIcon>inventory_2</mat-icon>
          <div matListItemTitle>Inventario</div>
        </a>
        <a mat-list-item routerLink="/clientes" routerLinkActive="active">
          <mat-icon matListItemIcon>groups</mat-icon>
          <div matListItemTitle>Clientes</div>
        </a>
        <a mat-list-item routerLink="/historias" routerLinkActive="active">
          <mat-icon matListItemIcon>visibility</mat-icon>
          <div matListItemTitle>Historias</div>
        </a>
        <a mat-list-item routerLink="/ordenes" routerLinkActive="active">
          <mat-icon matListItemIcon>assignment</mat-icon>
          <div matListItemTitle>Órdenes</div>
        </a>
      </mat-nav-list>
    </mat-sidenav>

    <mat-sidenav-content class="flex flex-col">
      <mat-toolbar class="!bg-white border-b border-gray-200">
        <button mat-icon-button (click)="handset() ? sidenav.toggle() : toggle()">
          <mat-icon>menu</mat-icon>
        </button>
        <span class="ml-2 font-semibold">Óptica</span>
        <span class="flex-1"></span>
        <button mat-button>Ayuda</button>
        <button mat-button>Salir</button>
      </mat-toolbar>

      <!-- scroll SOLO aquí, no en el body -->
      <main class="p-4 md:p-6 bg-gray-50 h-[calc(100dvh-64px)] overflow-auto">
        <div class="container">
          <router-outlet />
        </div>
      </main>
    </mat-sidenav-content>
  </mat-sidenav-container>
  `,
  styles: [`
    :host { display: contents; }
    /* resalta item activo del menú */
    .mdc-list-item.active { background: #f3f4f6; border-radius: 9999px; }
    .mdc-list-item a { text-decoration: none; }
  `]
})
export class ShellComponent {
  opened = signal(true);
  handset = signal(false);

  constructor(bp: BreakpointObserver) {
    bp.observe([Breakpoints.Handset]).pipe(takeUntilDestroyed())
      .subscribe(s => this.handset.set(s.matches));
  }

  toggle(){ this.opened.set(!this.opened()); }
}
