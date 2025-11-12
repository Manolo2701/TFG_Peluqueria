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

import { ReservaService, Reserva } from '../../core/services/reserva.service';
import { CalendarioService } from '../../core/services/calendario.service';
import { Ausencia } from '../../interfaces/calendario.interface';
import { ReservaDetallesModalComponent } from '../../components/reserva-detalles-modal/reserva-detalles-modal.component';

interface ReservaCalendario extends Reserva {
    cliente_nombre?: string;
    cliente_apellidos?: string;
    servicio_nombre?: string;
    trabajador_nombre?: string;
    trabajador_apellidos?: string;
    duracion: number;
    precio?: number;
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
        MatTabsModule
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

        // Si estamos en modo "ver todas", no filtramos por fecha
        if (this.mostrandoTodasLasReservas) {
            this.reservasFiltradas = [...this.reservas];
            return;
        }

        if (!this.fechaSeleccionada) {
            this.reservasFiltradas = [...this.reservas];
            return;
        }

        const fechaStr = this.formatDateToLocal(this.fechaSeleccionada);
        this.reservasFiltradas = this.reservas.filter(
            reserva => reserva.fecha_reserva === fechaStr
        );

        console.log(`📊 Filtradas ${this.reservasFiltradas.length} reservas para ${fechaStr}`);
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
        this.reservaService.aceptarReserva(reserva.id).subscribe({
            next: () => {
                this.mostrarExito('Reserva aceptada exitosamente');
                this.cargarReservas();
            },
            error: (err) => {
                console.error('Error al aceptar reserva:', err);
                this.mostrarError('Error al aceptar la reserva');
            }
        });
    }

    rechazarReserva(reserva: ReservaCalendario) {
        this.reservaService.rechazarReserva(reserva.id).subscribe({
            next: () => {
                this.mostrarExito('Reserva rechazada exitosamente');
                this.cargarReservas();
            },
            error: (err) => {
                console.error('Error al rechazar reserva:', err);
                this.mostrarError('Error al rechazar la reserva');
            }
        });
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
        // Aquí podrías abrir un modal para solicitar ausencia
        console.log('Solicitar nueva ausencia');
        this.mostrarInfo('Funcionalidad de solicitud de ausencia en desarrollo');
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

    contarReservasPendientes(): number {
        if (!this.reservas || !Array.isArray(this.reservas)) {
            return 0;
        }
        return this.reservas.filter(reserva => reserva.estado === 'pendiente').length;
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
        this.reservasFiltradas = [...this.reservas];
        console.log('📋 Mostrando todas mis reservas:', this.reservasFiltradas.length);
    }
}