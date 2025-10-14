import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { VisitaCompleta } from '../../core/models/clinica.models';

@Component({
  standalone: true,
  selector: 'app-visita-detalle-modal',
  imports: [CommonModule, MatDialogModule, MatIconModule],
  template: `
    <div class="modal-container   rounded-2xl shado xl max-h-[95vh] overflow-hidden flex flex-col">

      <!-- Header -->
      <header class="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-[#06b6d4] px-6 py-4">
        <div class="flex items-center justify-between  ">
          <div class="flex items-center gap-4 min-w-0 ">
            <div class="h-11 w-11 rounded-xl bg-[#06b6d4] flex items-center justify-center shadow-lg shrink-0">
              <mat-icon class="text-white  ">visibility</mat-icon>
            </div>
            <div class="min-w-0 gap-4">
              <h1 class="   text-2xl     truncate">Detalle de Visita</h1>
              <div class="flex flex-row items-start justify-between gap-4 ">
                <div class="flex flex-row items-start justify-between gap-2">
                  <mat-icon>event</mat-icon>
                  <span>{{ data.fecha | date:'mediumDate' }}</span>
                </div>
                <div class="flex flex-row items-start justify-between gap-2">
                  <mat-icon>business</mat-icon>
                  <span>{{ data.nombreSucursal }}</span>
                </div>
                <div class="flex flex-row items-start justify-between gap-2">
                  <mat-icon>person</mat-icon>
                  <span>{{ data.usuarioNombre }}</span>
                </div>
              </div>
            </div>
          </div>
          <button type="button" (click)="cerrar()"
            class="h-10 w-10 rounded-full   shadow hover:shadow-md transition-all duration-200 flex items-center justify-center text-gray-500 hover:text-[#06b6d4] hover:bg-cyan-50">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </header>

      <!-- Contenido principal SIN navegación -->
      <main class="flex-1 overflow-y-auto">
        
        <div class="p-4  p-6">
          <div class="flex items-center justify-between gap-4 mb-6">
              <div class="status-badge" [ngClass]="getEstadoBadgeClass(data.estado)">
                <span class="status-dot" [ngClass]="getEstadoDotClass(data.estado)"></span>
                  {{ data.estado }}
              </div>                  
          </div>          
           
          <div class="flex flex-wrap gap-6 no-scrollbar">
            <!-- RESUMEN -->
             
            <section id="resumen" class="grid-item">
              <div class="flex flex-wrap gap-4 bg-[#06b6d4]/10 p-3 rounded-lg mb-4">
                  <mat-icon class="section-icon">remove_red_eye</mat-icon>
                  <h2 class="section-title">Pagos</h2>
                </div>
              <div class="content-card content-section">
                
                <div class="grid grid-cols-3    ">
                  <div class="kpi-item">
                    <div class="kpi-label">Total</div>
                    <div class="kpi-value">{{ data.total | currency }}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">A cuenta</div>
                    <div class="kpi-value text-emerald-600">{{ data.aCuenta | currency }}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">Resta</div>
                    <div class="kpi-value" [class]="getRestaColorClass()">{{ data.resta | currency }}</div>
                  </div>
                </div>
              </div>
            </section>

            <!-- AGUDEZA VISUAL -->
            <section id="av" class="grid-item">
              <div class="content-card content-section h-full">
                <div class="flex flex-wrap gap-4 bg-[#06b6d4]/10 p-3 rounded-lg mb-4">
                  <mat-icon class="section-icon">remove_red_eye</mat-icon>
                  <h2 class="section-title">Agudeza Visual</h2>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
                  <div class="vision-card">
                    <div class="flex flex-row items-start justify-between gap-2 bg-blue-50">
                      <mat-icon class="text-blue-500">visibility_off</mat-icon>
                      <h3 class="card-title">Sin lentes</h3>
                    </div>
                    <div class="vision-content">
                      <div *ngFor="let av of agudezasSinLentes" class="flex flex-row items-start justify-between  ">
                        <span class="eye-label">{{ av.ojo }}</span>
                        <span class="vision-value">20/{{ av.denominador }}</span>
                      </div>
                      <div *ngIf="agudezasSinLentes.length === 0" class="empty-state">
                        <mat-icon>remove_circle</mat-icon>
                        Sin datos
                      </div>
                    </div>
                  </div>
                  <div class="vision-card">
                    <div class="flex flex-row items-start justify-between gap-2 bg-green-50">
                      <mat-icon class="text-green-500">visibility</mat-icon>
                      <h3 class="card-title">Con lentes</h3>
                    </div>
                    <div class="vision-content">
                      <div *ngFor="let av of agudezasConLentes" class="flex flex-row items-start justify-between  ">
                        <span class="eye-label">{{ av.ojo }}</span>
                        <span class="vision-value">20/{{ av.denominador }}</span>
                      </div>
                      <div *ngIf="agudezasConLentes.length === 0" class="empty-state">
                        <mat-icon>remove_circle</mat-icon>
                        Sin datos
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- RX - Prescripción -->
            <section id="rx" class="grid-item">
              <div class="content-card content-section h-full">
                <div class="flex flex-wrap gap-4 bg-[#06b6d4]/10 p-3 rounded-lg mb-4">
                  <mat-icon class="section-icon">healing</mat-icon>
                  <h2 class="section-title">Prescripción RX</h2>                  
                </div>
                <div class="table-wrapper">
                  <table class="modern-table">
                    <thead>
                      <tr class=" ">
                        <th>Distancia</th>
                        <th>Ojo</th>
                        <th>Esf.</th>
                        <th>Cyl.</th>
                        <th>Eje</th>
                        <th>ADD</th>
                        <th>DIP</th>
                        <th>Alt. Obl.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let r of data.rx" class="table-row  ">
                        <td class="  text-[#06b6d4]">{{ r.distancia }}</td>
                        <td class=" ">{{ r.ojo }}</td>
                        <td>{{ r.esf ?? '-' }}</td>
                        <td>{{ r.cyl ?? '-' }}</td>
                        <td>{{ r.eje ?? '-' }}</td>
                        <td>{{ r.add ?? '-' }}</td>
                        <td>{{ r.dip ?? '-' }}</td>
                        <td>{{ r.altOblea ?? '-' }}</td>
                      </tr>
                      <tr *ngIf="!data.rx || data.rx.length === 0">
                        <td colspan="8" class="empty-table">
                          <mat-icon>description</mat-icon>
                          No hay datos de prescripción
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <!-- MATERIALES -->
            <section id="materiales" class="grid-item">
              <div class="content-card content-section h-full">
                <div class="flex flex-row gap-4 items-start justify-start   bg-[#06b6d4]/10 p-3 rounded-lg mb-4">
                  <mat-icon class="section-icon">layers</mat-icon>
                  <h2 class="section-title">Materiales</h2>
                </div>
                <ng-container *ngIf="data.materiales?.length; else noMateriales">
                  <div>
                    <div *ngFor="let m of data.materiales" class="item-card">
                      <h4 class="item-title">{{ m.material.descripcion }}</h4>
                      <div class="item-details">
                        <div *ngIf="m.material?.marca" class="item-detail">
                          <span class="detail-label">Marca:</span>
                          <span class="detail-value">{{ m.material.marca }}</span>
                        </div>
                        <div *ngIf="m.observaciones" class="item-detail">
                          <span class="detail-label">Observaciones:</span>
                          <span class="detail-value">{{ m.observaciones }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ng-container>
                <ng-template #noMateriales>
                  <div class="flex flex-row items-start justify-between gap-2">
                    <mat-icon>inventory_2</mat-icon>
                    <span>No se seleccionaron materiales</span>
                  </div>
                </ng-template>
              </div>
            </section>

            <!-- ARMAZONES -->
            <section id="armazones" class="grid-item">
              <div class="content-card content-section h-full">
                <div class="flex flex-row gap-4 items-start justify-start bg-[#06b6d4]/10 p-3 rounded-lg mb-4">
                  <mat-icon class="section-icon">home</mat-icon>
                  <h2 class="section-title">Armazones</h2>
                </div>
                <ng-container *ngIf="data.armazones?.length; else noArmazones">
                  <div class=" ">
                    <div *ngFor="let a of data.armazones" class="item-card">
                      <div class="flex justify-between items-start gap-2">
                        <label class="field-label text-[#06b6d4]">Armazon:</label>
                        <h4 class="item-title">{{ a.producto.nombre }}</h4>                        
                      </div>
                      <div class="flex justify-between items-start gap-2">
                        <label class="field-label text-[#06b6d4]">sku:</label>                        
                        <span class="sku-tag">SKU: {{ a.producto.sku }}</span>
                      </div>
                      <div *ngIf="a.observaciones" class="item-details mt-2">
                        <div class="item-detail">                          
                          <label class="field-label text-[#06b6d4]">Observaciones:</label>
                          <span class="detail-value">{{ a.observaciones }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ng-container>
                <ng-template #noArmazones>
                  <div class="empty-content">
                    <mat-icon>style</mat-icon>
                    <span>No se seleccionaron armazones</span>
                  </div>
                </ng-template>
              </div>
            </section>

            <!-- LENTES DE CONTACTO -->
            <section id="lc" class="grid-item">
              <div class="content-card content-section h-full">
                <div class="flex flex-row items-start gap-4 justify-start   bg-[#06b6d4]/10 p-3 rounded-lg mb-4">                  
                  <mat-icon class="section-icon">style</mat-icon>
                  <h2 class="section-title">Lentes de Contacto</h2>
                </div>
                <ng-container *ngIf="data.lentesContacto?.length; else noLc">
                  <div class="flex flex-wrap  ">
                    <div *ngFor="let lc of data.lentesContacto" >
                      <div class="flex flex-wrap gap-4 ">

                        <div class="flex flex-wrap gap-2">
                          <label class="field-label text-[#06b6d4]">Tipo</label>
                          <div class="field-value">{{ lc.tipo || 'No especificado' }}</div>
                        </div>
                        <div class="flex flex-wrap gap-2">
                          <label class="field-label text-[#06b6d4]">Marca</label>
                          <div class="field-value">{{ lc.marca || 'No especificado' }}</div>
                        </div>
                        <div class="flex flex-wrap gap-2">
                          <label class="field-label text-[#06b6d4]">Modelo</label>
                          <div class="field-value">{{ lc.modelo || 'No especificado' }}</div>
                        </div>
                      </div>
                      <div class="field-group gap-2 ">
                        <label class="field-label text-[#06b6d4]">Observaciones:</label>
                        <div class="field-value">{{ lc.observaciones || 'Ninguna' }}</div>
                      </div>
                    </div>
                  </div>
                </ng-container>
                <ng-template #noLc>
                  <div class="empty-content">
                    <mat-icon>contact_lens</mat-icon>
                    <span>No hay lentes de contacto registrados</span>
                  </div>
                </ng-template>
              </div>
            </section>

            <!-- OBSERVACIONES -->
            <section id="obs" class="grid-item">
              <div class="content-card content-section h-full">
                <div class="flex flex-row gap-4 items-start justify-start   bg-[#06b6d4]/10 p-3 rounded-lg mb-4">
                  <mat-icon class="text-[#06b6d4]">chat_bubble</mat-icon>
                  <h2 class="section-title">Observaciones</h2>
                </div>
                <ng-container *ngIf="data.observaciones; else noObs">
                  <div class="flex flex-wrap  ">                      
                      <label class="field-label text-[#06b6d4]">Observaciones: </label>
                      <p class="observations-text">{{ data.observaciones }}</p>
                  </div>                  
                </ng-container>
                <ng-template #noObs>
                  <div class="empty-content">
                    
                    <span>No hay observaciones registradas</span>
                  </div>
                </ng-template>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    .modal-container { width: 95vw; max-width: 1400px; }

    /* Chips informativos compactos */
    .chip { @apply inline-flex items-center rounded-full   border border-[#06b6d4]    text-[#06b6d4]    ; }
    .chip mat-icon { @apply text-[#06b6d4]  ; }

    /* Estados */
    .status-badge { @apply inline-flex items-center rounded-full      border; }
    .status-dot { @apply     rounded-full; }

    /* KPIs */
    .kpi-item { @apply flex flex-col items-start justify-center border border-[#06b6d4];}        

    /* Secciones */    
    .section-header { @apply flex items-center         border-b border-[#06b6d4]/30; }
    .section-icon { @apply text-[#06b6d4]  ; }
    .section-title { @apply         ; }
    .count-badge { @apply ml-auto   py-1 rounded-full      bg-[#06b6d4] text-white; }

    /* Tarjetas */
    .content-card { @apply   rounded-xl border border-gray-200 p-4  p-5   h-full; }

    /* Agudeza visual */
    .vision-card { @apply   rounded-xl border border-gray-200 overflow-hidden  ; }
    .card-header { @apply flex items-center px-4 py-3 border-b; }
    .card-title { @apply     text-gray-700; }
    .vision-content { @apply p-4 space-y-2; }
    .vision-item { @apply flex justify-between items-center py-2   bg-gray-50 rounded-lg; }
    .eye-label { @apply     text-gray-700; }
    .vision-value { @apply      ; }

    /* Tabla moderna */
    .table-wrapper { @apply rounded-xl border border-gray-200 overflow-hidden    ; }
    .modern-table { @apply w-full border-collapse; }
    .modern-table thead tr { @apply bg-gradient-to-r from-cyan-50 to-blue-50; }
    .modern-table th { @apply px-4 py-3      text-gray-700 uppercase tracking-wider border-b border-[#06b6d4]/30 text-center; }
    .modern-table td { @apply px-4 py-3     border-b border-gray-200 text-center; }
    .modern-table tbody tr:last-child td { @apply border-b-0; }
    .modern-table tbody tr:hover { @apply bg-cyan-50/50; }

    /* Items */
    .item-card { @apply p-4 bg-gray-50 rounded-lg border border-gray-200; }
    .item-title { @apply       mb-1; }
    .sku-tag { @apply px-2 py-1 bg-gray-200 text-gray-700    rounded-full  ; }
    .item-details { @apply space-y-1; }
    .item-detail { @apply flex items-start  ; }
    .detail-label { @apply text-gray-700   min-w-[120px] flex-shrink-0; }
    .detail-value { @apply text-gray-700; }

    /* Lentes de contacto */
    .field-group { @apply space-y-1; }
    .field-label { @apply block      text-gray-500 uppercase tracking-wide; }
    .field-value { @apply       p-2 bg-gray-50 rounded-lg; }

    /* Observaciones */
    .observations-content { @apply flex items-start    p-4 bg-cyan-50 rounded-lg border border-[#06b6d4]; }
    .observations-text { @apply text-gray-700 whitespace-pre-line leading-relaxed flex-1; }

    /* Vacíos */
    .empty-state, .empty-table, .empty-content { @apply flex items-center justify-center text-gray-500   py-6; }
    .empty-state mat-icon, .empty-table mat-icon, .empty-content mat-icon { @apply text-gray-400; }

    /* === GRID RESPONSIVO (arreglado) === */
/* Limita cada columna a 500px y centra columnas/ítems */
.responsive-grid {
  display: grid;
  /* auto-fit colapsa tracks vacíos y empaqueta las tarjetas */
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  justify-content: center;   /* centra el conjunto de columnas */
  justify-items: center;     /* centra cada ítem dentro del track */
}

@media (min-width: 640px) {
  .responsive-grid { gap: 1.25rem; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
}
@media (min-width: 1024px) {
  .responsive-grid { gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); }
}
@media (min-width: 1280px) {
  .responsive-grid { grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); }
}

/* Cada tarjeta no excede 500px. OJO: NO la estires con justify-self: stretch */
.grid-item {
  width: min(100%, 500px);  /* 100% del track pero tope en 500px */
  min-width: 0;
  justify-self: center;     /* centra el ítem en tracks anchos */
}

  `]
})
export class VisitaDetalleModalComponent {
  private dialogRef = inject(MatDialogRef<VisitaDetalleModalComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: VisitaCompleta) {}

  get agudezasSinLentes() { return this.data.agudezas?.filter(a => a.condicion === 'SinLentes') ?? []; }
  get agudezasConLentes() { return this.data.agudezas?.filter(a => a.condicion === 'ConLentes') ?? []; }

  cerrar() { this.dialogRef.close(); }

  getRestaColorClass() { return (this.data.resta || 0) > 0 ? 'text-red-600' : 'text-emerald-600'; }

  getEstadoBadgeClass(estado: string) {
    const map: Record<string, string> = {
      'Borrador': 'border-blue-200 bg-blue-50 text-blue-700',
      'EnviadoLaboratorio': 'border-emerald-200 bg-emerald-50 text-emerald-700',
      'Recibido': 'border-purple-200 bg-purple-50 text-purple-700',
      'Entregado': 'border-teal-200 bg-teal-50 text-teal-700',
      'Cancelado': 'border-rose-200 bg-rose-50 text-rose-700'
    };
    return map[estado] ?? 'border-gray-200 bg-gray-50 text-gray-700';
  }

  getEstadoDotClass(estado: string) {
    const map: Record<string, string> = {
      'Borrador': 'bg-blue-500',
      'EnviadoLaboratorio': 'bg-emerald-500',
      'Recibido': 'bg-purple-500',
      'Entregado': 'bg-teal-500',
      'Cancelado': 'bg-rose-500'
    };
    return map[estado] ?? 'bg-gray-400';
  }
}
