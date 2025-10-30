import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderStatus, OrderStatusLabels, STATUS_FLOW } from './ordenes.models';
//import { OrderStatus, OrderStatusLabels, STATUS_FLOW } from '../models/order-status'; // ajusta el path

@Component({
  selector: 'app-order-status-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div 
    class="relative flex"
    [ngClass]="orientation === 'vertical' 
      ? 'flex-col items-center justify-start' 
      : 'flex-row items-center justify-center'">

    <!-- Línea base -->
    <div 
      class="absolute bg-gray-300"
      [ngClass]="orientation === 'vertical' 
        ? 'w-1 top-0 bottom-0 left-1/2 -translate-x-1/2' 
        : 'h-1 left-0 right-0 top-1/2 -translate-y-1/2'">
    </div>

    <!-- Estados -->
    <ng-container *ngFor="let status of STATUS_FLOW; let i = index">
      <div 
        class="relative z-10 flex flex-col items-center justify-center"
        [ngClass]="orientation === 'horizontal' 
          ? 'mx-4 my-2' 
          : 'my-4'">

        <!-- Ícono circular -->
        <div 
          class="flex items-center justify-center rounded-full border-4 transition-all duration-300"
          [ngClass]="{
            'bg-blue-500 border-blue-600 scale-125 shadow-lg shadow-blue-300': currentStatus === status,
            'bg-gray-200 border-gray-400': currentStatus !== status
          }"
          [ngStyle]="{
            width: currentStatus === status ? '4rem' : '3.5rem',
            height: currentStatus === status ? '4rem' : '3.5rem'
          }">
          <span class="text-3xl"
            [ngClass]="{ 'text-white': currentStatus === status, 'text-gray-600': currentStatus !== status }">
            {{ getIcon(status) }}
          </span>
        </div>

        <!-- Nombre del estado -->
        <div 
          class="mt-2 text-center font-medium transition-all duration-200 whitespace-nowrap"
          [title]="getLabel(status)"
          [ngClass]="{
            'text-blue-600 font-semibold relative z-20 px-2 py-1 rounded-lg bg-white shadow-md': currentStatus === status,
            'text-gray-600 truncate overflow-hidden': currentStatus !== status
          }"
          [ngStyle]="{
            maxWidth: currentStatus === status ? 'none' : '6rem',
            fontSize: currentStatus === status ? '0.9rem' : '0.8rem'
          }">
          {{ getLabel(status) }}
        </div>

        <!-- Conector -->
        <div
          *ngIf="i < STATUS_FLOW.length - 1"
          class="absolute bg-gray-300 transition-colors duration-300"
          [ngClass]="{
            'bg-blue-400': currentStatus > status,
            'bg-gray-300': currentStatus <= status
          }"
          [ngStyle]="
            orientation === 'vertical'
              ? { width: '4px', height: '40px', top: '80px' }
              : { height: '4px', width: '60px', left: '80px', top: '50%' }
          ">
        </div>
      </div>
    </ng-container>
  </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      position: relative;
      padding: 1rem;
    }
    /* Evita que los textos muevan los íconos */
    .truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `]
})
export class OrderStatusTimelineComponent {
  @Input() currentStatus: OrderStatus = OrderStatus.CREADA;
  @Input() orientation: 'vertical' | 'horizontal' = 'vertical';

  STATUS_FLOW = STATUS_FLOW;

  getLabel(status: OrderStatus): string {
    return OrderStatusLabels[status];
  }

  getIcon(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.CREADA: return '🧾';
      case OrderStatus.REGISTRADA: return '📋';
      case OrderStatus.LISTAPARA_ENVIO: return '📦';
      case OrderStatus.EN_TRANSITO_A_SUCURSAL_MATRIZ: return '🚚';
      case OrderStatus.RECIBIDA_EN_SUCURSAL_MATRIZ: return '🏠';
      case OrderStatus.ENVIADA_A_LABORATORIO: return '🏭';
      case OrderStatus.LISTA_EN_LABORATORIO: return '🔬';
      case OrderStatus.EN_TRANSITO_DE_LABORATORIO_A_SUCURSAL_MATRIZ: return '🚛';
      case OrderStatus.RECIBIDA_LISTA_EN_SUCURSAL_MATRIZ: return '🏢';
      case OrderStatus.EN_TRANSITO_A_SUCURSAL_ORIGEN: return '🚐';
      case OrderStatus.RECIBIDA_EN_SUCURSAL_ORIGEN: return '🏘️';
      case OrderStatus.ENTREGADA_AL_CLIENTE: return '🤝';
      default: return '⚪';
    }
  }
}
