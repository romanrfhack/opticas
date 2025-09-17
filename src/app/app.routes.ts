import { Routes } from '@angular/router';
import { ShellComponent } from './components/shell/shell.component';
import { roleGuard } from './auth/role.guard';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
       { path: 'login', loadComponent: () => import('./auth/login.page').then(m => m.LoginPage) },       
       { path: 'admin/usuarios', canMatch: [roleGuard(['Admin'])], loadComponent: () => import('./admin/users/users.page').then(m => m.UsersPage) },
       { path: 'perfil', canActivate: [authGuard], loadComponent: () => import('./account/profile.page').then(m => m.ProfilePage) },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.page').then(m => m.DashboardPage) },
      { path: 'inventario', loadComponent: () => import('./features/inventario/inventario.page').then(m => m.InventarioPage) },
      { path: 'clientes', loadComponent: () => import('./features/clientes/clientes.page').then(m => m.ClientesPage) },
      { path: 'historias', loadComponent: () => import('./features/historias/historias.page').then(m => m.HistoriasPage) },
      { path: 'ordenes', loadComponent: () => import('./features/ordenes/ordenes.page').then(m => m.OrdenesPage) },
      { path: '**', loadComponent: () => import('./features/not-found/not-found.page').then(m => m.NotFoundPage) },
    ]
  }
];
