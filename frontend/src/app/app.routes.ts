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
    path: 'reservar',
    loadComponent: () => import('./pages/reservar/reservar.page').then(m => m.ReservarPage),
    canActivate: [authGuard]
  },
  {
    path: 'catalogo-productos',
    loadComponent: () => import('./pages/catalogo-productos/catalogo-productos.page').then(m => m.CatalogoProductosPage),
    canActivate: [authGuard]
  },
  {
    path: 'carrito',
    loadComponent: () => import('./pages/carrito/carrito.page').then(m => m.CarritoPage),
    canActivate: [authGuard]
  },
  {
    path: 'confirmacion-compra',
    loadComponent: () => import('./pages/confirmacion-compra/confirmacion-compra.page').then(m => m.ConfirmacionCompraPage),
    canActivate: [authGuard]
  },
  {
    path: 'mis-compras',
    loadComponent: () => import('./pages/mis-compras/mis-compras.page').then(m => m.MisComprasPage),
    canActivate: [authGuard]
  },
  {
    path: 'mis-clientes',
    loadComponent: () => import('./pages/mis-clientes/mis-clientes.page').then(m => m.MisClientesPage),
    canActivate: [authGuard]
  },
  {
    path: 'admin-trabajadores',
    loadComponent: () => import('./pages/admin-trabajadores/admin-trabajadores.page').then(m => m.AdminTrabajadoresPage),
    canActivate: [authGuard]
  },
  {
    path: 'configuracion-completa',
    loadComponent: () => import('./pages/configuracion-completa/configuracion-completa.page').then(m => m.ConfiguracionCompletaPage),
    canActivate: [authGuard]
  },
  {
    // ✅ CORREGIDO: Ruta para admin/clientes con la página correcta
    path: 'admin/clientes',
    loadComponent: () => import('./pages/admin-clientes/admin-clientes.page').then(m => m.AdminClientesPage),
    canActivate: [authGuard]
  },
  {
    // ✅ NUEVA RUTA: Mi Perfil
    path: 'mi-perfil',
    loadComponent: () => import('./pages/mi-perfil/mi-perfil.page').then(m => m.MiPerfilPage),
    canActivate: [authGuard]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];