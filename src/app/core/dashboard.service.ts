// services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardKpis {
  patientsAttended: KpiData;
  newPatients: KpiData;
  ordersPaid: KpiData;
  totalIncome: KpiData;
  sentToLab: KpiData;
  deliveredToCustomers: KpiData;
}

export interface KpiData {
  value: number;
  change: number;
}

export interface PatientAttendance {
  labels: string[];
  totalPatients: number[];
  newPatients: number[];
}

export interface PaymentMethods {
  labels: string[];
  data: number[];
  amounts: number[];
}

export interface OrderStatus {
  labels: string[];
  data: number[];
}

export interface SalesByCategory {
  labels: string[];
  data: number[];
  amounts: number[];
}

export interface MonthlyRevenue {
  labels: string[];
  currentYear: number[];
  previousYear: number[];
}

export interface DashboardFilters {
  period: string;
  startDate?: Date;
  endDate?: Date;
  branchId: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  
  private base = environment.apiBaseUrl;  
  private apiUrl = this.base + '/Dashboard';

  constructor(private http: HttpClient) {}

  getKpis(filters: DashboardFilters): Observable<DashboardKpis> {
    const params = this.buildParams(filters);
    return this.http.get<DashboardKpis>(`${this.apiUrl}/kpis`, { params });
  }

  getPatientAttendance(filters: DashboardFilters): Observable<PatientAttendance> {
    const params = this.buildParams(filters);
    return this.http.get<PatientAttendance>(`${this.apiUrl}/patient-attendance`, { params });
  }

  getPaymentMethods(filters: DashboardFilters): Observable<PaymentMethods> {
    const params = this.buildParams(filters);
    return this.http.get<PaymentMethods>(`${this.apiUrl}/payment-methods`, { params });
  }

  getOrderStatus(filters: DashboardFilters): Observable<OrderStatus> {
    const params = this.buildParams(filters);
    return this.http.get<OrderStatus>(`${this.apiUrl}/order-status`, { params });
  }

  getSalesByCategory(filters: DashboardFilters): Observable<SalesByCategory> {
    const params = this.buildParams(filters);
    return this.http.get<SalesByCategory>(`${this.apiUrl}/sales-by-category`, { params });
  }

  getMonthlyRevenue(filters: DashboardFilters): Observable<MonthlyRevenue> {
    const params = this.buildParams(filters);
    return this.http.get<MonthlyRevenue>(`${this.apiUrl}/monthly-revenue`, { params });
  }

  private buildParams(filters: DashboardFilters): HttpParams {
    let params = new HttpParams()
      .set('period', filters.period)
      .set('branchId', filters.branchId);

    if (filters.startDate) {
      params = params.set('startDate', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      params = params.set('endDate', filters.endDate.toISOString());
    }

    return params;
  }
}