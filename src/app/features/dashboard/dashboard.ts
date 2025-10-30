import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, distinctUntilChanged, switchMap, startWith, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DashboardService, DashboardKpis, PatientAttendance, PaymentMethods, OrderStatus, SalesByCategory, MonthlyRevenue, DashboardFilters } from '../../core/dashboard.service';
import { BranchesService } from '../../core/branches.service';

interface KPI {
  title: string;
  value: number;
  change: number;
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
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {
  private fb = inject(FormBuilder);
  private branchesSvc = inject(BranchesService);
  private dashboardService = inject(DashboardService);

  // ---------------- Signals ----------------
  branches = signal<Branch[]>([{ id: 'all', nombre: 'Todas las sucursales' }]);
  kpis = signal<KPI[]>([]);
  loading = signal(false);
  loadingBranches = signal(false);

  // Formulario reactivo
  filterForm: FormGroup = this.fb.group({
    period: ['week'],
    startDate: [null],
    endDate: [null],
    branchId: ['all']
  });

  // ---------------- Datos para gráficas ----------------
  patientAttendanceData = signal({
    labels: [] as string[],
    datasets: [
      { label: 'Total', data: [] as number[], backgroundColor: '#4CAF50' },
      { label: 'Nuevos', data: [] as number[], backgroundColor: '#2196F3' }
    ]
  });

  paymentMethodsData = signal({
    labels: [] as string[],
    datasets: [{ data: [] as number[], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'] }]
  });

  orderStatusData = signal({
    labels: [] as string[],
    datasets: [{ data: [] as number[], backgroundColor: ['#FF9F40', '#FF6384', '#4BC0C0', '#9966FF', '#FF6384', '#36A2EB', '#4CAF50', '#9C27B0'] }]
  });

  salesByCategoryData = signal({
    labels: [] as string[],
    datasets: [{ data: [] as number[], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'] }]
  });

  monthlyRevenueData = signal({
    labels: [] as string[],
    datasets: [
      { label: '2024', data: [] as number[], borderColor: '#36A2EB', fill: false },
      { label: '2023', data: [] as number[], borderColor: '#FF6384', fill: false }
    ]
  });

  readonly periods = [
    { value: 'day', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'year', label: 'Este año' },
    { value: 'custom', label: 'Personalizado' }
  ];

  // ---------------- Constructor ----------------
  constructor() {
    // 1️⃣ Cargar sucursales
    this.loadBranches();

    // 2️⃣ Efecto reactivo: escucha cambios del formulario
    effect(() => {
      const sub = this.filterForm.valueChanges
        .pipe(
          startWith(this.filterForm.value),
          distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
          switchMap(() => {
            this.loading.set(true);
            const filters = this.getCurrentFilters();

            // 🔐 Control de errores individual
            return forkJoin({
              kpis: this.dashboardService.getKpis(filters).pipe(catchError(() => of(null))),
              patientAttendance: this.dashboardService.getPatientAttendance(filters).pipe(catchError(() => of(null))),
              paymentMethods: this.dashboardService.getPaymentMethods(filters).pipe(catchError(() => of(null))),
              orderStatus: this.dashboardService.getOrderStatus(filters).pipe(catchError(() => of(null))),
              salesByCategory: this.dashboardService.getSalesByCategory(filters).pipe(catchError(() => of(null))),
              monthlyRevenue: this.dashboardService.getMonthlyRevenue(filters).pipe(catchError(() => of(null)))
            });
          })
        )
        .subscribe({
          next: results => {
            if (results.kpis) this.updateKpis(results.kpis);
            if (results.patientAttendance) this.updatePatientAttendance(results.patientAttendance);
            if (results.paymentMethods) this.updatePaymentMethods(results.paymentMethods);
            if (results.orderStatus) this.updateOrderStatus(results.orderStatus);
            if (results.salesByCategory) this.updateSalesByCategory(results.salesByCategory);
            if (results.monthlyRevenue) this.updateMonthlyRevenue(results.monthlyRevenue);
            this.loading.set(false);
          },
          error: err => {
            console.error('Error general del dashboard:', err);
            this.loading.set(false);
            this.loadDemoData();
          }
        });

      return () => sub.unsubscribe();
    });
  }

  // ---------------- Funciones principales ----------------
  private loadBranches() {
    this.loadingBranches.set(true);
    this.branchesSvc.list().subscribe({
      next: branches => {
        const realBranches = branches.map((b: any) => ({
          id: b.id,
          nombre: b.nombre,
          activa: b.activa ?? true
        }));
        this.branches.set([{ id: 'all', nombre: 'Todas las sucursales' }, ...realBranches]);
        this.loadingBranches.set(false);
      },
      error: err => {
        console.error('Error loading branches', err);
        this.loadingBranches.set(false);
      }
    });
  }

  private getCurrentFilters(): DashboardFilters {
    const f = this.filterForm.value;
    return {
      period: f.period,
      startDate: f.startDate,
      endDate: f.endDate,
      branchId: f.branchId
    };
  }

  private updateKpis(kpisData: DashboardKpis) {
    const list: KPI[] = [
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
    this.kpis.set(list);
  }

  private updatePatientAttendance(data: PatientAttendance) {
    this.patientAttendanceData.set({
      labels: data.labels,
      datasets: [
        { label: 'Total', data: data.totalPatients, backgroundColor: '#4CAF50' },
        { label: 'Nuevos', data: data.newPatients, backgroundColor: '#2196F3' }
      ]
    });
  }

  private updatePaymentMethods(data: PaymentMethods) {
    this.paymentMethodsData.set({
      labels: data.labels,
      datasets: [{ data: data.data, backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'] }]
    });
  }

  private updateOrderStatus(data: OrderStatus) {
    this.orderStatusData.set({
      labels: data.labels,
      datasets: [{ data: data.data, backgroundColor: ['#FF9F40', '#FF6384', '#4BC0C0', '#9966FF', '#FF6384', '#36A2EB', '#4CAF50', '#9C27B0'] }]
    });
  }

  private updateSalesByCategory(data: SalesByCategory) {
    this.salesByCategoryData.set({
      labels: data.labels,
      datasets: [{ data: data.data, backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'] }]
    });
  }

  private updateMonthlyRevenue(data: MonthlyRevenue) {
    this.monthlyRevenueData.set({
      labels: data.labels,
      datasets: [
        { label: new Date().getFullYear().toString(), data: data.currentYear, borderColor: '#36A2EB', fill: false },
        { label: (new Date().getFullYear() - 1).toString(), data: data.previousYear, borderColor: '#FF6384', fill: false }
      ]
    });
  }

  private getTrend(change: number): 'up' | 'down' | 'stable' {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'stable';
  }

  // ---------------- Demo y utilidades ----------------
  private loadDemoData() {
    this.kpis.set([
      { title: 'Pacientes Atendidos', value: 156, change: 12, trend: 'up', icon: 'people' },
      { title: 'Nuevos Pacientes', value: 23, change: 5, trend: 'up', icon: 'person_add' },
      { title: 'Órdenes Cobradas', value: 89, change: -2, trend: 'down', icon: 'payments' },
      { title: 'Ingresos Totales', value: 125430, change: 8, trend: 'up', icon: 'attach_money' },
      { title: 'Enviadas a Laboratorio', value: 45, change: 15, trend: 'up', icon: 'send' },
      { title: 'Entregadas a Clientes', value: 38, change: 3, trend: 'up', icon: 'local_shipping' }
    ]);
  }

  getPaymentMethodsGradient(): string {
    const d = this.paymentMethodsData();
    if (d.datasets[0].data.length === 0) return '';

    const total = d.datasets[0].data.reduce((a, b) => a + b, 0);
    let currentPercent = 0;
    const gradientParts: string[] = [];

    for (let i = 0; i < d.datasets[0].data.length; i++) {
      const percent = (d.datasets[0].data[i] / total) * 100;
      gradientParts.push(`${d.datasets[0].backgroundColor[i]} ${currentPercent}% ${currentPercent + percent}%`);
      currentPercent += percent;
    }

    return `conic-gradient(${gradientParts.join(', ')})`;
  }

  getOrderStatusGradient(): string {
    const d = this.orderStatusData();
    if (d.datasets[0].data.length === 0) return '';

    const total = d.datasets[0].data.reduce((a, b) => a + b, 0);
    let currentPercent = 0;
    const gradientParts: string[] = [];

    for (let i = 0; i < d.datasets[0].data.length; i++) {
      const percent = (d.datasets[0].data[i] / total) * 100;
      gradientParts.push(`${d.datasets[0].backgroundColor[i]} ${currentPercent}% ${currentPercent + percent}%`);
      currentPercent += percent;
    }

    return `conic-gradient(${gradientParts.join(', ')})`;
  }
}
