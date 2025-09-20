import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { PacientesService } from '../core/pacientes.service';
import { HistoriasService } from '../core/historias.service';
import { MaterialesService } from '../core/materiales.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AgudezaDto, CrearHistoriaRequest, LcDto, MaterialDto, MaterialItem, PacienteItem } from '../core/models/clinica.models';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UltimasVisitasComponent } from './ultimas-visitas.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  standalone: true,
  selector: 'app-historia-form',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatAutocompleteModule, MatSelectModule, MatDialogModule, UltimasVisitasComponent,
    MatSnackBarModule, MatProgressBarModule
  ],
  template: `
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Col 1-2: Formulario principal -->
    <div class="lg:col-span-2 space-y-6">
      <mat-progress-bar mode="indeterminate" *ngIf="loading()"></mat-progress-bar>

      <!-- Paciente -->
      <section class="p-4 bg-white rounded-2xl shadow">
        <div class="text-base font-semibold mb-4">Cliente</div>
        <form [formGroup]="pacForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="nombre" [matAutocomplete]="auto" placeholder="Buscar o escribir nombre..." required>
            <mat-autocomplete #auto="matAutocomplete" (optionSelected)="selectPaciente($event.option.value)">
              <mat-option *ngFor="let p of sugeridos()" [value]="p">{{ p.nombre }} — {{ p.telefono }}</mat-option>
            </mat-autocomplete>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Edad</mat-label><input matInput type="number" formControlName="edad" required></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Teléfono</mat-label><input matInput formControlName="telefono" pattern="^[0-9\\s\\-()+]{7,}$"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Ocupación</mat-label><input matInput formControlName="ocupacion"></mat-form-field>
          <mat-form-field class="md:col-span-2" appearance="outline"><mat-label>Dirección</mat-label><input matInput formControlName="direccion"></mat-form-field>
        </form>
        <div class="flex gap-3 mt-2">
          <button mat-stroked-button color="primary" (click)="crearPaciente()" *ngIf="!pacienteId()" [disabled]="pacForm.invalid">Crear Cliente</button>
          <span class="text-xs text-gray-500" *ngIf="pacienteId()">Cliente seleccionado: {{ pacForm.value.nombre }}</span>
        </div>
      </section>

      <!-- Agudeza Visual -->
      <section class="p-4 bg-white rounded-2xl shadow">
        <div class="text-base font-semibold mb-4">Agudeza visual (20/…)</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div class="font-medium mb-2">Sin lentes</div>
            <div class="grid grid-cols-2 gap-3">
              <mat-form-field appearance="outline"><mat-label>O.D.</mat-label><input matInput type="number" min="10" max="200" [ngModelOptions]="{standalone:true}" [(ngModel)]="avSinOD"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>O.I.</mat-label><input matInput type="number" min="10" max="200" [ngModelOptions]="{standalone:true}" [(ngModel)]="avSinOI"></mat-form-field>
            </div>
          </div>
          <div>
            <div class="font-medium mb-2">Con lentes</div>
            <div class="grid grid-cols-2 gap-3">
              <mat-form-field appearance="outline"><mat-label>O.D.</mat-label><input matInput type="number" min="10" max="200" [ngModelOptions]="{standalone:true}" [(ngModel)]="avConOD"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>O.I.</mat-label><input matInput type="number" min="10" max="200" [ngModelOptions]="{standalone:true}" [(ngModel)]="avConOI"></mat-form-field>
            </div>
          </div>
        </div>
      </section>

      <!-- RX -->
      <section class="p-4 bg-white rounded-2xl shadow">
        <div class="text-base font-semibold mb-4">R.X.</div>
        <div class="overflow-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left">
                <th class="w-20"></th><th>Ojo</th><th>Esf.</th><th>Cyl.</th><th>Eje</th><th>ADD</th><th>D.I.P.</th><th>ALT. OBLEA</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of filasRx">
                <td class="py-2">{{ r.dist }}</td>
                <td>{{ r.ojo }}</td>
                <td><input class="input" type="number" [ngModelOptions]="{standalone:true}" [(ngModel)]="r.esf"></td>
                <td><input class="input" type="number" [ngModelOptions]="{standalone:true}" [(ngModel)]="r.cyl"></td>
                <td><input class="input" type="number" [ngModelOptions]="{standalone:true}" [(ngModel)]="r.eje"></td>
                <td><input class="input" type="number" [ngModelOptions]="{standalone:true}" [(ngModel)]="r.add"></td>
                <td><input class="input" type="text"   [ngModelOptions]="{standalone:true}" [(ngModel)]="r.dip" placeholder="55-70"></td>
                <td><input class="input" type="number" [ngModelOptions]="{standalone:true}" [(ngModel)]="r.altOblea"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Materiales -->
      <section class="p-4 bg-white rounded-2xl shadow">
        <div class="text-base font-semibold mb-4">Material</div>
        <div class="grid grid-cols-12 gap-3 items-end">
          <mat-form-field appearance="outline" class="col-span-5">
            <mat-label>Selecciona material</mat-label>
            <mat-select [(ngModel)]="materialSelId" [ngModelOptions]="{standalone:true}">
              <mat-option *ngFor="let m of materiales()" [value]="m.id">{{ m.descripcion }} <span *ngIf="m.marca">— {{ m.marca }}</span></mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="col-span-5">
            <mat-label>Observaciones</mat-label>
            <input matInput [(ngModel)]="materialObs" [ngModelOptions]="{standalone:true}">
          </mat-form-field>
          <div class="col-span-2">
            <button mat-flat-button color="primary" (click)="agregarMaterial()" [disabled]="!materialSelId">Agregar</button>
          </div>
        </div>

        <div class="mt-3" *ngIf="materialesSel().length">
          <div class="text-sm font-medium mb-1">Seleccionados</div>
          <ul class="space-y-1">
            <li *ngFor="let x of materialesSel(); let i=index" class="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
              <div>
                <span class="font-medium">{{ x.descripcion }}</span>
                <span class="text-xs text-gray-500" *ngIf="x.marca">— {{ x.marca }}</span>
                <span class="text-xs text-gray-600" *ngIf="x.observaciones"> · {{ x.observaciones }}</span>
              </div>
              <button mat-icon-button (click)="quitarMaterial(i)" title="Quitar"><mat-icon>close</mat-icon></button>
            </li>
          </ul>
        </div>
      </section>

      <!-- Lente de contacto -->
      <section class="p-4 bg-white rounded-2xl shadow">
        <div class="text-base font-semibold mb-4">Lente de contacto</div>
        <div class="grid grid-cols-12 gap-3 items-end">
          <mat-form-field class="col-span-3" appearance="outline">
            <mat-label>Tipo</mat-label>
            <mat-select [(ngModel)]="lcTipo" [ngModelOptions]="{standalone:true}">
              <mat-option value="Esferico">Esférico</mat-option>
              <mat-option value="Torico">Tórico</mat-option>
              <mat-option value="Otro">Otro</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field class="col-span-3" appearance="outline"><mat-label>Marca</mat-label><input matInput [(ngModel)]="lcMarca" [ngModelOptions]="{standalone:true}" placeholder="ACUVUE OASYS, Biofinity..."></mat-form-field>
          <mat-form-field class="col-span-3" appearance="outline"><mat-label>Modelo</mat-label><input matInput [(ngModel)]="lcModelo" [ngModelOptions]="{standalone:true}" placeholder="ULTRA, XR..."></mat-form-field>
          <mat-form-field class="col-span-3" appearance="outline"><mat-label>Observaciones</mat-label><input matInput [(ngModel)]="lcObs" [ngModelOptions]="{standalone:true}"></mat-form-field>
        </div>
        <button mat-stroked-button (click)="agregarLC()">Agregar</button>

        <div class="mt-3" *ngIf="lcSel().length">
          <div class="text-sm font-medium mb-1">Seleccionados</div>
          <ul class="space-y-1">
            <li *ngFor="let x of lcSel(); let i=index" class="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
              <div>
                <span class="font-medium">{{ x.tipo }}</span>
                <span class="text-xs text-gray-500" *ngIf="x.marca"> · {{ x.marca }}</span>
                <span class="text-xs text-gray-500" *ngIf="x.modelo"> · {{ x.modelo }}</span>
                <span class="text-xs text-gray-600" *ngIf="x.observaciones"> · {{ x.observaciones }}</span>
              </div>
              <button mat-icon-button (click)="quitarLC(i)" title="Quitar"><mat-icon>close</mat-icon></button>
            </li>
          </ul>
        </div>
      </section>

      <!-- Observaciones y acciones -->
      <section class="p-4 bg-white rounded-2xl shadow space-y-3">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Observaciones</mat-label>
          <textarea rows="3" matInput [(ngModel)]="observaciones" [ngModelOptions]="{standalone:true}"></textarea>
        </mat-form-field>

        <div class="flex gap-3">
          <button mat-stroked-button color="primary" (click)="guardar()" [disabled]="!pacienteId()">Guardar borrador</button>
          <button mat-flat-button color="primary" (click)="abrirEnviarLab()" [disabled]="!historiaId()">Enviar a laboratorio…</button>
        </div>
      </section>
    </div>

    <!-- Col 3: últimas visitas -->
    <div class="space-y-6">
      <section class="p-4 bg-white rounded-2xl shadow">
        @defer (when pacienteId()) {
          <app-ultimas-visitas [pacienteId]="pacienteId()"></app-ultimas-visitas>
        } @placeholder {
          <div class="text-sm text-gray-500">Selecciona un cliente para ver visitas.</div>
        }
      </section>
    </div>
  </div>
  `,
  styles: [`
    .input { width: 6rem; border: 1px solid #d1d5db; border-radius: 0.5rem; padding: 0.25rem 0.5rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoriaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private pacApi = inject(PacientesService);
  private hisApi = inject(HistoriasService);
  private matApi = inject(MaterialesService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  loading = signal(false);

  // Paciente
  pacForm = this.fb.group({
    nombre: ['', Validators.required],
    edad:   [0, [Validators.required, Validators.min(0)]],
    telefono: [''],
    ocupacion: [''],
    direccion: ['']
  });
  pacienteId = signal<string | null>(null);
  sugeridos = signal<PacienteItem[]>([]);

  // AV
  avSinOD?: number; avSinOI?: number;
  avConOD?: number; avConOI?: number;

  // RX 4 filas
  filasRx: any[] = [
    { dist: 'Lejos', ojo: 'OD', esf: null, cyl: null, eje: null, add: null, dip: '', altOblea: null },
    { dist: 'Lejos', ojo: 'OI', esf: null, cyl: null, eje: null, add: null, dip: '', altOblea: null },
    { dist: 'Cerca', ojo: 'OD', esf: null, cyl: null, eje: null, add: null, dip: '', altOblea: null },
    { dist: 'Cerca', ojo: 'OI', esf: null, cyl: null, eje: null, add: null, dip: '', altOblea: null },
  ];

  // Materiales
  materiales = signal<MaterialItem[]>([]);
  materialesSel = signal<(MaterialItem & { observaciones?: string })[]>([]);
  materialSelId: string | null = null;
  materialObs: string = '';

  // Lente de contacto
  lcSel = signal<LcDto[]>([]);
  lcTipo: LcDto['tipo'] = 'Esferico';
  lcMarca = ''; lcModelo = ''; lcObs = '';

  observaciones: string = '';
  historiaId = signal<string | null>(null);

  ngOnInit() {
    // Autocomplete de pacientes
    this.pacForm.controls.nombre.valueChanges.pipe(debounceTime(250),
      distinctUntilChanged(),
      switchMap(v => {
        if (!v || (this.pacienteId() && v === this.pacForm.value.nombre)) return of([]);
        return this.pacApi.search(v);
      })
    , takeUntilDestroyed()).subscribe(list => this.sugeridos.set(list));

    // Cargar catálogo de materiales
    this.matApi.list().pipe(takeUntilDestroyed()).subscribe({
      next: (list) => this.materiales.set(list || []),
      error: () => this.materiales.set([])
    });
  }

  selectPaciente(p: PacienteItem) {
    this.pacienteId.set(p.id);
    this.pacForm.patchValue({
      nombre: p.nombre,
      edad: p.edad,
      telefono: p.telefono,
      ocupacion: p.ocupacion
    });
  }

  crearPaciente() {
    if (!this.pacForm.valid) return;
    this.loading.set(true);
    const req = this.pacForm.value as any;
    this.pacApi.create(req).subscribe({
      next: p => {
        this.pacienteId.set(p.id);
        this.snack.open('Cliente creado', 'OK', { duration: 2000 });
      },
      error: () => this.snack.open('Error al crear cliente', 'OK', { duration: 2500 }),
      complete: () => this.loading.set(false)
    });
  }

  agregarMaterial() {
    const id = this.materialSelId;
    if (!id) return;
    const mat = this.materiales().find(m => m.id === id);
    if (!mat) return;
    this.materialesSel.update(arr => [...arr, { ...mat, observaciones: this.materialObs || undefined }]);
    this.materialSelId = null; this.materialObs = '';
  }
  quitarMaterial(i: number) {
    this.materialesSel.update(arr => arr.filter((_, idx) => idx !== i));
  }

  agregarLC() {
    this.lcSel.update(arr => [...arr, {
      tipo: this.lcTipo, marca: this.lcMarca || null, modelo: this.lcModelo || null, observaciones: this.lcObs || null
    }]);
    this.lcTipo = 'Esferico'; this.lcMarca=''; this.lcModelo=''; this.lcObs='';
  }
  quitarLC(i: number) {
    this.lcSel.update(arr => arr.filter((_, idx) => idx !== i));
  }

  private clampAV(n?: number) {
    if (n == null) return n;
    return Math.min(200, Math.max(10, n));
  }

  private buildPayload(): CrearHistoriaRequest | null {
    const pid = this.pacienteId();
    if (!pid) { this.snack.open('Selecciona o crea un paciente.', 'OK', { duration: 2500 }); return null; }

    const av: AgudezaDto[] = [];
    if (this.avSinOD) av.push({ condicion: 'SinLentes', ojo: 'OD', denominador: this.clampAV(this.avSinOD)! });
    if (this.avSinOI) av.push({ condicion: 'SinLentes', ojo: 'OI', denominador: this.clampAV(this.avSinOI)! });
    if (this.avConOD) av.push({ condicion: 'ConLentes', ojo: 'OD', denominador: this.clampAV(this.avConOD)! });
    if (this.avConOI) av.push({ condicion: 'ConLentes', ojo: 'OI', denominador: this.clampAV(this.avConOI)! });

    const rx = this.filasRx.map(r => ({
      ojo: r.ojo, distancia: r.dist,
      esf: r.esf != null ? +r.esf : null,
      cyl: r.cyl != null ? +r.cyl : null,
      eje: r.eje != null ? +r.eje : null,
      add: r.add != null ? +r.add : null,
      dip: r.dip || null,
      altOblea: r.altOblea != null ? +r.altOblea : null
    }));

    const materiales: MaterialDto[] = this.materialesSel().map(x => ({ materialId: x.id, observaciones: x.observaciones || null }));
    const lentesContacto: LcDto[] = this.lcSel();

    const payload: CrearHistoriaRequest = {
      pacienteId: pid,
      observaciones: this.observaciones || null,
      av, rx, materiales, lentesContacto
    };
    return payload;
  }

  guardar() {
    const payload = this.buildPayload();
    if (!payload) return;
    this.loading.set(true);
    this.hisApi.crear(payload).subscribe({
      next: res => { this.historiaId.set(res.id); this.snack.open('Historia guardada', 'OK', { duration: 2000 }); },
      error: () => this.snack.open('Error al guardar historia', 'OK', { duration: 2500 }),
      complete: () => this.loading.set(false)
    });
  }

  async abrirEnviarLab() {
    if (!this.historiaId()) return;
    const { EnviarLabDialog } = await import('./enviar-lab.dialog');
    const ref = this.dialog.open(EnviarLabDialog, { width: '720px' });
    ref.afterClosed().subscribe(data => {
      if (!data) return;
      this.loading.set(true);
      this.hisApi.enviarALab(this.historiaId()!, {
        total: +data.total,
        pagos: (data.pagos || []).map((p: any) => ({
          metodo: p.metodo, monto: +p.monto, autorizacion: p.autorizacion || null, nota: p.nota || null
        })),
        fechaEstimadaEntrega: data.fechaEstimadaEntrega || null
      }).subscribe({
        next: () => this.snack.open('Orden enviada a laboratorio', 'OK', { duration: 2000 }),
        error: () => this.snack.open('Error al enviar a laboratorio', 'OK', { duration: 2500 }),
        complete: () => this.loading.set(false)
      });
    });
  }
}
