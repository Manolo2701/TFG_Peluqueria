// frontend/src/app/pages/dashboard/dashboard.page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Services
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';

// Interfaces
import { DashboardStats, ProximaReserva, ServicioPopular } from '../../interfaces/dashboard.interface';
import { Subscription } from 'rxjs';

// Componentes de diálogo
import { ReservaRapidaDialogComponent } from '../../components/reserva-rapida-dialog/reserva-rapida-dialog.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    // Angular Common
    CommonModule,
    RouterModule,

    // Angular Material Modules
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatGridListModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage implements OnInit, OnDestroy {
  stats: DashboardStats = this.createEmptyStats();
  statsTrabajador: DashboardStats = this.createEmptyStats();
  loading = true;
  error: string | null = null;
  usuario: any = null;
  vistaTrabajadorActiva = false;

  // Datos para acciones rápidas
  serviciosDisponibles: any[] = [];
  trabajadoresDisponibles: any[] = [];

  private subs: Subscription[] = [];

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    const userSub = this.authService.usuarioActual$.subscribe(usuario => {
      this.usuario = usuario;

      // ✅ CORRECCIÓN: Cargar datos según el rol real
      if (usuario?.rol === 'trabajador') {
        console.log('🔄 Cargando dashboard para trabajador normal');
        this.loadDashboardDataTrabajador();
      } else if (usuario?.rol === 'administrador') {
        console.log('🔄 Cargando dashboard para administrador');
        this.loadDashboardData();
      } else {
        console.log('🔄 Cargando dashboard para cliente');
        this.loadDashboardData();
      }

      this.cargarDatosEspecificosRol();
    });
    this.subs.push(userSub);
  }

  loadDashboardData() {
    this.loading = true;
    this.error = null;

    const dashboardSub = this.dashboardService.getEstadisticas().subscribe({
      next: (data) => {
        console.log('📊 DATOS RECIBIDOS DEL BACKEND:', data);
        this.stats = this.ensureSafeStats(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ ERROR cargando dashboard:', err);
        this.error = err.message || 'Error al cargar el dashboard';
        this.loading = false;
        this.mostrarError(err.message);
      }
    });

    this.subs.push(dashboardSub);
  }

  loadDashboardDataTrabajador() {
    this.loading = true;
    this.error = null;

    console.log('🔄 [COMPONENTE] Cargando dashboard para trabajador...');

    const dashboardSub = this.dashboardService.getEstadisticasTrabajador().subscribe({
      next: (data) => {
        console.log('✅ [COMPONENTE] Datos recibidos para trabajador:', data);
        this.statsTrabajador = this.ensureSafeStats(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ [COMPONENTE] ERROR cargando vista trabajador:', err);
        this.error = err.message || 'Error al cargar la vista de trabajador';
        this.loading = false;
        this.mostrarError(err.message);
      }
    });

    this.subs.push(dashboardSub);
  }

  cargarDatosEspecificosRol() {
    // Cargar servicios disponibles para todos los roles
    this.dashboardService.obtenerServiciosDisponibles().subscribe({
      next: (data) => {
        this.serviciosDisponibles = data.servicios || [];
        console.log('✅ Servicios cargados:', this.serviciosDisponibles.length);
      },
      error: (err) => {
        console.error('❌ Error cargando servicios:', err);
      }
    });

    // Si es administrador o trabajador, cargar trabajadores
    if (this.isAdministrador || this.isTrabajador) {
      this.dashboardService.obtenerTrabajadoresDisponibles().subscribe({
        next: (data) => {
          this.trabajadoresDisponibles = data || [];
          console.log('✅ Trabajadores cargados:', this.trabajadoresDisponibles.length);
        },
        error: (err) => {
          console.error('❌ Error cargando trabajadores:', err);
        }
      });
    }
  }

  // ====================
  // ACCIONES RÁPIDAS
  // ====================

  // Para Administrador
  abrirCalendarioGeneral() {
    this.router.navigate(['/calendario']);
  }

  gestionarTrabajadores() {
    this.router.navigate(['/trabajadores']);
  }

  verReportes() {
    this.router.navigate(['/reportes']);
  }

  abrirConfiguracion() {
    this.router.navigate(['/configuracion']);
  }

  // Para Trabajador
  abrirMiCalendario() {
    this.router.navigate(['/mi-calendario']);
  }

  verMisClientes() {
    this.router.navigate(['/mis-clientes']);
  }

  gestionarServicios() {
    this.router.navigate(['/servicios']);
  }

  // Para Cliente
  nuevaReservaRapida() {
    const dialogRef = this.dialog.open(ReservaRapidaDialogComponent, {
      width: '600px',
      data: {
        servicios: this.serviciosDisponibles,
        trabajadores: this.trabajadoresDisponibles
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('📅 Reserva rápida creada:', result);
        this.mostrarExito('Reserva creada exitosamente');
        // Recargar datos del dashboard
        this.loadDashboardData();
      }
    });
  }

  verMisReservas() {
    this.router.navigate(['/mis-reservas']);
  }

  explorarServicios() {
    this.router.navigate(['/servicios']);
  }

  // Acción común para todos los roles
  cambiarVistaTrabajador() {
    if (this.vistaTrabajadorActiva) {
      // Volver a vista admin
      this.vistaTrabajadorActiva = false;
      console.log('🔄 Cambiando a vista Administrador');
    } else {
      // Activar vista trabajador
      this.vistaTrabajadorActiva = true;
      console.log('🔄 Cambiando a vista Trabajador');
      // Cargar datos específicos de trabajador si no están cargados
      if (!this.statsTrabajador) {
        this.loadDashboardDataTrabajador();
      }
    }
  }

  // Método para cerrar sesión
  logout() {
    this.authService.logout();
    // Redirigir al login
    this.router.navigate(['/login']);
  }

  // ====================
  // HELPERS Y UTILIDADES
  // ====================

  mostrarExito(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['snackbar-success']
    });
  }

  mostrarError(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['snackbar-error']
    });
  }

  // ✅ NUEVO MÉTODO: Crear estadísticas vacías
  private createEmptyStats(): DashboardStats {
    return {
      rol: 'cliente',
      misReservasHoy: 0,
      totalReservas: 0,
      reservasConfirmadas: 0,
      reservasPendientes: 0,
      proximasReservas: [],
      serviciosPopulares: [],
      totalReservasHoy: 0,
      ingresosHoy: 0,
      totalVentasHoy: 0
    };
  }

  // ✅ MÉTODO MEJORADO: Asegurar que los datos del dashboard sean seguros
  private ensureSafeStats(data: any): DashboardStats {
    if (!data) {
      return this.createEmptyStats();
    }

    return {
      rol: data.rol || 'cliente',
      misReservasHoy: data.misReservasHoy || 0,
      totalReservas: data.totalReservas || 0,
      reservasConfirmadas: data.reservasConfirmadas || 0,
      reservasPendientes: data.reservasPendientes || 0,
      proximasReservas: data.proximasReservas || [],
      serviciosPopulares: data.serviciosPopulares || [],
      totalReservasHoy: data.totalReservasHoy || 0,
      ingresosHoy: data.ingresosHoy || 0,
      totalVentasHoy: data.totalVentasHoy || 0
    };
  }

  // ====================
  // GETTERS
  // ====================

  get isCliente(): boolean {
    return this.usuario?.rol === 'cliente';
  }

  get isTrabajador(): boolean {
    return this.usuario?.rol === 'trabajador';
  }

  get isAdministrador(): boolean {
    return this.usuario?.rol === 'administrador';
  }

  get vistaActualEsTrabajador(): boolean {
    return this.isTrabajador || (this.isAdministrador && this.vistaTrabajadorActiva);
  }

  get vistaActualEsAdministrador(): boolean {
    return this.isAdministrador && !this.vistaTrabajadorActiva;
  }

  get statsParaMostrar(): DashboardStats {
    console.log('🔍 [DEBUG] Determinando stats para mostrar:', {
      isTrabajador: this.isTrabajador,
      statsTrabajador: !!this.statsTrabajador,
      vistaTrabajadorActiva: this.vistaTrabajadorActiva,
      stats: !!this.stats
    });

    // ✅ CORRECCIÓN: Si es trabajador normal, usar statsTrabajador SIEMPRE
    if (this.usuario?.rol === 'trabajador') {
      console.log('🎯 Usando stats de trabajador (rol trabajador)');
      return this.statsTrabajador;
    }

    // ✅ Si admin está en vista trabajador
    if (this.vistaTrabajadorActiva) {
      console.log('🎯 Usando stats de trabajador (vista activa)');
      return this.statsTrabajador;
    }

    // Por defecto, stats normales
    console.log('🎯 Usando stats normales');
    return this.stats;
  }

  irAReservar() {
    // Redirigir directamente a reservar sin servicio específico
    // O mostrar un diálogo para seleccionar servicio rápido
    this.router.navigate(['/reservar']);
  }

  // ✅ CORREGIDO: Aceptar number | undefined
  formatCurrency(amount: number | undefined): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Fecha no disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  formatTime(timeString: string): string {
    if (!timeString) return 'Hora no disponible';
    return timeString.substring(0, 5);
  }

  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe());
  }
}