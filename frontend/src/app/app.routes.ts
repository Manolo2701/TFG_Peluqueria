import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [authGuard]
  },
  {
    path: 'calendario',
    loadComponent: () => import('./pages/calendario/calendario.page').then(m => m.CalendarioPage),
    canActivate: [authGuard]
  },
  {
    path: 'admin/ausencias',
    loadComponent: () => import('./pages/gestion-ausencias/gestion-ausencias.page').then(m => m.GestionAusenciasPage),
    canActivate: [authGuard]
  },
  {
    path: 'mi-calendario',
    loadComponent: () => import('./pages/mi-calendario/mi-calendario.page').then(m => m.MiCalendarioPage),
    canActivate: [authGuard]
  },
  {
    path: 'mis-reservas',
    loadComponent: () => import('./pages/mis-reservas/mis-reservas.page').then(m => m.MisReservasPage),
    canActivate: [authGuard]
  },
  {
    path: 'servicios',
    loadComponent: () => import('./pages/servicios/servicios.page').then(m => m.ServiciosPage),
    canActivate: [authGuard]
  },
  {
    path: 'reservar',
    loadComponent: () => import('./pages/reservar/reservar.page').then(m => m.ReservarPage),
    canActivate: [authGuard]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];