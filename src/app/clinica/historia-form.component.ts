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
import { AgudezaDto, CrearHistoriaRequest, LcDto, MaterialHistoriaDto, MaterialItem, PacienteItem, RxDto } from '../core/models/clinica.models';
import { EnviarLabDialog } from './enviar-lab.dialog';
import { UltimasVisitasComponent } from './ultimas-visitas.component';

// Componentes hijos


import { AgudezaVisualComponent } from './components/agudeza-visual.component';
import { RxFormComponent } from './components/rx-form.component';
import { MaterialesFormComponent } from './components/materiales-form.component';
import { PacienteCardComponent } from './components/paciente-card.component';
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
  observaciones: string = '';

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
  
  historiaId = signal<string | null>(null);

  // Propiedades para manejar los datos
armazonesSel: any[] = []; // O el tipo específico que uses
lentesContactoSel: any[] = []; // Para lentes de contacto

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
  
  // En historia-form.component.ts
agregarMaterial(materialData?: MaterialHistoriaDto) {
  if (!this.materialSelId && !materialData) return;
  
  let materialId: string;
  let observaciones: string;

  // Si viene el data completo (con observaciones), usarlo
  if (materialData) {
    materialId = materialData.materialId;
    observaciones = materialData.observaciones || '';
  } else {
    // Si no, usar los valores locales (para compatibilidad)
    materialId = this.materialSelId!;
    observaciones = this.materialObs;
  }

  const mat = this.materiales().find(m => m.id === materialId);
  if (!mat) return;
  
  console.log('📦 Agregando material al estado principal:');
  console.log('   - Material:', mat.descripcion);
  console.log('   - Observaciones:', observaciones);
  
  this.materialesSel.update(list => [...list, {
    ...mat,
    observaciones: observaciones // ✅ Asegurar que las observaciones se guarden
  }]);
  
  this.materialSelId = null;
  this.materialObs = '';
}

quitarMaterial(index: number) {
  console.log('🗑️ Quitando material en índice:', index);
  console.log('📋 Materiales antes:', this.materialesSel());
  
  this.materialesSel.update(list => {
    const nuevaLista = list.filter((_, idx) => idx !== index);
    console.log('📋 Materiales después:', nuevaLista);
    return nuevaLista;
  });
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
      observaciones: this.observaciones,
      armazones: [] // Agrega aquí los armazones, o un array vacío si no hay
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

  

// En el componente principal, actualiza las propiedades para lentes de contacto
//lentesContactoSel: any[] = [];

// Método para manejar lentes de contacto desde MaterialesFormComponent
onLentesContactoChange(lentes: any[]) {
  this.lentesContactoSel = lentes;
  console.log('📦 Lentes de contacto actualizados:', lentes);
}


// En historia-form.component.ts, actualizar el guardarBorrador:
guardarBorrador() {
  if (!this.pacienteId()) {
    console.error('No hay paciente seleccionado');
    return;
  }

  // Debug: ver qué tenemos en armazonesSel
  console.log('🔍 Debug - armazonesSel completo:', this.armazonesSel);
  console.log('🔍 Debug - primer armazón:', this.armazonesSel[0]);

  // Preparar los datos para guardar
  const datosHistoria = {
    pacienteId: this.pacienteId(),
    agudezaVisual: {
      sinOD: this.avSinOD,
      sinOI: this.avSinOI,
      conOD: this.avConOD,
      conOI: this.avConOI
    },
    prescripcion: this.filasRx,
    materiales: this.materialesSel().map(m => {
      console.log('📦 Procesando material para guardar:', m);
      return {
        id: m.id,
        descripcion: m.descripcion,
        marca: m.marca,
        observaciones: m.observaciones || '' // ✅ Esto debería capturar las observaciones
      };
    }),
    armazones: this.armazonesSel.map(a => {
      // Intentar diferentes formas de obtener el ID
      const productoId = a.id || a.productoId || 'ID_NO_ENCONTRADO';
      console.log('🔍 Procesando armazón:', a, '-> productoId:', productoId);
      
      return {
        productoId: productoId,
        observaciones: a.observaciones || ''
      };
    }),
    lentesContacto: this.lentesContactoSel,
    observaciones: this.observaciones,
    fecha: new Date().toISOString()
  };

  console.log('=== GUARDANDO BORRADOR ===');
  console.log('📋 Datos completos del borrador:');
  console.log(JSON.stringify(datosHistoria, null, 2));
  
  alert('Borrador guardado exitosamente');
}

// Método para registrar pago/adelanto
registrarPagoAdelanto() {
  if (!this.historiaId()) {
    console.error('No hay historia guardada');
    return;
  }

  console.log('Abriendo modal de pago/adelanto para historia:', this.historiaId());
  
  // Aquí abrirías el modal de pago/adelanto
  // this.abrirModalPago();
}

// Método para manejar cambios en armazones (si no lo tienes)
onArmazonesChange(armazones: any[]) {
  console.log('🎯 Armazones recibidos en componente principal:', armazones);
  this.armazonesSel = armazones;
}

// Métodos para lentes de contacto (si los usas)
agregarLenteContacto(lente: any) {
  this.lentesContactoSel.push(lente);
}

quitarLenteContacto(index: number) {
  this.lentesContactoSel.splice(index, 1);
}


}