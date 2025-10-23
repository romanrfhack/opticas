// order-status.model.ts
export enum OrderStatus {
  CREADA = 'Creada',
  REGISTRADA = 'Registrada',
  EN_TRANSITO_A_SUCURSAL = 'En tránsito a sucursal',
  RECIBIDA_EN_SUCURSAL = 'Recibida en sucursal [X]',
  ENVIADA_A_LABORATORIO = 'Enviada a laboratorio',
  LISTA_EN_LABORATORIO = 'Lista en laboratorio',
  RECIBIDA_EN_SUCURSAL_CENTRAL = 'Recibida en sucursal central',
  LISTA_PARA_ENTREGA = 'Lista para entrega',
  RECIBIDA_EN_SUCURSAL_ORIGEN = 'Recibida en sucursal origen',
  ENTREGADA_AL_CLIENTE = 'Entregada al cliente'
}

export const STATUS_FLOW: OrderStatus[] = [
  OrderStatus.CREADA,
  OrderStatus.REGISTRADA,
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

//export type PagedResult<T> = { page: number; pageSize: number; total: number; items: T[]; };