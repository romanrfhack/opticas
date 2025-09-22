import { Routes } from '@angular/router';
import { ShellComponent } from './components/shell/shell.component';
import { roleGuard } from './auth/role.guard';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  // 1) al entrar a '/', manda a /login
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  // 2) login fuera del shell
  { path: 'login', loadComponent: () => import('./auth/login.page').then(m => m.LoginPage) },

  // 3) app privada dentro del shell
  {
    path: '',
    component: ShellComponent,
    children: [
      // dentro del shell, si navegan a '', manda a dashboard
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'admin/usuarios', canMatch: [roleGuard(['Admin'])],
        loadComponent: () => import('./admin/users/users.page').then(m => m.UsersPage) },
      { path: 'perfil', canActivate: [authGuard],
        loadComponent: () => import('./account/profile.page').then(m => m.ProfilePage) },
      { path: 'dashboard', canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/dashboard.page').then(m => m.DashboardPage) },
      { path: 'inventario', canActivate: [authGuard],
        loadComponent: () => import('./features/inventario/inventario.page').then(m => m.InventarioPage) },
      { path: 'clientes', canActivate: [authGuard],
        loadComponent: () => import('./features/clientes/clientes.page').then(m => m.ClientesPage) },
      { path: 'clinica/historia', canActivate: [authGuard],
        loadComponent: () => import('./clinica/historia-form.component').then(m => m.HistoriaFormComponent) },
      { path: 'clinica/laboratorio', canActivate: [authGuard],
        loadComponent: () => import('./clinica/lab-bandeja.component').then(m => m.LabBandejaComponent) },
      { path: 'historias', canActivate: [authGuard],
        loadComponent: () => import('./features/historias/historias.page').then(m => m.HistoriasPage) },
      { path: 'ordenes', canActivate: [authGuard],
        loadComponent: () => import('./features/ordenes/ordenes.page').then(m => m.OrdenesPage) },
      { path: '**', loadComponent: () => import('./features/not-found/not-found.page').then(m => m.NotFoundPage) },
    ]
  }
];
