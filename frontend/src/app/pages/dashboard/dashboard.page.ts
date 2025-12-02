import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

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

  // ✅ MODIFICADO: Cargar estado desde localStorage
  vistaTrabajadorActiva = localStorage.getItem('dashboard_vista_trabajador') === 'true';

  // Datos para acciones rápidas
  serviciosDisponibles: any[] = [];
  trabajadoresDisponibles: any[] = [];

  private subs: Subscription[] = [];

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // ✅ Verificar parámetros de URL para mensajes de pago
    this.verificarEstadoPago();

    const userSub = this.authService.usuarioActual$.subscribe(usuario => {
      this.usuario = usuario;

      // ✅ Cargar datos según el rol real Y el estado guardado
      if (usuario?.rol === 'trabajador') {
        console.log('🔄 Cargando dashboard para trabajador normal');
        this.loadDashboardDataTrabajador();
        // ✅ Forzar vista trabajador para usuarios con rol trabajador
        this.vistaTrabajadorActiva = true;
        this.guardarEstadoVista();
      } else if (usuario?.rol === 'administrador') {
        console.log('🔄 Cargando dashboard para administrador');

        // ✅ Cargar AMBOS conjuntos de datos para evitar recargas
        this.loadBothDatasets();
      } else {
        console.log('🔄 Cargando dashboard para cliente');
        this.loadDashboardData();
      }

      this.cargarDatosEspecificosRol();
    });
    this.subs.push(userSub);
  }

  // ✅ NUEVO: Método para cargar ambos conjuntos de datos sin bloqueo
  private loadBothDatasets() {
    this.loading = true;
    this.error = null;

    // Cargar datos de administrador
    const adminSub = this.dashboardService.getEstadisticas().subscribe({
      next: (data) => {
        console.log('📊 DATOS ADMIN RECIBIDOS:', data);
        this.stats = this.ensureSafeStats(data);
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('❌ ERROR cargando datos admin:', err);
        this.stats = this.createEmptyStats();
        this.checkLoadingComplete();
      }
    });

    // Cargar datos de trabajador (solo si es admin)
    const trabajadorSub = this.dashboardService.getEstadisticasTrabajador().subscribe({
      next: (data) => {
        console.log('📊 DATOS TRABAJADOR RECIBIDOS:', data);
        this.statsTrabajador = this.ensureSafeStats(data);
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('❌ ERROR cargando datos trabajador:', err);
        // No es crítico si falla la carga de datos de trabajador
        this.statsTrabajador = this.createEmptyStats();
        this.checkLoadingComplete();
      }
    });

    this.subs.push(adminSub, trabajadorSub);
  }

  // ✅ NUEVO: Verificar si ambas cargas han terminado
  private checkLoadingComplete() {
    // Asumimos que ambas peticiones han terminado cuando tenemos datos o errores en ambos
    if (this.stats && this.statsTrabajador) {
      this.loading = false;
      this.cdRef.detectChanges();
    }
  }

  // ✅ NUEVO: Método para guardar el estado de la vista
  private guardarEstadoVista() {
    localStorage.setItem('dashboard_vista_trabajador', this.vistaTrabajadorActiva.toString());
    console.log('💾 Estado de vista guardado:', this.vistaTrabajadorActiva ? 'Trabajador' : 'Admin');
  }

  // ✅ Verificar estado de pago desde parámetros de URL
  private verificarEstadoPago() {
    this.route.queryParams.subscribe(params => {
      const pagoEstado = params['pago'];
      const ordenId = params['orden'];

      console.log('🔍 Parámetros de URL recibidos:', { pagoEstado, ordenId });

      if (pagoEstado === 'exitoso') {
        const mensaje = ordenId
          ? `¡Compra realizada exitosamente! Número de orden: ${ordenId}`
          : '¡Compra realizada exitosamente!';

        this.mostrarExito(mensaje);

        // Limpiar la URL eliminando los parámetros
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      } else if (pagoEstado === 'cancelado') {
        this.mostrarError('El pago fue cancelado. Puedes intentarlo nuevamente.');

        // Limpiar la URL
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      } else if (pagoEstado === 'error') {
        this.mostrarError('Ocurrió un error al procesar el pago. Por favor, intenta nuevamente.');

        // Limpiar la URL
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });
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

  // ✅ MEJORADO: Carga de datos de trabajador con manejo de errores
  loadDashboardDataTrabajador() {
    this.loading = true;
    this.error = null;

    console.log('🔄 [COMPONENTE] Cargando dashboard para trabajador...');

    const dashboardSub = this.dashboardService.getEstadisticasTrabajador().subscribe({
      next: (data) => {
        console.log('✅ [COMPONENTE] Datos recibidos para trabajador:', data);
        this.statsTrabajador = this.ensureSafeStats(data);
        this.loading = false;

        // ✅ FORZAR ACTUALIZACIÓN DE LA VISTA
        setTimeout(() => {
          this.cdRef.detectChanges();
        }, 0);
      },
      error: (err) => {
        console.error('❌ [COMPONENTE] ERROR cargando vista trabajador:', err);

        // ✅ MEJORADO: Manejo específico de errores
        if (err.message.includes('No se encontró perfil de trabajador')) {
          this.error = 'No tienes un perfil de trabajador configurado.';
          this.mostrarError('Para usar la vista de trabajador, necesitas tener un perfil de trabajador configurado.');
          this.vistaTrabajadorActiva = false; // Volver a vista admin
          this.guardarEstadoVista(); // ✅ Guardar el cambio
        } else {
          this.error = err.message || 'Error al cargar la vista de trabajador';
          this.mostrarError(err.message);
        }

        this.loading = false;
        this.cdRef.detectChanges();
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
    this.router.navigate(['/admin-trabajadores']);
  }

  // ✅ NUEVA ACCIÓN: Ver todos los clientes registrados
  verClientesRegistrados() {
    this.router.navigate(['/admin/clientes']);
  }

  abrirConfiguracionCompleta() {
    this.router.navigate(['/configuracion-completa']);
  }

  gestionarAusencias() {
    this.router.navigate(['/admin/ausencias']);
  }

  // Para Trabajador
  abrirMiCalendario() {
    this.router.navigate(['/mi-calendario']);
  }

  verMisClientes() {
    this.router.navigate(['/mis-clientes']);
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
        this.recargarDashboard();
      }
    });
  }

  verMisReservas() {
    this.router.navigate(['/mis-reservas']);
  }

  explorarServicios() {
    this.router.navigate(['/servicios']);
  }

  explorarProductos() {
    this.router.navigate(['/catalogo-productos']);
  }

  // ✅ CORREGIDO: Cambiar vista SIN recargar datos
  cambiarVistaTrabajador() {
    // Agregar clase para transición suave
    const dashboardContent = document.querySelector('.dashboard-content');
    if (dashboardContent) {
      dashboardContent.classList.add('smooth-transition');
    }

    // ✅ SIMPLEMENTE CAMBIAR LA VISTA sin recargar datos
    this.vistaTrabajadorActiva = !this.vistaTrabajadorActiva;
    console.log('🔄 Cambiando a vista:', this.vistaTrabajadorActiva ? 'Trabajador' : 'Admin');

    // ✅ GUARDAR ESTADO en localStorage
    this.guardarEstadoVista();

    // Remover clase después de la animación
    setTimeout(() => {
      if (dashboardContent) {
        dashboardContent.classList.remove('smooth-transition');
      }
    }, 300);
  }

  // ✅ NUEVO: Método para recargar manualmente
  recargarDashboard() {
    if (this.isAdministrador) {
      // Para administradores, recargar ambos conjuntos de datos
      this.loadBothDatasets();
    } else if (this.isTrabajador) {
      this.loadDashboardDataTrabajador();
    } else {
      this.loadDashboardData();
    }
  }

  // Método para cerrar sesión
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // ====================
  // HELPERS Y UTILIDADES
  // ====================

  mostrarExito(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['snackbar-success']
    });
  }

  mostrarError(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['snackbar-error']
    });
  }

  // ✅ Crear estadísticas vacías
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

  // ✅ Asegurar que los datos del dashboard sean seguros
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

  // ✅ CORREGIDO: Getter para stats que muestra correctamente el rol
  get statsParaMostrar(): DashboardStats {
    // ✅ CORRECCIÓN: Si es trabajador normal, usar statsTrabajador SIEMPRE
    if (this.isTrabajador) {
      return this.statsTrabajador || this.createEmptyStats();
    }

    // ✅ Si admin está en vista trabajador
    if (this.vistaTrabajadorActiva) {
      return this.statsTrabajador || this.createEmptyStats();
    }

    // Por defecto, stats normales
    return this.stats || this.createEmptyStats();
  }

  irAReservar() {
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

  formatNumber(number: number | undefined): string {
    return (number || 0).toString();
  }

  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe());
  }
}