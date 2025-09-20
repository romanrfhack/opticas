import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoriasService } from '../core/historias.service';
import { MatTableModule } from '@angular/material/table';

@Component({
  standalone: true,
  selector: 'app-ultimas-visitas',
  imports: [CommonModule, MatTableModule],
  template: `
    <div class="text-sm font-semibold mb-2">Últimas visitas</div>
    <table mat-table [dataSource]="rows()" class="mat-elevation-z1 w-full text-sm" *ngIf="rows().length; else empty">
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
        <td mat-cell *matCellDef="let r">{{ r.total ?? 0 | currency }}</td>
      </ng-container>
      <ng-container matColumnDef="resta">
        <th mat-header-cell *matHeaderCellDef>Resta</th>
        <td mat-cell *matCellDef="let r">{{ r.resta ?? 0 | currency }}</td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols;"></tr>
    </table>
    <ng-template #empty>
      <div class="text-gray-500 text-sm">Sin registros.</div>
    </ng-template>
  `
})
export class UltimasVisitasComponent implements OnChanges {
  private api = inject(HistoriasService);
  @Input() pacienteId?: string | null;
  rows = signal<any[]>([]);
  cols = ['fecha','estado','total','resta'];

  ngOnChanges() {
    if (!this.pacienteId) { this.rows.set([]); return; }
    this.api.ultimas(this.pacienteId).subscribe(r => this.rows.set(r));
  }
}
