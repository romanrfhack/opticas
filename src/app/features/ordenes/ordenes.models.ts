// order-status.model.ts
// export enum OrderStatus {
//   CREADA = 'Creada',
//   REGISTRADA = 'Registrada',
//   LISTAPARA_ENVIO = 'Lista para envío',
//   EN_TRANSITO_A_SUCURSAL = 'En tránsito a sucursal',
//   RECIBIDA_EN_SUCURSAL = 'Recibida en sucursal [X]',
//   ENVIADA_A_LABORATORIO = 'Enviada a laboratorio',
//   LISTA_EN_LABORATORIO = 'Lista en laboratorio',
//   RECIBIDA_EN_SUCURSAL_CENTRAL = 'Recibida en sucursal central',
//   LISTA_PARA_ENTREGA = 'Lista para entrega',
//   RECIBIDA_EN_SUCURSAL_ORIGEN = 'Recibida en sucursal origen',
//   ENTREGADA_AL_CLIENTE = 'Entregada al cliente'
// }
export enum OrderStatus {
  CREADA = 0,
  REGISTRADA = 1,
  LISTAPARA_ENVIO = 2,
  EN_TRANSITO_A_SUCURSAL = 3,
  RECIBIDA_EN_SUCURSAL = 4,
  ENVIADA_A_LABORATORIO = 5,
  LISTA_EN_LABORATORIO = 6,
  RECIBIDA_EN_SUCURSAL_CENTRAL = 7,
  LISTA_PARA_ENTREGA = 8,
  RECIBIDA_EN_SUCURSAL_ORIGEN = 9,
  ENTREGADA_AL_CLIENTE = 10
}
export const OrderStatusLabels: { [key in OrderStatus]: string } = {
  [OrderStatus.CREADA]: 'Creada',
  [OrderStatus.REGISTRADA]: 'Registrada',
  [OrderStatus.LISTAPARA_ENVIO]: 'Lista para envío',
  [OrderStatus.EN_TRANSITO_A_SUCURSAL]: 'En tránsito a sucursal',
  [OrderStatus.RECIBIDA_EN_SUCURSAL]: 'Recibida en sucursal [X]',
  [OrderStatus.ENVIADA_A_LABORATORIO]: 'Enviada a laboratorio',
  [OrderStatus.LISTA_EN_LABORATORIO]: 'Lista en laboratorio',
  [OrderStatus.RECIBIDA_EN_SUCURSAL_CENTRAL]: 'Recibida en sucursal central',
  [OrderStatus.LISTA_PARA_ENTREGA]: 'Lista para entrega',
  [OrderStatus.RECIBIDA_EN_SUCURSAL_ORIGEN]: 'Recibida en sucursal origen',
  [OrderStatus.ENTREGADA_AL_CLIENTE]: 'Entregada al cliente'
};

export const STATUS_FLOW: OrderStatus[] = [
  OrderStatus.CREADA,
  OrderStatus.REGISTRADA,
  OrderStatus.LISTAPARA_ENVIO,
  OrderStatus.EN_TRANSITO_A_SUCURSAL,
  OrderStatus.RECIBIDA_EN_SUCURSAL,
  OrderStatus.ENVIADA_A_LABORATORIO,
  OrderStatus.LISTA_EN_LABORATORIO,
  OrderStatus.RECIBIDA_EN_SUCURSAL_CENTRAL,
  OrderStatus.LISTA_PARA_ENTREGA,
  OrderStatus.RECIBIDA_EN_SUCURSAL_ORIGEN,
  OrderStatus.ENTREGADA_AL_CLIENTE
];

export interface VisitaCostoRow {
  id: string;
  fecha: string;         // ISO
  paciente: string;
  usuarioNombre: string;
  estado: OrderStatus | string | number;
  total?: number;
  aCuenta?: number;
  resta?: number;
  fechaUltimaActualizacion?: string; // ISO
}

export interface PagedResultCE<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface ChangeVisitaStatusRequest {
  toStatus: string;
  observaciones?: string
  labTipo?: string;
  labId?: string;
  labNombre?: string;
}

export interface TotalesCobro {
  consulta: number;
  servicios: number;
  materiales: number;
  armazones: number;
  lentesContacto: number;
  total: number;
}

/** Payload que emite (guardar) desde el componente de pagos. */
export interface GuardarTotalesEvent {
  visitaId: string | number;
  totales: TotalesCobro;
  observaciones: string;
}

//export type PagedResult<T> = { page: number; pageSize: number; total: number; items: T[]; };

export interface ConceptoCrearDto {
  concepto: string;
  monto: number;
  observaciones?: string | null;
}

export interface GuardarConceptosRequest {
  conceptos: ConceptoCrearDto[];
}

export interface GuardarConceptosResponse {
  visitaId: string;
  total: number;
  conceptos: { id: string; concepto: string; monto: number; timestampUtc: string }[];
}