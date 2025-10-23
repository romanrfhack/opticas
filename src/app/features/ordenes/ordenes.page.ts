import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { VisitasCostosService } from '../../core/visitasCostos.service';
import { ChangeVisitaStatusRequest, OrderStatus, PagedResultCE, STATUS_FLOW, VisitaCostoRow } from './ordenes.models';
import { HistoriasService } from '../../core/historias.service';
import { MatDialog } from '@angular/material/dialog';
import { VisitaDetalleModalComponent } from '../../clinica/components/visita-detalle-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CambiarEstatusDialog, CambiarEstatusDialogData } from './cambiar-estatus.dialog';
//import { VisitasCostosService, VisitaCostoRow, OrderStatus, PagedResult } from '../../core';

@Component({
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, MatSelectModule, RouterLink, MatIconModule],
  selector: 'app-costos-page',
  template: `
  <div class="p-4 space-y-4">
    <h1 class="text-2xl font-semibold">Costos — Visitas de mi sucursal</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <mat-form-field appearance="outline">
        <mat-label>Buscar paciente</mat-label>
        <input matInput (keyup)="onSearch($event.target.value)" placeholder="Nombre del paciente">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Estado</mat-label>
        <mat-select (selectionChange)="onEstado($event.value)">
          <mat-option [value]="''">Todos</mat-option>
          <mat-option *ngFor="let e of estados" [value]="e">{{e}}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <div class="bg-white/5 rounded-xl p-2">
      <table mat-table [dataSource]="items()" class="w-full">
        <ng-container matColumnDef="fecha">
          <th mat-header-cell *matHeaderCellDef>Fecha</th>
          <td mat-cell *matCellDef="let r">{{ r.fecha | date:'yyyy-MM-dd HH:mm' }}</td>
        </ng-container>

        <ng-container matColumnDef="paciente">
          <th mat-header-cell *matHeaderCellDef>Paciente</th>
          <td mat-cell *matCellDef="let r">{{ r.paciente }}</td>
        </ng-container>

        <ng-container matColumnDef="usuario">
          <th mat-header-cell *matHeaderCellDef>Atendió</th>
          <td mat-cell *matCellDef="let r">{{ r.usuarioNombre }}</td>
        </ng-container>

        <ng-container matColumnDef="estado">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let r">{{ mostrarEstado(r.estado) }}</td>
        </ng-container>

        <ng-container matColumnDef="detalle">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let r">            
            <button mat-icon-button 
                (click)="verDetalle(r.id)"
                title="Ver detalle de la visita"
                class="text-cyan-600 hover:text-cyan-700">
            <mat-icon>visibility</mat-icon>
            </button>
          </td>
        </ng-container>

        <ng-container matColumnDef="acciones">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let r">
            <button mat-icon-button (click)="abrirCambiarEstatus(r)" title="Cambiar estatus">
              <mat-icon>sync</mat-icon>
            </button>
            <button mat-icon-button (click)="verHistorial(r.id)" title="Ver historial">
              <mat-icon>history</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;"></tr>
      </table>

      <mat-paginator [length]="total()" [pageSize]="pageSize()" [pageIndex]="page()-1"
                     (page)="onPage($event)"></mat-paginator>
    </div>
  </div>
  `,
})
export class CostosPageComponent {
  
  private api = inject(VisitasCostosService);
  private apiHS = inject(HistoriasService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  cols = ['fecha','paciente','usuario','estado','detalle', 'acciones'];
  estados = Object.values(OrderStatus);

  // estado local
  items = signal<VisitaCostoRow[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(20);
  search = signal<string>('');
  estado = signal<string>('');

  ngOnInit() { this.load(); }

  load() {
    this.api.list({
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.search() || undefined,
      estado: this.estado() || undefined
    }).subscribe((res: PagedResultCE<VisitaCostoRow>) => {
      console.log("Cargando visitas costos:", res.items);
      this.items.set(res.items);
      this.total.set(res.totalCount);
      this.page.set(res.page);
      this.pageSize.set(res.pageSize);
    });
  }

  onPage(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  onSearch(v: string) {
    this.page.set(1);
    this.search.set(v?.trim());
    this.load();
  }

  onEstado(v: string) {
    this.page.set(1);
    this.estado.set(v);
    this.load();
  }

  verDetalle(visitaId: string): void {
      console.log("Ver detalle de visita -OrdenesPage-:", visitaId);
      this.apiHS.getById(visitaId).subscribe({
        next: (visitaCompleta) => {
          this.dialog.open(VisitaDetalleModalComponent, {
            width: '95vw',
            maxWidth: '1200px',
            height: '95vh',
            data: visitaCompleta,
            panelClass: 'visita-detalle-modal'
          });
        },
        error: (err) => {
          console.error('Error al cargar detalle de visita:', err);
        }
      });
    }

    mostrarEstado(estadoIndex: number): string {
    // Validar que el índice esté dentro del rango del array
    if (estadoIndex >= 0 && estadoIndex < STATUS_FLOW.length) {
      return STATUS_FLOW[estadoIndex];
    }
    
    // Manejar casos donde el índice no es válido
    console.warn(`Índice de estado inválido: ${estadoIndex}`);
    return 'Desconocido';
  }

  // En tu componente padre
    openStatusDialog(visita: any) {
      // Convertir el estado actual a número (si viene como string del backend)
      const currentStatusNumber = this.getStatusNumber(visita.estado);
      
      // Calcular estados permitidos (solo el siguiente en este caso)
      const allowedStatuses = [currentStatusNumber + 1];

      const dialogRef = this.dialog.open(CambiarEstatusDialog, {
        width: '600px',
        data: {
          visitaId: visita.id,
          fromStatus: currentStatusNumber, // Número
          allowed: allowedStatuses // Array de números
        } as CambiarEstatusDialogData
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Result contiene toStatus como NÚMERO, listo para enviar al backend
          this.cambiarEstatus(visita.id, result);
        }
      });
    }

    // Alias que usa el template en español
    abrirCambiarEstatus(visita: any) {
      this.openStatusDialog(visita);
    }



    cambiarEstatus(visitaId: string, result: any) {
    // Construir el objeto de request
    const request: ChangeVisitaStatusRequest = {
      toStatus: result.toStatus,
      observaciones: result.observaciones,
      labTipo: result.labTipo,
      labNombre: result.labNombre
    };

    this.api.changeStatus(visitaId, request).subscribe({
      next: (response) => {
        // Manejar éxito
        this.snackBar.open('Estatus cambiado exitosamente', 'Cerrar', { duration: 3000 });
        // Puedes recargar los datos o actualizar la vista aquí
      },
      error: (error) => {
        // Manejar error
        console.error('Error al cambiar estatus', error);
        this.snackBar.open('Error al cambiar estatus', 'Cerrar', { duration: 3000 });
      }
    });
  }

    // Método auxiliar para convertir string a número
    private getStatusNumber(statusString: string): number {
      const index = STATUS_FLOW.indexOf(statusString as OrderStatus);
      return index !== -1 ? index : 0; // Default a 0 si no encuentra
    }

 

verHistorial(visitaId: string) {
  // Puedes abrir otro diálogo o drawer que consuma getStatusHistory(visitaId)
}

// Mapa de transiciones (mismo que el backend)
allowedTransitions: Record<string, string[]> = {
  'Creada': ['Registrada','Cancelada'],
  'Registrada': ['Enviada a laboratorio','Cancelada'],
  'Enviada a laboratorio': ['Lista en laboratorio'],
  'Lista en laboratorio': ['Recibida en sucursal central','Recibida en sucursal origen'],
  'Recibida en sucursal central': ['Lista para entrega'],
  'Recibida en sucursal origen': ['Lista para entrega'],
  'Lista para entrega': ['Entregada al cliente'],
  'Entregada al cliente': [],
  'Cancelada': []
};

}

