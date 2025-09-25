import { Component, ChangeDetectionStrategy, inject, signal, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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
      <ng-container matColumnDef="fecha">
        <th mat-header-cell *matHeaderCellDef>Fecha</th>
        <td mat-cell *matCellDef="let r">{{ r.fecha | date:'short' }}</td>
      </ng-container>

      <ng-container matColumnDef="estado">
        <th mat-header-cell *matHeaderCellDef>Estado</th>
        <td mat-cell *matCellDef="let r">{{ r.estado }}</td>
      </ng-container>

      <ng-container matColumnDef="total">
        <th mat-header-cell *matHeaderCellDef>Total</th>
        <td mat-cell *matCellDef="let r">{{ r.total | number:'1.2-2' }}</td>
      </ng-container>

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
export class UltimasVisitasComponent {
  private api = inject(HistoriasService);

  // Input reactivo (Angular 16+)
  pacienteId = input<string | null>(null);

  rows = signal<Visita[]>([]);
  cols = ['fecha', 'estado', 'total', 'resta'] as const;

  // Efecto que reacciona a cambios de pacienteId
  private _loadEff = effect((onCleanup) => {
    const id = this.pacienteId();
    // console.log('UltimasVisitasComponent: pacienteId changed to', id);

    // Limpia filas si no hay id
    if (!id) {
      this.rows.set([]);
      return;
    }

    // Suscripción por cambio; limpiamos la anterior con onCleanup
    const sub: Subscription = of(id)
      .pipe(switchMap(pid => this.api.ultimas(pid) ?? of([])))
      .subscribe({
        next: (items: UltimaHistoriaItem[] = []) => {
          const visitas: Visita[] = (items ?? []).map(item => ({
            id: item.id,
            fecha: item.fecha,
            estado: item.estado,
            total: item.total ?? 0,
            resta: item.resta ?? 0,
          }));
          this.rows.set(visitas);
        },
        error: () => this.rows.set([]),
      });

    onCleanup(() => sub.unsubscribe());
  });

  trackById = (_: number, v: Visita) => v.id;
}
