import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { PacientesService } from '../core/pacientes.service';
import { HistoriasService } from '../core/historias.service';
import { MaterialesService } from '../core/materiales.service';
import { AgudezaDto, CrearHistoriaRequest, LcDto, MaterialItem, PacienteItem, RxDto } from '../core/models/clinica.models';
import { EnviarLabDialog } from './enviar-lab.dialog';
import { UltimasVisitasComponent } from './ultimas-visitas.component';

// Componentes hijos

//import { PacienteCardComponent } from './components/paciente-card.component';
import { AgudezaVisualComponent } from './components/agudeza-visual.component';
import { RxFormComponent } from './components/rx-form.component';
import { MaterialesFormComponent } from './components/materiales-form.component';

import { PacienteCardComponent } from './components/paciente-card.component';
import { LentesContactoComponent } from './components/lentes-contacto.component';
import { ObservacionesAccionesComponent } from './components/observaciones-acciones.component';
import { PacienteFormComponent } from './components/paciente-form.component';

@Component({
  standalone: true,
  selector: 'app-historia-form',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatAutocompleteModule, MatSelectModule, MatDialogModule, 
    MatSnackBarModule, MatProgressBarModule, MatCardModule,
    
    // Componentes hijos
    PacienteFormComponent,
    PacienteCardComponent,
    AgudezaVisualComponent,
    RxFormComponent,
    MaterialesFormComponent,
    LentesContactoComponent,
    ObservacionesAccionesComponent,
    UltimasVisitasComponent
  ],
  templateUrl: './historia-form.component.html'
})
export class HistoriaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private pacApi = inject(PacientesService);
  private hisApi = inject(HistoriasService);
  private matApi = inject(MaterialesService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  loading = signal(false);

  // Paciente
  pacForm = this.fb.group({
    nombre: ['', Validators.required],
    edad:   [0, [Validators.required, Validators.min(0), Validators.max(120)]],
    telefono: ['',  [Validators.required, Validators.pattern(/^\d{2}\s\d{4}\s\d{4}$/)]],
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
    this.pacForm.controls.nombre.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(v => {
        if (!v || (this.pacienteId() && v === this.pacForm.value.nombre)) return of([]);
        return this.pacApi.search(v);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(list => this.sugeridos.set(list));

    // Cargar catálogo de materiales
    this.matApi.list().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
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
      ocupacion: p.ocupacion,
      direccion: p.direccion || ''
    });
  }

  crearPaciente() {
    if (!this.pacForm.valid) return;
    this.loading.set(true);
    const formVal = this.pacForm.value;
    this.pacApi.create({
      nombre: formVal.nombre!,
      edad: formVal.edad!,
      telefono: formVal.telefono || '',
      ocupacion: formVal.ocupacion || '',
      direccion: formVal.direccion || ''
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.pacienteId.set(res.id);
        this.snack.open('Paciente creado exitosamente', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.snack.open('Error al crear paciente', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  editarPaciente() {
    this.pacienteId.set(null);
  }

  agregarMaterial() {
    if (!this.materialSelId) return;
    const mat = this.materiales().find(m => m.id === this.materialSelId);
    if (!mat) return;
    this.materialesSel.update(list => [...list, {
      ...mat,
      observaciones: this.materialObs
    }]);
    this.materialSelId = null;
    this.materialObs = '';
  }

  quitarMaterial(i: number) {
    this.materialesSel.update(list => list.filter((_, idx) => idx !== i));
  }

  agregarLC() {
    if (!this.lcTipo) return;
    this.lcSel.update(list => [...list, {
      tipo: this.lcTipo,
      marca: this.lcMarca,
      modelo: this.lcModelo,
      observaciones: this.lcObs
    }]);
    this.lcTipo = 'Esferico';
    this.lcMarca = '';
    this.lcModelo = '';
    this.lcObs = '';
  }

  quitarLC(i: number) {
    this.lcSel.update(list => list.filter((_, idx) => idx !== i));
  }

  guardar() {
    if (!this.pacienteId()) return;
    this.loading.set(true);

    const agudeza: AgudezaDto[] = [
      { condicion: 'SinLentes', ojo: 'OD', denominador: this.avSinOD ?? 0 },
      { condicion: 'SinLentes', ojo: 'OI', denominador: this.avSinOI ?? 0 },
      { condicion: 'ConLentes', ojo: 'OD', denominador: this.avConOD ?? 0 },
      { condicion: 'ConLentes', ojo: 'OI', denominador: this.avConOI ?? 0 }
    ];    

    const rx: RxDto[] = [
      { ojo: 'OD', distancia: 'Lejos', esf: this.filasRx[0].esf, cyl: this.filasRx[0].cyl, eje: this.filasRx[0].eje, add: this.filasRx[0].add, dip: this.filasRx[0].dip, altOblea: this.filasRx[0].altOblea },
      { ojo: 'OI', distancia: 'Lejos', esf: this.filasRx[1].esf, cyl: this.filasRx[1].cyl, eje: this.filasRx[1].eje, add: this.filasRx[1].add, dip: this.filasRx[1].dip, altOblea: this.filasRx[1].altOblea },
      { ojo: 'OD', distancia: 'Cerca', esf: this.filasRx[2].esf, cyl: this.filasRx[2].cyl, eje: this.filasRx[2].eje, add: this.filasRx[2].add, dip: this.filasRx[2].dip, altOblea: this.filasRx[2].altOblea },
      { ojo: 'OI', distancia: 'Cerca', esf: this.filasRx[3].esf, cyl: this.filasRx[3].cyl, eje: this.filasRx[3].eje, add: this.filasRx[3].add, dip: this.filasRx[3].dip, altOblea: this.filasRx[3].altOblea },
    ];

    const req: CrearHistoriaRequest = {
      pacienteId: this.pacienteId()!,
      av: agudeza,
      rx: rx,
      materiales: this.materialesSel().map(m => ({
        materialId: m.id,
        observaciones: m.observaciones
      })),
      lentesContacto: this.lcSel(),
      observaciones: this.observaciones
    };

    this.hisApi.create(req).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.historiaId.set(res.id);
        this.snack.open('Historia guardada exitosamente', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.snack.open('Error al guardar historia', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  abrirEnviarLab() {
    if (!this.historiaId()) return;
    this.dialog.open(EnviarLabDialog, {
      width: '500px',
      data: { historiaId: this.historiaId() }
    });
  }
}