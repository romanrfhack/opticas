export type Ojo = 'OD' | 'OI';
export type RxDistancia = 'Lejos' | 'Cerca';
export type CondicionAV = 'SinLentes' | 'ConLentes';
export type MetodoPago = 'Efectivo' | 'Tarjeta';

export interface Paciente {
  id: string;
  nombre: string;
  edad: number;
  telefono: string;
  ocupacion: string;
  direccion?: string | null;
}

export interface PacienteItem {
  id: string;
  nombre: string;
  edad: number;
  telefono: string;
  ocupacion: string;
  direccion?: string | null;
}

export interface CrearPacienteRequest {
  nombre: string;
  edad: number;
  telefono: string;
  ocupacion: string;
  direccion?: string | null;
}

export type PacienteLite = { id: string; nombre: string; telefono?: string|null };

export type PacienteGridItem = {
  id: string; nombre: string; edad: number;
  telefono?: string|null; ocupacion?: string|null;
  ultimaVisitaFecha?: string|null; ultimaVisitaEstado?: string|null;
  ultimaVisitaTotal?: number|null; ultimaVisitaACuenta: number; ultimaVisitaResta: number;
  ultimoPagoFecha?: string|null; ultimoPagoMonto?: number|null;
  tieneOrdenPendiente: boolean;
};

export type PagedResult<T> = { page: number; pageSize: number; total: number; items: T[]; };

export interface AgudezaDto {
  condicion: CondicionAV;
  ojo: Ojo;
  denominador: number; // 10..200
}

export interface RxDto {
  ojo: Ojo;
  distancia: RxDistancia;
  esf?: number | null;
  cyl?: number | null;
  eje?: number | null;
  add?: number | null;
  dip?: string | null;        // texto, p.ej. "55-70"
  altOblea?: number | null;
}

export interface MaterialItem {
  id: string;
  descripcion: string;
  marca?: string | null;
}

export interface MaterialDto {
  materialId: string;
  observaciones?: string | null;
}

export interface LcDto {
  tipo: 'Esferico' | 'Torico' | 'Otro';
  marca?: string | null;
  modelo?: string | null;
  observaciones?: string | null;
}

export interface CrearHistoriaRequest {
  pacienteId: string;
  observaciones?: string | null;
  av: AgudezaDto[];
  rx: RxDto[];
  materiales: MaterialDto[];
  lentesContacto: LcDto[];
}

export interface UltimaHistoriaItem {
  id: string;
  fecha: string;
  estado: string;
  total?: number;
  aCuenta?: number;
  resta?: number;
}

export interface EnviarLabRequest {
  total: number;
  pagos?: { monto: number; metodo: MetodoPago; autorizacion?: string | null; nota?: string | null; }[];
  fechaEstimadaEntrega?: string | null; // ISO
}
