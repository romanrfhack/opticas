import { Component, Input, OnChanges, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HistoriasService } from '../core/historias.service';
import { UltimaHistoriaItem } from '../core/models/clinica.models';

export interface Visita {
  id: string;
  fecha: string | Date;
  estado: string;
  total: number;
  resta: number;
}

@Component({
  standalone: true,
  selector: 'app-ultimas-visitas',
  imports: [CommonModule, MatTableModule],
  template: `
    <div class="text-sm font-semibold mb-2">Últimas visitas</div>

    <table mat-table [dataSource]="rows()" class="mat-elevation-z1 w-full text-sm"
           *ngIf="rows().length; else empty">
      <!-- Fecha -->
      <ng-container matColumnDef="fecha">
        <th mat-header-cell *matHeaderCellDef>Fecha</th>
        <td mat-cell *matCellDef="let r">{{ r.fecha | date:'short' }}</td>
      </ng-container>

      <!-- Estado -->
      <ng-container matColumnDef="estado">
        <th mat-header-cell *matHeaderCellDef>Estado</th>
        <td mat-cell *matCellDef="let r">{{ r.estado }}</td>
      </ng-container>

      <!-- Total -->
      <ng-container matColumnDef="total">
        <th mat-header-cell *matHeaderCellDef>Total</th>
        <td mat-cell *matCellDef="let r">{{ r.total | number:'1.2-2' }}</td>
      </ng-container>

      <!-- Resta -->
      <ng-container matColumnDef="resta">
        <th mat-header-cell *matHeaderCellDef>Resta</th>
        <td mat-cell *matCellDef="let r">{{ r.resta | number:'1.2-2' }}</td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols; trackBy: trackById"></tr>
    </table>

    <ng-template #empty>
      <div class="text-sm text-gray-500">Aún no hay visitas para este paciente.</div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UltimasVisitasComponent implements OnChanges {
  private api = inject(HistoriasService);

  @Input() pacienteId?: string | null;

  rows = signal<Visita[]>([]);
  cols = ['fecha', 'estado', 'total', 'resta'] as const;

  ngOnChanges() {
    if (!this.pacienteId) { this.rows.set([]); return; }
    this.api.ultimas(this.pacienteId)
      .pipe(takeUntilDestroyed())
      .subscribe(
        (items: UltimaHistoriaItem[] = []) => {
          const visitas: Visita[] = (items ?? []).map(item => ({
            id: item.id,
            fecha: item.fecha,
            estado: item.estado,
            total: item.total ?? 0,
            resta: item.resta ?? 0,
          }));
          this.rows.set(visitas);
        },
        () => this.rows.set([])
      );
  }

  trackById = (_: number, v: Visita) => v.id;
}
