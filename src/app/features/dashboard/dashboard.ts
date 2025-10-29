import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { DashboardService, DashboardKpis, PatientAttendance, PaymentMethods, OrderStatus, SalesByCategory, MonthlyRevenue, DashboardFilters } from '../../core/dashboard.service';
import { BranchesService } from '../../core/branches.service';

interface KPI {
  title: string;
  value: number;
  change: number; // percentage
  trend: 'up' | 'down' | 'stable';
  icon: string;
}

interface Branch {
  id: string;
  nombre: string;
  activa?: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',  
})
export class DashboardComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  Math = Math;
  
  // Servicios
  private branchesSvc = inject(BranchesService);
  private dashboardService = inject(DashboardService);
  private fb = inject(FormBuilder);
  
  // Sucursales - inicialmente vacío, se cargan desde el servicio
  branches: Branch[] = [
    { id: 'all', nombre: 'Todas las sucursales' }
  ];

  periods = [
    { value: 'day', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'year', label: 'Este año' },
    { value: 'custom', label: 'Personalizado' }
  ];

  // Datos reales
  kpis: KPI[] = [];
  
  patientAttendanceData = {
    labels: [] as string[],
    datasets: [
      { label: 'Total', data: [] as number[], backgroundColor: '#4CAF50' },
      { label: 'Nuevos', data: [] as number[], backgroundColor: '#2196F3' }
    ]
  };

  paymentMethodsData = {
    labels: [] as string[],
    datasets: [{ data: [] as number[], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'] }]
  };

  orderStatusData = {
    labels: [] as string[],
    datasets: [{ data: [] as number[], backgroundColor: ['#FF9F40', '#FF6384', '#4BC0C0', '#9966FF', '#FF6384', '#36A2EB', '#4CAF50', '#9C27B0'] }]
  };

  salesByCategoryData = {
    labels: [] as string[],
    datasets: [{ data: [] as number[], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'] }]
  };

  monthlyRevenueData = {
    labels: [] as string[],
    datasets: [
      { label: '2024', data: [] as number[], borderColor: '#36A2EB', fill: false },
      { label: '2023', data: [] as number[], borderColor: '#FF6384', fill: false }
    ]
  };

  loading = false;
  loadingBranches = false;
  private destroy$ = new Subject<void>();

  constructor() {
    this.filterForm = this.fb.group({
      period: ['week'],
      startDate: [null],
      endDate: [null],
      branchId: ['all']
    });
  }

  ngOnInit() {
    this.loadBranches();
    
    // Escuchar cambios en los filtros
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onFilterChange();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBranches() {
    this.loadingBranches = true;
    this.branchesSvc.list().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (branches) => {
        // Agregar las sucursales reales después de "Todas las sucursales"
        const realBranches = branches.map(b => ({
          id: b.id,
          nombre: b.nombre,
          activa: b.activa ?? true
        }));
        
        this.branches = [
          { id: 'all', nombre: 'Todas las sucursales' },
          ...realBranches
        ];
        this.loadingBranches = false;
        
        // Cargar datos del dashboard una vez que tenemos las sucursales
        this.loadDashboardData();
      },
      error: (error) => {
        console.error('Error loading branches', error);
        this.loadingBranches = false;
        // Intentar cargar dashboard incluso si falla la carga de sucursales
        this.loadDashboardData();
      }
    });
  }

  loadDashboardData() {
    this.loading = true;
    const filters = this.getCurrentFilters();

    forkJoin({
      kpis: this.dashboardService.getKpis(filters),
      patientAttendance: this.dashboardService.getPatientAttendance(filters),
      paymentMethods: this.dashboardService.getPaymentMethods(filters),
      orderStatus: this.dashboardService.getOrderStatus(filters),
      salesByCategory: this.dashboardService.getSalesByCategory(filters),
      monthlyRevenue: this.dashboardService.getMonthlyRevenue(filters)
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (results) => {
        this.updateKpis(results.kpis);
        this.updatePatientAttendance(results.patientAttendance);
        this.updatePaymentMethods(results.paymentMethods);
        this.updateOrderStatus(results.orderStatus);
        this.updateSalesByCategory(results.salesByCategory);
        this.updateMonthlyRevenue(results.monthlyRevenue);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading = false;
        // Mantener datos demo en caso de error
        this.loadDemoData();
      }
    });
  }

  private updateKpis(kpisData: DashboardKpis) {
    this.kpis = [
      {
        title: 'Pacientes Atendidos',
        value: kpisData.patientsAttended.value,
        change: kpisData.patientsAttended.change,
        trend: this.getTrend(kpisData.patientsAttended.change),
        icon: 'people'
      },
      {
        title: 'Nuevos Pacientes',
        value: kpisData.newPatients.value,
        change: kpisData.newPatients.change,
        trend: this.getTrend(kpisData.newPatients.change),
        icon: 'person_add'
      },
      {
        title: 'Órdenes Cobradas',
        value: kpisData.ordersPaid.value,
        change: kpisData.ordersPaid.change,
        trend: this.getTrend(kpisData.ordersPaid.change),
        icon: 'payments'
      },
      {
        title: 'Ingresos Totales',
        value: kpisData.totalIncome.value,
        change: kpisData.totalIncome.change,
        trend: this.getTrend(kpisData.totalIncome.change),
        icon: 'attach_money'
      },
      {
        title: 'Enviadas a Laboratorio',
        value: kpisData.sentToLab.value,
        change: kpisData.sentToLab.change,
        trend: this.getTrend(kpisData.sentToLab.change),
        icon: 'send'
      },
      {
        title: 'Entregadas a Clientes',
        value: kpisData.deliveredToCustomers.value,
        change: kpisData.deliveredToCustomers.change,
        trend: this.getTrend(kpisData.deliveredToCustomers.change),
        icon: 'local_shipping'
      }
    ];
  }

  private updatePatientAttendance(data: PatientAttendance) {
    this.patientAttendanceData = {
      labels: data.labels,
      datasets: [
        { label: 'Total', data: data.totalPatients, backgroundColor: '#4CAF50' },
        { label: 'Nuevos', data: data.newPatients, backgroundColor: '#2196F3' }
      ]
    };
  }

  private updatePaymentMethods(data: PaymentMethods) {
    this.paymentMethodsData = {
      labels: data.labels,
      datasets: [{ data: data.data, backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'] }]
    };
  }

  private updateOrderStatus(data: OrderStatus) {
    this.orderStatusData = {
      labels: data.labels,
      datasets: [{ data: data.data, backgroundColor: ['#FF9F40', '#FF6384', '#4BC0C0', '#9966FF', '#FF6384', '#36A2EB', '#4CAF50', '#9C27B0'] }]
    };
  }

  private updateSalesByCategory(data: SalesByCategory) {
    this.salesByCategoryData = {
      labels: data.labels,
      datasets: [{ data: data.data, backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'] }]
    };
  }

  private updateMonthlyRevenue(data: MonthlyRevenue) {
    this.monthlyRevenueData = {
      labels: data.labels,
      datasets: [
        { label: new Date().getFullYear().toString(), data: data.currentYear, borderColor: '#36A2EB', fill: false },
        { label: (new Date().getFullYear() - 1).toString(), data: data.previousYear, borderColor: '#FF6384', fill: false }
      ]
    };
  }

  private getTrend(change: number): 'up' | 'down' | 'stable' {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'stable';
  }

  private getCurrentFilters(): DashboardFilters {
    const formValue = this.filterForm.value;
    return {
      period: formValue.period,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      branchId: formValue.branchId
    };
  }

  onFilterChange() {
    if (this.filterForm.valid) {
      this.loadDashboardData();
    }
  }

  exportReport() {
    console.log('Exportando reporte...');
    // Lógica para exportar
  }

  getRandomHeight(): number {
    return Math.random() * 100;
  }

  // Método de respaldo con datos demo
  private loadDemoData() {
    this.kpis = [
      { title: 'Pacientes Atendidos', value: 156, change: 12, trend: 'up', icon: 'people' },
      { title: 'Nuevos Pacientes', value: 23, change: 5, trend: 'up', icon: 'person_add' },
      { title: 'Órdenes Cobradas', value: 89, change: -2, trend: 'down', icon: 'payments' },
      { title: 'Ingresos Totales', value: 125430, change: 8, trend: 'up', icon: 'attach_money' },
      { title: 'Enviadas a Laboratorio', value: 45, change: 15, trend: 'up', icon: 'send' },
      { title: 'Entregadas a Clientes', value: 38, change: 3, trend: 'up', icon: 'local_shipping' }
    ];
  }

  // Métodos para gradientes
  getPaymentMethodsGradient(): string {
    if (this.paymentMethodsData.datasets[0].data.length === 0) return '';
    
    const total = this.paymentMethodsData.datasets[0].data.reduce((a, b) => a + b, 0);
    let currentPercent = 0;
    let gradientParts = [];
    
    for (let i = 0; i < this.paymentMethodsData.datasets[0].data.length; i++) {
      const percent = (this.paymentMethodsData.datasets[0].data[i] / total) * 100;
      gradientParts.push(`${this.paymentMethodsData.datasets[0].backgroundColor[i]} ${currentPercent}% ${currentPercent + percent}%`);
      currentPercent += percent;
    }
    
    return `conic-gradient(${gradientParts.join(', ')})`;
  }

  getOrderStatusGradient(): string {
    if (this.orderStatusData.datasets[0].data.length === 0) return '';
    
    const total = this.orderStatusData.datasets[0].data.reduce((a, b) => a + b, 0);
    let currentPercent = 0;
    let gradientParts = [];
    
    for (let i = 0; i < this.orderStatusData.datasets[0].data.length; i++) {
      const percent = (this.orderStatusData.datasets[0].data[i] / total) * 100;
      gradientParts.push(`${this.orderStatusData.datasets[0].backgroundColor[i]} ${currentPercent}% ${currentPercent + percent}%`);
      currentPercent += percent;
    }
    
    return `conic-gradient(${gradientParts.join(', ')})`;
  }
}