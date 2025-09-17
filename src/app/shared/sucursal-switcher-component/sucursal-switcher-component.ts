import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../../core/branches.service';

@Component({
  standalone: true,
  selector: 'app-sucursal-switcher',
  imports: [CommonModule, MatSelectModule, MatIconModule, MatFormFieldModule],
  template: `
  <ng-container *ngIf="isAdmin()">
    <mat-form-field appearance="outline" class="min-w-[220px]">
      <mat-label>Sucursal activa</mat-label>
      <mat-select [value]="current()" (selectionChange)="onChange($event.value)">
        <mat-option *ngFor="let s of branches()" [value]="s.id">{{ s.nombre }}</mat-option>
      </mat-select>
    </mat-form-field>
  </ng-container>
  `
})
export class SucursalSwitcherComponent {
  private branchesSvc = inject(BranchesService);
  private auth = inject(AuthService);

  branches = signal<{ id: string; nombre: string }[]>([]);
  current = computed(() => this.auth.user()?.sucursalId || '');
  isAdmin = computed(() => !!this.auth.user()?.roles?.includes('Admin'));

  constructor() {
    if (this.isAdmin()) {
      this.branchesSvc.list().subscribe(b => this.branches.set(b));
    }
  }

  onChange(targetSucursalId: string) {
    if (!targetSucursalId || targetSucursalId === this.current()) return;
    this.auth.switchBranch(targetSucursalId).subscribe({
      next: res => { this.auth.persist(res); },
      error: _ => { /* opc: snackbar de error */ }
    });
  }
}
