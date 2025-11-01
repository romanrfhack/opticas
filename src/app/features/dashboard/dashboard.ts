import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { Branch, BranchesService } from '../../core/branches.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgApexchartsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private branchesSvc = inject(BranchesService);
  private fb = inject(FormBuilder);
  filterForm!: FormGroup;
  loading = () => this._loading;
  _loading = false;
  branches = signal<Branch[]>([{
    id: 'all', nombre: 'Todas las sucursales',
    activa: false
  }]);

  loadingBranches = signal(false);

  kpis: any[] = [];
  patientsChart: Partial<ApexOptions> = {};
  paymentsChart: Partial<ApexOptions> = {};
  ordersChart: Partial<ApexOptions> = {};
  salesChart: Partial<ApexOptions> = {};

  periods = [
    { label: 'Esta semana', value: 'week' },
    { label: 'Este mes', value: 'month' },
    { label: 'Personalizado', value: 'custom' },
  ];

  ngOnInit() {
    this.filterForm = this.fb.group({
      period: ['week'],
      startDate: [''],
      endDate: [''],
      branchId: ['all'],
    });
    // 1️⃣ Cargar sucursales
    this.loadBranches();
    this.loadDashboardData();
  }

  loadDashboardData() {
    this._loading = true;
    const { period, branchId } = this.filterForm.value;
    const base = `${environment.apiBaseUrl}/Dashboard`;

    Promise.all([
      this.http.get(`${base}/kpis?period=${period}&branchId=${branchId}`).toPromise(),
      this.http.get(`${base}/patient-attendance?period=${period}&branchId=${branchId}`).toPromise(),
      this.http.get(`${base}/payment-methods?period=${period}&branchId=${branchId}`).toPromise(),
      this.http.get(`${base}/order-status?period=${period}&branchId=${branchId}`).toPromise(),
      this.http.get(`${base}/sales-by-category?period=${period}&branchId=${branchId}`).toPromise(),
    ])
      .then(([kpis, patients, payments, orders, sales]: any) => {
        this.setKpis(kpis);
        this.setPatientsChart(patients);
        this.setPaymentsChart(payments);
        this.setOrdersChart(orders);
        this.setSalesChart(sales);
      })
      .finally(() => (this._loading = false));
  }

  setKpis(data: any) {
    this.kpis = [
      { title: 'Pacientes Atendidos', value: data.patientsAttended.value, change: data.patientsAttended.change, icon: 'groups', iconColor: 'blue' },
      { title: 'Nuevos Pacientes', value: data.newPatients.value, change: data.newPatients.change, icon: 'person_add', iconColor: 'cyan' },
      { title: 'Órdenes Pagadas', value: data.ordersPaid.value, change: data.ordersPaid.change, icon: 'payments', iconColor: 'green' },
      { title: 'Ingresos Totales', value: data.totalIncome.value, change: data.totalIncome.change, icon: 'attach_money', iconColor: 'blue', isMoney: true },
      { title: 'Enviadas a Laboratorio', value: data.sentToLab.value, change: data.sentToLab.change, icon: 'science', iconColor: 'yellow' },
      { title: 'Entregadas', value: data.deliveredToCustomers.value, change: data.deliveredToCustomers.change, icon: 'check_circle', iconColor: 'green' },
    ];
  }

  setPatientsChart(data: any) {
    this.patientsChart = {
      chart: { type: 'bar', height: 260, toolbar: { show: false } },
      series: [
        { name: 'Total', data: data.totalPatients },
        { name: 'Nuevos', data: data.newPatients },
      ],
      xaxis: { categories: data.labels },
      plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
      colors: ['#3b82f6', '#06b6d4'],
      grid: { strokeDashArray: 4 },
      dataLabels: { enabled: false },
    };
  }

  setPaymentsChart(data: any) {
    this.paymentsChart = {
      chart: { type: 'pie', height: 260 },
      series: data.data,
      labels: data.labels,
      colors: ['#3b82f6', '#06b6d4', '#10b981'],
      legend: { position: 'bottom' },
    };
  }

  setOrdersChart(data: any) {
    this.ordersChart = {
      chart: { type: 'donut', height: 260 },
      series: data.data,
      labels: data.labels,
      colors: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#a855f7', '#6366f1', '#22c55e', '#ef4444'],
      legend: { position: 'bottom' },
    };
  }

  setSalesChart(data: any) {
    this.salesChart = {
      chart: { type: 'bar', height: 260, toolbar: { show: false } },
      series: [{ name: 'Ventas (%)', data: data.data }],
      xaxis: { categories: data.labels },
      plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
      colors: ['#3b82f6'],
      dataLabels: { enabled: false },
    };
  }

  private loadBranches() {
    this.loadingBranches.set(true);
    this.branchesSvc.list().subscribe({
      next: branches => {
        const realBranches = branches.map((b: any) => ({
          id: b.id,
          nombre: b.nombre,
          activa: b.activa ?? true
        }));
        this.branches.set([{
          id: 'all', nombre: 'Todas las sucursales',
          activa: false
        }, ...realBranches]);
        this.loadingBranches.set(false);
      },
      error: err => {
        console.error('Error loading branches', err);
        this.loadingBranches.set(false);
      }
    });
  }
}
