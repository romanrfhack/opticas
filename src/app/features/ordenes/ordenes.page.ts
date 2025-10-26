import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { VisitasCostosService } from '../../core/visitasCostos.service';
import { ChangeVisitaStatusRequest, OrderStatus, OrderStatusLabels, PagedResultCE, STATUS_FLOW, VisitaCostoRow } from './ordenes.models';
import { HistoriasService } from '../../core/historias.service';
import { MatDialog } from '@angular/material/dialog';
import { VisitaDetalleModalComponent } from '../../clinica/components/visita-detalle-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CambiarEstatusDialog, CambiarEstatusDialogData } from './cambiar-estatus.dialog';
import { Paciente, PacienteGridItem, PacienteLite } from '../../core/models/clinica.models';
import { AuthService } from '../../auth/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PacientesService } from '../../core/pacientes.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, filter, of, switchMap, tap } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  selector: 'app-costos-page',
  template: `
  <div class="p-4 space-y-4">
    <h1 *ngIf="isAdmin()" class="text-2xl font-semibold">Ordenes — Todas las sucursales</h1>
    <h1 *ngIf="isEncargado()" class="text-2xl font-semibold">Ordenes — Mi sucursal</h1>
    <h1 *ngIf="isMensajero()" class="text-2xl font-semibold">Ordenes — Mi sucursal</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">      
      <!-- <mat-form-field appearance="outline">
        <mat-label>Estado</mat-label>
        <mat-select (selectionChange)="onEstado($event.value)">
          <mat-option [value]="''">Todos</mat-option>
          <mat-option *ngFor="let e of estados" [value]="e">{{e}}</mat-option>
        </mat-select>
      </mat-form-field> -->
    </div>

    <!-- Panel de Búsqueda Principal -->
      <div class="bg-white/20 bg-blue-500/20-md border border-white/30">
        <div class="max-w-2xl mx-auto">
          <div class="text-center mb-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-2">
              ¿A qué cliente buscas?
            </h2>
            <p class="text-gray-600">
              Escribe el nombre o teléfono del cliente
            </p>
          </div>

          <form [formGroup]="searchForm" class="relative">
            <!-- INPUT MEJORADO - Sin línea divisora -->

                        <!-- Search Combobox (Tailwind puro) -->
            <div class="relative max-w-2xl mx-auto">
              <label for="search" class="sr-only">Buscar cliente</label>
              <div
                class="flex items-center rounded-xl border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-cyan-400 transition"
                role="combobox"
                aria-haspopup="listbox"
                aria-owns="result-list"
                [attr.aria-expanded]="open"
              >
                <svg class="mx-3 h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"/>
                </svg>

                <input
                  id="search"
                  type="text"
                  class="flex-1 py-3 pr-10 outline-none bg-transparent text-gray-800 placeholder-gray-400"
                  placeholder="Buscar cliente…"
                  [formControl]="searchForm.controls.searchTerm"
                  (focus)="open = true"
                  (keydown)="onKeydown($event)"
                  aria-autocomplete="list"
                  aria-controls="result-list"
                  [attr.aria-activedescendant]="activeOptionId"
                />

                <button
                  type="button"
                  class="p-2 text-gray-400 hover:text-cyan-600 focus:outline-none"
                  *ngIf="searchForm.controls.searchTerm.value"
                  (click)="clearSearch(); inputEl.focus()"
                  aria-label="Limpiar búsqueda"
                >
                  <mat-icon fontIcon="close"></mat-icon>
                </button>
              </div>

              <!-- Dropdown -->
              <div
                *ngIf="open && suggestedPatients().length > 0"
                id="result-list"
                role="listbox"
                class="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
              >
                <button
                  *ngFor="let p of suggestedPatients(); let i = index"
                  role="option"
                  type="button"
                  [id]="'option-'+i"
                  (click)="selectFromList(p)"
                  (mouseenter)="activeIndex = i"
                  class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-cyan-50"
                  [class.bg-cyan-50]="i === activeIndex"
                  [attr.aria-selected]="i === activeIndex"
                >
                  <span class="inline-flex items-center justify-center h-8 w-8 rounded-full bg-cyan-100 text-cyan-600">
                    <mat-icon fontIcon="person" class="text-base"></mat-icon>
                  </span>
                  <span class="flex-1">
                    <span class="block font-medium text-gray-800">{{ p.nombre }}</span>
                    <span class="block text-xs text-gray-500" *ngIf="p.telefono">{{ p.telefono }}</span>
                  </span>
                </button>
              </div>

              <!-- Estado vacío -->
              <div
                *ngIf="open && searchForm.controls.searchTerm.value && suggestedPatients().length === 0"
                class="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500"
              >
                Sin resultados
              </div>
            </div>
          </form>

          <!-- Contadores y Filtros -->
          <div class="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
            <div class="text-sm text-gray-600">
              <span *ngIf="displayedPatients().length > 0 && !selectedPatient()">
                Mostrando <span class="font-semibold text-[#06b6d4]">{{ displayedPatients().length }}</span> 
                de <span class="font-semibold text-[#06b6d4]">{{ allPatients().length }}</span> clientes
              </span>
              <span *ngIf="displayedPatients().length === 0 && !searchForm.controls.searchTerm.value && !selectedPatient()">
                Escribe para buscar clientes...
              </span>
              <span *ngIf="displayedPatients().length === 0 && searchForm.controls.searchTerm.value && !selectedPatient()">
                No se encontraron clientes
              </span>
              <span *ngIf="selectedPatient()" class="text-[#06b6d4] font-semibold">
                Vista individual - {{ selectedPatient()?.nombre }}
              </span>
            </div>

            <button 
              mat-stroked-button
              (click)="showAllPatients()"
              class="p-2 border-[#06b6d4] text-[#06b6d4] hover:bg-[#06b6d4] hover:text-white hover:p-2 hover:bg-opacity-5 transition-colors">
              <mat-icon>refresh</mat-icon>
              Mostrar Todos
            </button>
          </div>
        </div>
      </div>

    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
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
            <button mat-icon-button *ngIf="validarPuedeEditar(r)" (click)="abrirCambiarEstatus(r)" title="Cambiar estatus">
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
  private authService = inject(AuthService);

  cols = ['fecha','paciente','usuario','estado','detalle', 'acciones'];
  estados = Object.values(OrderStatus);
  
  private fb = inject(FormBuilder);    
  open = false;
  activeIndex = -1;
  get activeOptionId() { return this.activeIndex >= 0 ? `option-${this.activeIndex}` : null; }
  suggestedPatients = signal<PacienteLite[]>([]);
  allPatients = signal<PacienteGridItem[]>([]);
  selectedPatient = signal<PacienteGridItem | null>(null);
  private pacApi = inject(PacientesService);
  private destroyRef = inject(DestroyRef);
  loading = signal(false);
  inputEl!: HTMLInputElement;

  searchForm = this.fb.group({ 
    searchTerm: ['', [Validators.minLength(2)]]
  });

  displayedPatients = computed(() => {
    if (this.selectedPatient()) {
      return [this.selectedPatient()!];
    }
    const searchTerm = this.searchForm.controls.searchTerm.value?.toLowerCase() || '';
    const patients = this.allPatients();
    if (!searchTerm) return patients;
    return patients.filter(patient => 
      patient.nombre.toLowerCase().includes(searchTerm) ||
      patient.telefono?.includes(searchTerm) ||
      patient.ocupacion?.toLowerCase().includes(searchTerm)
    );
  });

  // estado local
  items = signal<VisitaCostoRow[]>([]);
  itemsSinFiltrar = signal<VisitaCostoRow[]>([]);
  itemsFiltrados = signal<VisitaCostoRow[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(20);
  search = signal<string>('');
  estado = signal<string>('');
  isAdmin = computed(() => !!this.authService.user()?.roles?.includes('Admin'));
  isEncargado = computed(() => !!this.authService.user()?.roles?.includes('Encargado'));
  isMensajero = computed(() => !!this.authService.user()?.roles?.includes('Mensajero'));
  estadosUpdateAdmin = [0,1,2,3,4,5,6,7,8];
  estadosUpdateEncargado = [0,1,3,4,5,6];
  estadosUpdateMensajero = [2,3];

  constructor() {
      // 🔧 Búsqueda en tiempo real robusta: salir de vista individual al teclear y filtrar valores no-string
      this.searchForm.controls.searchTerm.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.selectedPatient.set(null)),     // <- clave para no “quedarse” en detalle
        filter((term: unknown) => typeof term === 'string'), // <- evita objetos del autocomplete
        switchMap((term: string) => {
          const q = term.trim();
          if (q.length >= 2) {
            return this.pacApi.search(q).pipe(catchError(() => of([])));
          }
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(patients => {
        this.suggestedPatients.set(patients.slice(0, 5));
      });
  
      this.loadAllPatients();
    }

  showAllPatients() {
    this.clearSearch();
    this.loadAllPatients();
    this.items.set(this.itemsSinFiltrar());
  }

  clearSearch() {
    this.searchForm.controls.searchTerm.setValue('');
    this.suggestedPatients.set([]);
    this.activeIndex = -1;
    this.open = true; // opcional: deja el dropdown listo para nuevos resultados
  }

  loadAllPatients() {
    this.loading.set(true);
    this.pacApi.query(1, 1000).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.allPatients.set(res.items || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

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
      this.itemsSinFiltrar.set(res.items);
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
      return OrderStatusLabels[STATUS_FLOW[estadoIndex]];
    }
    
    // Manejar casos donde el índice no es válido
    console.warn(`Índice de estado inválido: ${estadoIndex}`);
    return 'Desconocido';
  }

  // En tu componente padre
    openStatusDialog(visita: any) {                  
      // Calcular estados permitidos (solo el siguiente en este caso)
      const allowedStatuses = [visita.estado + 1];

      const dialogRef = this.dialog.open(CambiarEstatusDialog, {
        width: '600px',
        data: {
          visitaId: visita.id,
          fromStatus: visita.estado, 
          allowed: allowedStatuses, // Array de 
          usuarioNombre: visita.usuarioNombre,
          fecha: visita.fechaUltimaActualizacion || visita.fecha,
          Paciente: visita.paciente          
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
      console.log("Abrir cambiar estatus para visita:", visita);
      this.openStatusDialog(visita);
    }

    validarPuedeEditar(visita: VisitaCostoRow): boolean {
      let puedeEditar = false;
      let rolUsuario = 'Administrador'; // Aquí deberías obtener el rol real del usuario actual
      const estadoActual = visita.estado;
      
      return puedeEditar;
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
        this.load();
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

    onKeydown(e: KeyboardEvent) {
      console.log("Keydown en input de búsqueda:", e.key);
      const len = this.suggestedPatients().length;
      if (!this.open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { this.open = true; }
      switch (e.key) {
        case 'ArrowDown':
          if (len > 0) { this.activeIndex = (this.activeIndex + 1) % len; e.preventDefault(); }
          break;
        case 'ArrowUp':
          if (len > 0) { this.activeIndex = (this.activeIndex - 1 + len) % len; e.preventDefault(); }
          break;
        case 'Enter':
          if (this.open && this.activeIndex >= 0) {
            const p = this.suggestedPatients()[this.activeIndex];
            this.selectFromList(p);
            e.preventDefault();
          }
          break;
        case 'Escape':
          this.open = false;
          break;
      }
    }

    selectFromList(p: PacienteLite) {
      this.onPatientSelected(p);           // tu lógica existente
      this.searchForm.controls.searchTerm.setValue(p.nombre, { emitEvent: false });
      this.open = false;
    }

    onPatientSelected(patient: PacienteLite) {    
    this.suggestedPatients.set([]);    
    this.searchForm.controls.searchTerm.setValue(patient.nombre, { emitEvent: false });    
    const fullPatient = this.allPatients().find(p => p.id === patient.id);
    if (fullPatient) {
      this.selectedPatient.set(fullPatient);
    }
    this.itemsFiltrados.set(
      this.itemsSinFiltrar().filter(item => item.paciente === patient.nombre)
    );
    this.items.set(this.itemsFiltrados());
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

