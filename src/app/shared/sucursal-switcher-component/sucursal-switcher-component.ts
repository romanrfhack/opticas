import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../../core/branches.service';

@Component({
  standalone: true,
  selector: 'app-sucursal-switcher',
  imports: [CommonModule, MatSelectModule, MatIconModule, MatFormFieldModule, MatTooltipModule],
  template: `
  <ng-container *ngIf="isAdmin()">
    <div class="sucursal-switcher-container relative mt-2">
      <!-- Usamos appearance="fill" para quitar el notched-outline (la rayita) -->
      <mat-form-field appearance="fill" class="sucursal-select custom-select-field no-outline">
        <mat-label class="flex items-center">
          <mat-icon class="mr-2 text-cyan-600 scale-90">store</mat-icon>
          <span>Sucursal activa</span>
        </mat-label>

        <mat-select
          [value]="current()"
          (selectionChange)="onChange($event.value)"
          panelClass="sucursal-panel"
          #branchSelect>
          <mat-option
            *ngFor="let s of branches()"
            [value]="s.id"
            class="sucursal-option">
            <div class="flex items-center justify-between w-full">
              <span class="truncate">{{ s.nombre }}</span>
              <mat-icon
                class="text-cyan-600 ml-2 text-base"
                *ngIf="s.id === current()"
                matTooltip="Sucursal actual">check_circle</mat-icon>
            </div>
          </mat-option>
        </mat-select>

        <!-- Ícono personalizado -->
        <div class="custom-arrow-icon" (click)="branchSelect.open()">
          <mat-icon>arrow_drop_down</mat-icon>
        </div>
      </mat-form-field>

      <!-- Indicador de carga -->
      <div
        *ngIf="loading()"
        class="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg z-10">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
      </div>
    </div>
  </ng-container>
  `,
  styles: [`
  /* Espacio por defecto cuando se usa el componente */
  :host {
    display: inline-block;
    padding-top: 6px;
  }

  .sucursal-switcher-container {
    min-width: 240px;
  }

  .sucursal-select { width: 100%; }

  /* Ocultar flecha nativa y cualquier sufijo nativo */
  .custom-select-field .mat-mdc-select-arrow-wrapper,
  .custom-select-field .mat-mdc-form-field-icon-suffix {
    display: none !important;
  }

  /* Quitar completamente la línea inferior/ripple del modo "fill" */
  .no-outline .mdc-line-ripple,
  .no-outline .mat-mdc-form-field-focus-overlay,
  .no-outline .mat-mdc-form-field-subscript-wrapper {
    display: none !important;
  }

  /* Dibujamos nuestro propio “borde” */
  .no-outline .mdc-text-field {
    background: transparent !important;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    min-height: 40px;
    padding: 0 40px 0 12px; /* espacio para el ícono custom */
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .no-outline .mdc-text-field:hover {
    border-color: #06b6d4;
  }

  .no-outline .mdc-text-field.mdc-text-field--focused {
    border-color: #06b6d4;
    box-shadow: 0 0 0 2px rgba(6,182,212,.15);
  }

  /* Ícono personalizado (abre el panel) */
  .custom-arrow-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    z-index: 2;
    display: flex; align-items: center; justify-content: center;
    width: 24px; height: 24px;
    color: #64748b;
  }
  .custom-arrow-icon:hover { color: #06b6d4; }

  /* Panel de opciones */
  .sucursal-panel {
    border-radius: 8px;
    margin-top: 4px;
    box-shadow: 0 4px 20px rgba(0,0,0,.15);
    border: 1px solid #e2e8f0;
  }
  .sucursal-panel .mat-mdc-option {
    min-height: 48px;
    padding: 0 16px;
    transition: background-color .2s ease;
  }
  .sucursal-panel .mat-mdc-option:hover:not(.mdc-list-item--disabled) { background-color: #f0f9ff; }
  .sucursal-panel .mat-mdc-option.mat-mdc-option-active { background-color: #ecfeff; }
  .sucursal-panel .mat-mdc-option .mdc-list-item__primary-text { color: #334155; font-weight: 500; }

  .sucursal-option { border-bottom: 1px solid #f1f5f9; }
  .sucursal-option:last-child { border-bottom: none; }

  /* Modo oscuro */
  .dark .no-outline .mdc-text-field { border-color: #4b5563; }
  .dark .no-outline .mdc-text-field:hover,
  .dark .no-outline .mdc-text-field.mdc-text-field--focused {
    border-color: #06b6d4;
  }
  .dark .sucursal-panel {
    background-color: #1f2937;
    border-color: #4b5563;
    box-shadow: 0 4px 20px rgba(0,0,0,.3);
  }
  .dark .sucursal-panel .mat-mdc-option:hover:not(.mdc-list-item--disabled) { background-color: #374151; }
  .dark .sucursal-panel .mat-mdc-option.mat-mdc-option-active { background-color: #164e63; }
  .dark .sucursal-panel .mat-mdc-option .mdc-list-item__primary-text { color: #e5e7eb; }
  .dark .sucursal-option { border-bottom-color: #374151; }
  .dark .custom-arrow-icon { color: #9ca3af; }
  .dark .custom-arrow-icon:hover { color: #06b6d4; }

  /* Responsive */
  @media (max-width: 640px) {
    .sucursal-switcher-container { min-width: 180px; }
  }
  `]
})
export class SucursalSwitcherComponent {
  private branchesSvc = inject(BranchesService);
  private auth = inject(AuthService);

  branches = signal<{ id: string; nombre: string }[]>([]);
  loading = signal(false);
  current = computed(() => this.auth.user()?.sucursalId || '');
  isAdmin = computed(() => !!this.auth.user()?.roles?.includes('Admin'));

  constructor() {
    if (this.isAdmin()) {
      this.loadBranches();
    }
  }

  loadBranches() {
    this.loading.set(true);
    this.branchesSvc.list().subscribe({
      next: (branches) => {
        this.branches.set(branches);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onChange(targetSucursalId: string) {
    if (!targetSucursalId || targetSucursalId === this.current()) return;

    this.loading.set(true);
    this.auth.switchBranch(targetSucursalId).subscribe({
      next: (res) => {
        this.auth.persist(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
