import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [],
  template: `
    <section class="space-y-4">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Dashboard</h1>
      </header>

      <div class="card p-6">
        <p class="text-gray-600">
          Resumen de KPIs, ventas del día, órdenes en curso.
        </p>
        <p class="mt-2 text-sm text-gray-500">
          Empieza aquí la funcionalidad de <strong>Dashboard</strong>.
        </p>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {}
