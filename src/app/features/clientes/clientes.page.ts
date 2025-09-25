import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
import { PacientesService } from '../../core/pacientes.service';
import { PacienteGridItem, PacienteLite } from '../../core/models/clinica.models';

@Component({
  standalone: true,
  selector: 'app-clientes',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatCardModule, MatFormFieldModule,
    MatIconModule, MatButtonModule, MatInputModule, MatAutocompleteModule,
    MatProgressBarModule, MatTooltipModule, MatChipsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <section class="max-w-7xl mx-auto space-y-6 p-4">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-2">
      <div>
        <h1 class="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-3">
          <mat-icon class="text-[#06b6d4] scale-110">groups</mat-icon>
          Gestión de Clientes
        </h1>
        <p class="text-gray-600 mt-1">Busca y gestiona los clientes del sistema</p>
      </div>
      
      <div class="flex gap-3 flex-wrap">
        <button mat-stroked-button 
                (click)="mostrarTodos()"
                class="action-button border-[#06b6d4] text-[#06b6d4] hover:bg-[#06b6d4] hover:bg-opacity-5 transition-all duration-200">
          <mat-icon>group</mat-icon>
          Mostrar Todos
        </button>
        <button mat-flat-button 
                color="primary" 
                (click)="nuevaVisita()"
                class="save-button bg-gradient-to-r from-[#06b6d4] to-[#0ea5e9] hover:from-[#0ea5e9] hover:to-[#06b6d4] shadow-md hover:shadow-lg transition-all duration-200">
          <mat-icon>person_add</mat-icon>
          Nuevo Cliente
        </button>
      </div>
    </div>

    <!-- Barra de progreso -->
    <mat-progress-bar mode="indeterminate" *ngIf="loading()" class="rounded-full" color="primary"></mat-progress-bar>

    <!-- Búsqueda -->
    <mat-card class="form-card border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
      <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
        <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
          <mat-icon class="text-[#06b6d4]">search</mat-icon>
          Búsqueda de Clientes
        </mat-card-title>
        <mat-card-subtitle class="text-gray-600">Busca por nombre o teléfono</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <form [formGroup]="form" class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <mat-form-field appearance="fill" class="lg:col-span-8 custom-form-field">
            <mat-label>Nombre o teléfono</mat-label>
            <input matInput 
                   formControlName="term" 
                   [matAutocomplete]="auto" 
                   placeholder="Escribe al menos 2 letras para buscar..."
                   class="w-full rounded-lg">
            <mat-icon matPrefix class="prefix-icon text-[#06b6d4]">person_search</mat-icon>

            <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onOptionSelected($event.option.value)">            
              <mat-option *ngFor="let s of sugeridos()" [value]="s" class="flex justify-between items-center py-2 hover:bg-[#06b6d4] hover:bg-opacity-5 transition-colors">
                <div class="flex items-center gap-3">
                  <mat-icon class="text-[#06b6d4] text-base">person</mat-icon>
                  <div>
                    <div class="font-medium">{{ s.nombre }}</div>
                    <div class="text-xs text-gray-500" *ngIf="s.telefono">{{ s.telefono }}</div>
                  </div>
                </div>
                <span class="text-xs text-[#06b6d4] ml-2 font-medium">Seleccionar</span>
              </mat-option>
            </mat-autocomplete>
            <mat-error *ngIf="form.controls.term.hasError('minlength')">Mínimo 2 caracteres</mat-error>
          </mat-form-field>

          <div class="lg:col-span-4 flex gap-3">
            <button mat-flat-button 
                    color="primary" 
                    (click)="buscarManual()"
                    [disabled]="form.controls.term.invalid"
                    class="save-button flex-1 bg-gradient-to-r from-[#06b6d4] to-[#0ea5e9] hover:from-[#0ea5e9] hover:to-[#06b6d4] shadow-md hover:shadow-lg transition-all duration-200">
              <mat-icon>search</mat-icon>
              Buscar
            </button>
            <button mat-stroked-button 
                    (click)="limpiar()"
                    class="action-button border-gray-300 text-gray-600 hover:border-[#06b6d4] hover:text-[#06b6d4] transition-all duration-200">
              <mat-icon>clear</mat-icon>
            </button>
          </div>
        </form>

        <!-- Contador de resultados -->
        <div class="mt-4 pt-4 border-t border-gray-100">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2 text-gray-600">
              <mat-icon class="text-base text-[#06b6d4]">info</mat-icon>
              <span *ngIf="showResultsCount()">
                Mostrando <strong class="text-[#06b6d4]">{{ rows().length }}</strong> de <strong class="text-[#06b6d4]">{{ total() }}</strong> clientes
              </span>
              <span *ngIf="!showResultsCount()">Escribe para buscar clientes...</span>
            </div>
            <div class="text-[#06b6d4] font-medium flex items-center gap-1" *ngIf="showingSingle()">
              <mat-icon class="text-base">visibility</mat-icon>
              Vista individual
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Grid de Clientes -->
    <mat-card class="form-card overflow-hidden border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
      <mat-card-header class="border-b border-gray-100 pb-4">
        <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
          <mat-icon class="text-[#06b6d4]">table_chart</mat-icon>
          Lista de Clientes
          <span class="text-sm font-normal text-[#06b6d4] ml-2 bg-[#06b6d4] bg-opacity-10 px-2 py-1 rounded-full" *ngIf="total() > 0">
            {{ total() }} encontrados
          </span>
        </mat-card-title>
      </mat-card-header>

      <mat-card-content class="p-0">
        <div class="overflow-auto custom-scrollbar">
          <table mat-table 
                 [dataSource]="rows()" 
                 class="w-full text-sm min-w-[1000px] rounded-lg overflow-hidden"
                 [class.loading-table]="loading()">
            
            <!-- Cliente Column -->
            <ng-container matColumnDef="cliente">
              <th mat-header-cell *matHeaderCellDef class="table-header bg-gradient-to-r from-[#06b6d4] to-[#06b6d4] bg-opacity-10">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-base text-[#06b6d4]">person</mat-icon>
                  Cliente
                </div>
              </th>
              <td mat-cell *matCellDef="let r" class="table-cell border-b border-gray-100 hover:bg-[#06b6d4] hover:bg-opacity-5 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0">
                    <div class="avatar-placeholder w-10 h-10 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#0ea5e9] flex items-center justify-center text-white">
                      <mat-icon class="scale-90">person</mat-icon>
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="font-semibold text-gray-800 truncate">{{ r.nombre }}</div>
                    <div class="text-xs text-gray-500 truncate" *ngIf="r.ocupacion">
                      {{ r.ocupacion }}
                    </div>
                    <div class="text-xs text-gray-400 mt-1" *ngIf="!r.ocupacion">
                      Sin ocupación registrada
                    </div>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Teléfono Column -->
            <ng-container matColumnDef="telefono">
              <th mat-header-cell *matHeaderCellDef class="table-header bg-gradient-to-r from-[#06b6d4] to-[#06b6d4] bg-opacity-10">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-base text-[#06b6d4]">phone</mat-icon>
                  Teléfono
                </div>
              </th>
              <td mat-cell *matCellDef="let r" class="table-cell border-b border-gray-100 hover:bg-[#06b6d4] hover:bg-opacity-5 transition-colors">
                <div class="flex items-center gap-2" [class.text-gray-400]="!r.telefono">
                  <mat-icon class="text-base scale-90 text-[#06b6d4]">phone</mat-icon>
                  <span>{{ r.telefono || 'No registrado' }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Última Visita Column -->
            <ng-container matColumnDef="ultima">
              <th mat-header-cell *matHeaderCellDef class="table-header bg-gradient-to-r from-[#06b6d4] to-[#06b6d4] bg-opacity-10">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-base text-[#06b6d4]">event</mat-icon>
                  Última Visita
                </div>
              </th>
              <td mat-cell *matCellDef="let r" class="table-cell border-b border-gray-100 hover:bg-[#06b6d4] hover:bg-opacity-5 transition-colors">
                <div *ngIf="r.ultimaVisitaFecha; else noVisit" class="space-y-1">
                  <div class="font-medium text-gray-700">
                    {{ r.ultimaVisitaFecha | date:'dd/MM/yyyy' }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ r.ultimaVisitaFecha | date:'HH:mm' }}
                  </div>
                  <mat-chip *ngIf="r.ultimaVisitaEstado" 
                           [class]="getStatusChipClass(r.ultimaVisitaEstado)"
                           class="!text-xs !h-5 border border-current border-opacity-20">
                    {{ r.ultimaVisitaEstado }}
                  </mat-chip>
                </div>
                <ng-template #noVisit>
                  <div class="text-center text-gray-400 py-2">
                    <mat-icon class="text-base text-[#06b6d4]">event_busy</mat-icon>
                    <div class="text-xs mt-1">Sin visitas</div>
                  </div>
                </ng-template>
              </td>
            </ng-container>

            <!-- Resta Column -->
            <ng-container matColumnDef="resta">
              <th mat-header-cell *matHeaderCellDef class="table-header bg-gradient-to-r from-[#06b6d4] to-[#06b6d4] bg-opacity-10">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-base text-[#06b6d4]">payments</mat-icon>
                  Saldo Pendiente
                </div>
              </th>
              <td mat-cell *matCellDef="let r" class="table-cell border-b border-gray-100 hover:bg-[#06b6d4] hover:bg-opacity-5 transition-colors">
                <div class="flex items-center gap-2" 
                     [class]="getAmountClass(r.ultimaVisitaResta || 0)">
                  <mat-icon class="text-base scale-90">
                    {{ (r.ultimaVisitaResta || 0) > 0 ? 'warning' : 'check_circle' }}
                  </mat-icon>
                  <span class="font-semibold">
                    {{ (r.ultimaVisitaResta || 0) | number:'1.2-2' }}
                  </span>
                </div>
              </td>
            </ng-container>

            <!-- Último Pago Column -->
            <ng-container matColumnDef="ultimoPago">
              <th mat-header-cell *matHeaderCellDef class="table-header bg-gradient-to-r from-[#06b6d4] to-[#06b6d4] bg-opacity-10">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-base text-[#06b6d4]">paid</mat-icon>
                  Último Pago
                </div>
              </th>
              <td mat-cell *matCellDef="let r" class="table-cell border-b border-gray-100 hover:bg-[#06b6d4] hover:bg-opacity-5 transition-colors">
                <ng-container *ngIf="r.ultimoPagoFecha; else noPayment">
                  <div class="space-y-1">
                    <div class="font-medium text-green-600">
                      {{ r.ultimoPagoMonto || 0 | number:'1.2-2' }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ r.ultimoPagoFecha | date:'dd/MM/yy' }}
                    </div>
                  </div>
                </ng-container>
                <ng-template #noPayment>
                  <div class="text-center text-gray-400 py-2">
                    <mat-icon class="text-base text-[#06b6d4]">money_off</mat-icon>
                    <div class="text-xs mt-1">Sin pagos</div>
                  </div>
                </ng-template>
              </td>
            </ng-container>

            <!-- Pendiente Column -->
            <ng-container matColumnDef="pendiente">
              <th mat-header-cell *matHeaderCellDef class="table-header bg-gradient-to-r from-[#06b6d4] to-[#06b6d4] bg-opacity-10">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-base text-[#06b6d4]">pending_actions</mat-icon>
                  Estado
                </div>
              </th>
              <td mat-cell *matCellDef="let r" class="table-cell border-b border-gray-100 hover:bg-[#06b6d4] hover:bg-opacity-5 transition-colors">
                <div class="flex items-center gap-2">
                  <div class="status-dot w-3 h-3 rounded-full" [class]="getStatusDotClass(r.tieneOrdenPendiente)"></div>
                  <span class="text-sm font-medium" 
                        [class]="getStatusTextClass(r.tieneOrdenPendiente)">
                    {{ r.tieneOrdenPendiente ? 'Pendiente' : 'Al día' }}
                  </span>
                </div>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="table-header bg-gradient-to-r from-[#06b6d4] to-[#06b6d4] bg-opacity-10 text-right">
                <div class="flex items-center gap-2 justify-end">
                  <mat-icon class="text-base text-[#06b6d4]">settings</mat-icon>
                  Acciones
                </div>
              </th>
              <td mat-cell *matCellDef="let r" class="table-cell border-b border-gray-100 hover:bg-[#06b6d4] hover:bg-opacity-5 transition-colors">
                <div class="flex justify-end gap-2">
                  <button mat-stroked-button 
                          (click)="verHistorial(r)"
                          class="action-button-sm border-[#06b6d4] text-[#06b6d4] hover:bg-[#06b6d4] hover:bg-opacity-5 transition-all duration-200"
                          matTooltip="Ver historial completo">
                    <mat-icon>history</mat-icon>
                    Historial
                  </button>
                  <button mat-flat-button 
                          color="primary" 
                          (click)="nuevaVisita(r)"
                          class="save-button-sm bg-gradient-to-r from-[#06b6d4] to-[#0ea5e9] hover:from-[#0ea5e9] hover:to-[#06b6d4] shadow-md hover:shadow-lg transition-all duration-200"
                          matTooltip="Nueva visita para este cliente">
                    <mat-icon>add</mat-icon>
                    Visita
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="cols" class="table-header-row"></tr>
            <tr mat-row 
                *matRowDef="let row; columns: cols;" 
                class="table-row transition-all duration-200 hover:bg-[#06b6d4] hover:bg-opacity-10 cursor-pointer"
                [class.bg-gray-50]="!row.tieneOrdenPendiente"
                [class.bg-amber-50]="row.tieneOrdenPendiente"></tr>
          </table>

          <!-- Empty State -->
          <div *ngIf="rows().length === 0 && !loading()" class="text-center py-12">
            <mat-icon class="text-6xl text-gray-300 mb-4">group_off</mat-icon>
            <h3 class="text-lg font-semibold text-gray-500 mb-2">No se encontraron clientes</h3>
            <p class="text-gray-400 mb-4">Intenta con otros términos de búsqueda o crea un nuevo cliente</p>
            <button mat-flat-button color="primary" 
                    class="bg-gradient-to-r from-[#06b6d4] to-[#0ea5e9] hover:from-[#0ea5e9] hover:to-[#06b6d4] shadow-md hover:shadow-lg transition-all duration-200"
                    (click)="nuevaVisita()">
              <mat-icon>person_add</mat-icon>
              Crear Nuevo Cliente
            </button>
          </div>
        </div>

        <!-- Paginador -->
        <mat-paginator
          *ngIf="total() > pageSize()"
          [length]="total()"
          [pageIndex]="page() - 1"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[10, 20, 50, 100]"
          (page)="onPage($event)"
          class="border-t border-gray-100 rounded-b-xl">
        </mat-paginator>
      </mat-card-content>
    </mat-card>
  </section>
  `,
  styles: [`
    .custom-form-field .mat-form-field-flex {
      border-radius: 12px;
      padding: 0 12px;
      background: white;
      border: 1px solid #e5e7eb;
      transition: all 0.3s ease;
    }
    .custom-form-field .mat-form-field-flex:hover {
      border-color: #06b6d4;
      box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
    }
    .custom-form-field .mat-form-field-flex:focus-within {
      border-color: #06b6d4;
      box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.2);
    }
    .table-header {
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #06b6d4;
    }
    .table-cell {
      padding: 16px;
      border-bottom: 1px solid #f3f4f6;
    }
    .status-dot-success {
      background-color: #10b981;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }
    .status-dot-warning {
      background-color: #f59e0b;
      box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
    }
    .custom-scrollbar::-webkit-scrollbar {
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #06b6d4;
      border-radius: 3px;
    }
  `]
})
export class ClientesPage {
  private fb = inject(FormBuilder);
  private router = inject(Router);  
  private pacApi = inject(PacientesService);
  private destroyRef = inject(DestroyRef);

  form = this.fb.group({ 
    term: ['', [Validators.minLength(2)]]
  });

  loading = signal(false);
  sugeridos = signal<PacienteLite[]>([]);
  rows = signal<PacienteGridItem[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(20);
  showingSingle = signal(false);

  cols = ['cliente', 'telefono', 'ultima', 'resta', 'ultimoPago', 'pendiente', 'actions'] as const;

  constructor() {
    // Autosuggest por nombre/teléfono
    this.form.controls.term.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(v => (v && v.trim().length >= 2) ? this.pacApi.search(v.trim()) : of([])),
      catchError(() => of([])),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(list => this.sugeridos.set((list || []).slice(0, 8)));

    // Carga inicial
    this.loadPaged();
  }

  showResultsCount() {
    return this.rows().length > 0 || (this.form.controls.term.value?.length ?? 0) >= 2;
  }

  loadPaged() {
    this.loading.set(true);
    this.pacApi.query(this.page(), this.pageSize()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res: { page: number; pageSize: number; total: number; items: PacienteGridItem[] }) => {
        this.processPaged(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private processPaged(res: { page: number; pageSize: number; total: number; items: PacienteGridItem[] }) {
    this.page.set(res.page);
    this.pageSize.set(res.pageSize);
    this.rows.set(res.items);
    this.total.set(res.total);
    this.showingSingle.set(false);
  }

  selectSugerido(s: PacienteLite) {
    this.loading.set(true);
    this.pacApi.gridItem(s.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (item) => {
        this.rows.set([item]);
        this.total.set(1);
        this.page.set(1);
        this.showingSingle.set(true);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  buscarManual() {
    const term = this.form.controls.term.value?.trim();
    if (term && term.length >= 2) {
      this.loading.set(true);
      this.pacApi.search(term).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (items) => {
          // const gridItems: PacienteGridItem[] = items.slice(0, 50).map(item => ({
          //   ...item,
          //   ultimaVisitaResta: item.ultimaVisitaResta ?? 0,
          //   tieneOrdenPendiente: item.tieneOrdenPendiente ?? false,
          //   ultimaVisitaACuenta: item.ultimaVisitaACuenta ?? 0
          // }));
          // this.rows.set(gridItems);
          this.total.set(items.length);
          this.page.set(1);
          this.showingSingle.set(false);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  limpiar() {
    this.form.reset({ term: '' });
    this.sugeridos.set([]);
    this.page.set(1);
    this.loadPaged();
  }

  mostrarTodos() {
    this.limpiar();
  }

  onPage(e: PageEvent) {
    if (this.showingSingle()) return;
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.loadPaged();
  }

  verHistorial(r: PacienteGridItem) {
    this.router.navigate(['/clinica/historial', r.id]);
  }

  nuevaVisita(r?: PacienteGridItem) {
    if (r) {
      this.router.navigate(['/clinica/historia'], { queryParams: { pacienteId: r.id } });
    } else {
      this.router.navigate(['clinica/historia']);
    }
  }

  // Métodos de utilidad para clases dinámicas
  getStatusDotClass(tieneOrdenPendiente: boolean): string {
    return tieneOrdenPendiente ? 
      'status-dot-warning' : 'status-dot-success';
  }

  getStatusTextClass(tieneOrdenPendiente: boolean): string {
    return tieneOrdenPendiente ? 
      'text-amber-600' : 'text-green-600';
  }

  getAmountClass(amount: number): string {
    if (amount > 0) return 'text-red-600';
    if (amount < 0) return 'text-green-600';
    return 'text-gray-500';
  }

  getStatusChipClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Completado': 'bg-green-100 text-green-800 border-green-200',
      'Pendiente': 'bg-amber-100 text-amber-800 border-amber-200',
      'Cancelado': 'bg-red-100 text-red-800 border-red-200',
      'En Proceso': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  onOptionSelected(paciente: PacienteLite) {
    // Actualizar el control con el nombre, sin emitir evento para evitar una nueva búsqueda
    this.form.controls.term.setValue(paciente.nombre, { emitEvent: false });
    this.selectSugerido(paciente);
  }
}