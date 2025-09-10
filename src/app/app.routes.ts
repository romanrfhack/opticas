import { Routes } from '@angular/router';
import { ShellComponent } from './components/shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.page').then(m => m.DashboardPage) },
      { path: 'inventario', loadComponent: () => import('./features/inventario/inventario.page').then(m => m.InventarioPage) },
      { path: 'clientes', loadComponent: () => import('./features/clientes/clientes.page').then(m => m.ClientesPage) },
      { path: 'historias', loadComponent: () => import('./features/historias/historias.page').then(m => m.HistoriasPage) },
      { path: 'ordenes', loadComponent: () => import('./features/ordenes/ordenes.page').then(m => m.OrdenesPage) },
      { path: '**', loadComponent: () => import('./features/not-found/not-found.page').then(m => m.NotFoundPage) },
    ]
  }
];
