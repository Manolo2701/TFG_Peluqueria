import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';

import { ReservaService, Reserva } from '../../core/services/reserva.service';
import { CalendarioService } from '../../core/services/calendario.service';
import { Ausencia } from '../../interfaces/calendario.interface';
import { ReservaDetallesModalComponent } from '../../components/reserva-detalles-modal/reserva-detalles-modal.component';
import { ConfirmacionAccionReservaComponent } from '../../components/confirmacion-accion-reserva/confirmacion-accion-reserva.component';
import { Observable } from 'rxjs';

import { SolicitarAusenciaModalComponent } from '../../components/solicitar-ausencia-modal/solicitar-ausencia-modal.component';

interface ReservaCalendario extends Reserva {
    cliente_nombre?: string;
    cliente_apellidos?: string;
    servicio_nombre?: string;
    trabajador_nombre?: string;
    trabajador_apellidos?: string;
    duracion: number;
    precio?: number;
    motivo_cancelacion?: string;
}

@Component({
    selector: 'app-mi-calendario',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        MatProgressSpinnerModule,
        MatTabsModule,
        MatChipsModule
    ],
    templateUrl: './mi-calendario.page.html',
    styleUrls: ['./mi-calendario.page.scss']
})
export class MiCalendarioPage implements OnInit {
    // Datos de reservas
    reservas: ReservaCalendario[] = [];
    reservasFiltradas: ReservaCalendario[] = [];

    // Datos de ausencias
    ausencias: Ausencia[] = [];

    // UI State
    fechaSeleccionada: Date = new Date();
    mostrandoTodasLasReservas: boolean = false;
    loading = true;
    error: string | null = null;
    activeTab: number = 0; // 0: Reservas, 1: Ausencias

    // Filtros de estado
    filtroEstado: string = 'todas'; // 'todas', 'pendientes', 'confirmadas', 'completadas', 'canceladas', 'rechazadas'

    displayedColumns: string[] = ['hora', 'cliente', 'servicio', 'estado', 'acciones'];

    constructor(
        private reservaService: ReservaService,
        private calendarioService: CalendarioService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit() {
        this.verificarAutenticacion();
    }

    verificarAutenticacion() {
        const token = localStorage.getItem('token');
        const usuarioStr = localStorage.getItem('usuario');
        const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;

        if (!token) {
            this.error = 'No estás autenticado. Por favor inicia sesión primero.';
            this.loading = false;
            return;
        }

        if (usuario && usuario.rol !== 'trabajador' && usuario.rol !== 'administrador') {
            this.error = 'Solo los trabajadores pueden acceder a esta vista. Tu rol: ' + usuario.rol;
            this.loading = false;
            return;
        }

        this.cargarDatos();
    }

    cargarDatos() {
        this.loading = true;
        this.error = null;

        // Cargar reservas y ausencias en paralelo
        Promise.all([
            this.cargarReservas(),
            this.cargarAusencias()
        ]).finally(() => {
            this.loading = false;
        });
    }

    cargarReservas(): Promise<void> {
        return new Promise((resolve) => {
            this.reservaService.getReservasTrabajador().subscribe({
                next: (reservas: ReservaCalendario[]) => {
                    console.log('✅ Mis reservas cargadas:', reservas);
                    this.reservas = Array.isArray(reservas) ? reservas : [];
                    this.filtrarReservas();
                    resolve();
                },
                error: (err) => {
                    console.error('❌ Error al cargar mis reservas:', err);
                    this.error = 'Error al cargar tus reservas.';
                    this.reservas = [];
                    this.reservasFiltradas = [];
                    resolve();
                }
            });
        });
    }

    cargarAusencias() {
        const usuarioStr = localStorage.getItem('usuario');
        const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;

        console.log('🔍 Verificando rol para cargar ausencias:', usuario?.rol);

        // Solo cargar ausencias si el usuario es trabajador o admin-trabajador
        if (usuario && (usuario.rol === 'trabajador' || usuario.rol === 'administrador')) {
            console.log('🔄 Cargando ausencias para trabajador/admin...');
            this.calendarioService.getMisAusencias().subscribe({
                next: (response) => {
                    console.log('✅ Ausencias cargadas:', response.ausencias);
                    this.ausencias = response.ausencias || [];
                },
                error: (error) => {
                    console.error('❌ Error al cargar ausencias:', error);
                    // Si es error 403, probablemente el admin no es trabajador
                    if (error.status === 403) {
                        console.log('ℹ️ Admin no registrado como trabajador, omitiendo ausencias');
                    }
                    this.ausencias = [];
                }
            });
        } else {
            console.log('ℹ️ Usuario no es trabajador, omitiendo carga de ausencias');
            this.ausencias = [];
        }
    }

    filtrarReservas() {
        if (!this.reservas || !Array.isArray(this.reservas)) {
            this.reservasFiltradas = [];
            return;
        }

        let reservasFiltradas = [...this.reservas];

        // Aplicar filtro por estado
        switch (this.filtroEstado) {
            case 'pendientes':
                reservasFiltradas = reservasFiltradas.filter(reserva => reserva.estado === 'pendiente');
                break;
            case 'confirmadas':
                reservasFiltradas = reservasFiltradas.filter(reserva => reserva.estado === 'confirmada');
                break;
            case 'completadas':
                reservasFiltradas = reservasFiltradas.filter(reserva => reserva.estado === 'completada');
                break;
            case 'canceladas':
                reservasFiltradas = reservasFiltradas.filter(reserva => reserva.estado === 'cancelada');
                break;
            case 'rechazadas':
                reservasFiltradas = reservasFiltradas.filter(reserva => reserva.estado === 'rechazada');
                break;
            case 'todas':
            default:
                // No filtrar por estado - mostrar todas
                break;
        }

        // SIEMPRE filtrar por fecha a menos que esté en modo "ver todas"
        if (!this.mostrandoTodasLasReservas && this.fechaSeleccionada) {
            const fechaStr = this.formatDateToLocal(this.fechaSeleccionada);
            reservasFiltradas = reservasFiltradas.filter(
                reserva => reserva.fecha_reserva === fechaStr
            );
        }

        this.reservasFiltradas = reservasFiltradas;
        console.log(`📊 Filtradas ${this.reservasFiltradas.length} reservas (estado: ${this.filtroEstado})`);
    }

    // Cambiar filtro de estado
    onFiltroEstadoChange(filtro: string) {
        this.filtroEstado = filtro;
        this.filtrarReservas();
    }

    // ACCIONES DE RESERVAS
    verDetalles(reserva: ReservaCalendario) {
        console.log('🔍 Ver detalles desde Mi Calendario:', reserva);

        const usuarioStr = localStorage.getItem('usuario');
        const usuarioActual = usuarioStr ? JSON.parse(usuarioStr) : null;

        const dialogRef = this.dialog.open(ReservaDetallesModalComponent, {
            width: '600px',
            maxWidth: '90vw',
            data: {
                reserva,
                usuarioActual,
                esVistaTrabajador: true,
                contexto: 'mi-agenda'
            },
            panelClass: 'reserva-detalles-modal'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.accion) {
                this.procesarAccionReserva(result.accion, result.reserva);
            }
        });
    }

    aceptarReserva(reserva: ReservaCalendario) {
        const dialogRef = this.dialog.open(ConfirmacionAccionReservaComponent, {
            width: '550px',
            data: {
                tipo: 'aceptar',
                reserva: reserva,
                titulo: 'Confirmar Aceptación de Reserva',
                mensaje: '¿Estás seguro de que quieres ACEPTAR esta reserva? Esta acción confirmará que realizarás el servicio.',
                requiereMotivo: false
            }
        });

        dialogRef.afterClosed().subscribe(resultado => {
            if (resultado?.confirmado) {
                this.ejecutarAceptarReserva(reserva.id);
            }
        });
    }

    rechazarReserva(reserva: ReservaCalendario) {
        const dialogRef = this.dialog.open(ConfirmacionAccionReservaComponent, {
            width: '550px',
            data: {
                tipo: 'rechazar',
                reserva: reserva,
                titulo: 'Confirmar Rechazo de Reserva',
                mensaje: '¿Estás seguro de que quieres RECHAZAR esta reserva? Esta acción notificará al cliente y liberará el horario.',
                requiereMotivo: true
            }
        });

        dialogRef.afterClosed().subscribe(resultado => {
            if (resultado?.confirmado) {
                this.ejecutarRechazarReserva(reserva.id, resultado.motivo);
            }
        });
    }

    private ejecutarAceptarReserva(reservaId: number) {
        this.reservaService.aceptarReserva(reservaId).subscribe({
            next: () => {
                this.mostrarExito('✅ Reserva aceptada exitosamente');
                this.cargarReservas();
            },
            error: (err) => {
                console.error('❌ Error al aceptar reserva:', err);
                const errorMsg = this.obtenerMensajeError(err);
                this.mostrarError(`Error al aceptar la reserva: ${errorMsg}`);
            }
        });
    }

    private ejecutarRechazarReserva(reservaId: number, motivo: string) {
        this.reservaService.rechazarReserva(reservaId, motivo).subscribe({
            next: () => {
                this.mostrarExito('✅ Reserva rechazada exitosamente');
                this.cargarReservas();
            },
            error: (err) => {
                console.error('❌ Error al rechazar reserva:', err);
                const errorMsg = this.obtenerMensajeError(err);
                this.mostrarError(`Error al rechazar la reserva: ${errorMsg}`);
            }
        });
    }

    // Método para obtener mensajes de error más legibles
    private obtenerMensajeError(err: any): string {
        if (err.error?.error) {
            return err.error.error;
        }
        if (err.status === 400) {
            return 'Solicitud incorrecta. Verifica los datos.';
        }
        if (err.status === 403) {
            return 'No tienes permisos para esta acción.';
        }
        if (err.status === 404) {
            return 'Reserva no encontrada.';
        }
        return 'Error del servidor. Intenta nuevamente.';
    }

    procesarAccionReserva(accion: string, reserva: any) {
        switch (accion) {
            case 'aceptada':
                this.aceptarReserva(reserva);
                break;
            case 'cancelada':
                this.rechazarReserva(reserva);
                break;
            default:
                console.log('Acción no manejada:', accion);
        }
    }

    // ACCIONES DE AUSENCIAS
    solicitarAusencia() {
        const dialogRef = this.dialog.open(SolicitarAusenciaModalComponent, {
            width: '500px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.calendarioService.solicitarAusencia(result).subscribe({
                    next: (response) => {
                        this.mostrarExito('Ausencia solicitada correctamente');
                        this.cargarAusencias();
                    },
                    error: (error) => {
                        console.error('Error al solicitar ausencia:', error);
                        this.mostrarError('Error al solicitar la ausencia');
                    }
                });
            }
        });
    }

    // MÉTODOS DE UTILIDAD
    formatDateToLocal(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatTime(timeString: string): string {
        if (!timeString) return '--:--';
        return timeString.substring(0, 5);
    }

    formatCurrency(amount: any): string {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(numAmount || 0);
    }

    onFechaChange() {
        this.mostrandoTodasLasReservas = false; // Al cambiar fecha, salimos del modo "todas"
        this.filtrarReservas();
    }

    recargar() {
        this.cargarDatos();
    }

    // NOTIFICACIONES
    mostrarExito(mensaje: string) {
        this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
    }

    mostrarError(mensaje: string) {
        this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
    }

    mostrarInfo(mensaje: string) {
        this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
    }

    // Contadores para filtros
    contarReservasPorEstado(estado: string): number {
        if (!this.reservas || !Array.isArray(this.reservas)) {
            return 0;
        }

        let reservasFiltradas = [...this.reservas];

        // Aplicar filtro de fecha para los contadores
        if (!this.mostrandoTodasLasReservas && this.fechaSeleccionada) {
            const fechaStr = this.formatDateToLocal(this.fechaSeleccionada);
            reservasFiltradas = reservasFiltradas.filter(
                reserva => reserva.fecha_reserva === fechaStr
            );
        }

        switch (estado) {
            case 'pendientes':
                return reservasFiltradas.filter(reserva => reserva.estado === 'pendiente').length;
            case 'confirmadas':
                return reservasFiltradas.filter(reserva => reserva.estado === 'confirmada').length;
            case 'completadas':
                return reservasFiltradas.filter(reserva => reserva.estado === 'completada').length;
            case 'canceladas':
                return reservasFiltradas.filter(reserva => reserva.estado === 'cancelada').length;
            case 'rechazadas':
                return reservasFiltradas.filter(reserva => reserva.estado === 'rechazada').length;
            case 'todas':
                return reservasFiltradas.length;
            default:
                return 0;
        }
    }

    // Método para obtener iconos de ausencias
    getAusenciaIcon(tipo: string): string {
        switch (tipo) {
            case 'vacaciones':
                return 'beach_access';
            case 'baja':
                return 'sick';
            case 'otro':
                return 'event_busy';
            default:
                return 'help';
        }
    }

    verTodasLasReservas() {
        this.mostrandoTodasLasReservas = true;
        this.filtrarReservas();
        console.log('📋 Mostrando todas mis reservas:', this.reservasFiltradas.length);
    }

    // Método para mostrar motivo de cancelación
    getMotivoCancelacion(reserva: ReservaCalendario): string {
        return reserva.motivo_cancelacion || 'Motivo no especificado';
    }

    // Verificar si una reserva puede ser aceptada/rechazada
    puedeGestionarReserva(reserva: ReservaCalendario): boolean {
        return reserva.estado === 'pendiente';
    }
}