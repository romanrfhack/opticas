import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

interface DashboardFilter {
  period: string; // 'day' | 'week' | 'month' | 'year' | 'custom'
  startDate?: Date;
  endDate?: Date;
  branchId: string; // 'all' or specific branch ID
}

interface KPI {
  title: string;
  value: number;
  change: number; // percentage
  trend: 'up' | 'down' | 'stable';
  icon: string;
}


@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',  
})
export class DashboardComponent implements OnInit {
  filterForm: FormGroup;
   Math = Math;
  branches = [
    { id: 'all', name: 'Todas las sucursales' },
    { id: '1', name: 'Sucursal Centro' },
    { id: '2', name: 'Sucursal Norte' },
    { id: '3', name: 'Sucursal Sur' }
  ];

  periods = [
    { value: 'day', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'year', label: 'Este año' },
    { value: 'custom', label: 'Personalizado' }
  ];

  // Datos mock para las KPIs
  kpis: KPI[] = [
    { title: 'Pacientes Atendidos', value: 156, change: 12, trend: 'up', icon: 'people' },
    { title: 'Nuevos Pacientes', value: 23, change: 5, trend: 'up', icon: 'person_add' },
    { title: 'Órdenes Cobradas', value: 89, change: -2, trend: 'down', icon: 'payments' },
    { title: 'Ingresos Totales', value: 125430, change: 8, trend: 'up', icon: 'attach_money' },
    { title: 'Enviadas a Laboratorio', value: 45, change: 15, trend: 'up', icon: 'send' },
    { title: 'Entregadas a Clientes', value: 38, change: 3, trend: 'up', icon: 'local_shipping' }
  ];

  // Datos mock para gráficas
  patientAttendanceData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      { label: 'Nuevos', data: [12, 19, 8, 15, 12, 10, 5], backgroundColor: '#4CAF50' },
      { label: 'Recurrentes', data: [25, 29, 32, 28, 31, 22, 18], backgroundColor: '#2196F3' }
    ]
  };

  paymentMethodsData = {
    labels: ['Efectivo', 'Tarjeta', 'Transferencia'],
    datasets: [{ data: [45, 35, 20], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'] }]
  };

  orderStatusData = {
    labels: ['Pendientes', 'En Lab', 'Recibidas', 'Entregadas'],
    datasets: [{ data: [15, 25, 18, 42], backgroundColor: ['#FF9F40', '#FF6384', '#4BC0C0', '#9966FF'] }]
  };

  salesByCategoryData = {
    labels: ['Armazones', 'Lentes Contacto', 'Materiales', 'Servicios'],
    datasets: [{ data: [40, 25, 20, 15], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'] }]
  };

  monthlyRevenueData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      { label: '2024', data: [120000, 135000, 110000, 145000, 160000, 155000], borderColor: '#36A2EB', fill: false },
      { label: '2023', data: [100000, 115000, 105000, 125000, 140000, 130000], borderColor: '#FF6384', fill: false }
    ]
  };

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      period: ['week'],
      startDate: [null],
      endDate: [null],
      branchId: ['all']
    });
  }

  ngOnInit() {
    // Simular carga de datos
    this.loadDashboardData();
  }

  loadDashboardData() {
    console.log('Cargando datos con filtros:', this.filterForm.value);
    // Aquí iría la llamada al API real
  }

  onFilterChange() {
    this.loadDashboardData();
  }

  exportReport() {
    console.log('Exportando reporte...');
    // Lógica para exportar
  }
  getRandomHeight(): number {
    return Math.random() * 100;
  }
}