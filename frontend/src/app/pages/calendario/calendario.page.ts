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
import { ReservaService, Reserva } from '../../core/services/reserva.service';
import { MatDialog } from '@angular/material/dialog';
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
    selector: 'app-calendario',
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
        MatProgressSpinnerModule
    ],
    templateUrl: './calendario.page.html',
    styleUrls: ['./calendario.page.scss']
})
export class CalendarioPage implements OnInit {
    reservas: ReservaCalendario[] = [];
    reservasFiltradas: ReservaCalendario[] = [];

    fechaSeleccionada: Date = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    mostrandoTodasLasReservas: boolean = false;

    loading = true;
    error: string | null = null;

    // Nuevo: Filtro de estado
    filtroEstado: string = 'todas'; // 'todas', 'pendientes', 'confirmadas', 'completadas', 'canceladas', 'rechazadas'

    displayedColumns: string[] = ['hora', 'cliente', 'servicio', 'trabajador', 'estado', 'acciones'];

    constructor(
        private reservaService: ReservaService,
        private dialog: MatDialog
    ) { }

    ngOnInit() {
        this.verificarAutenticacion();
        // Temporal: debug de fecha
        setTimeout(() => this.debugFecha(), 1000);
    }

    verificarAutenticacion() {
        const token = localStorage.getItem('token');
        const usuarioStr = localStorage.getItem('usuario');
        const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;

        console.log('🔐 Estado de autenticación:', {
            token: token ? `Presente (${token.length} chars)` : 'Ausente',
            usuario: usuario ? `${usuario.nombre} (${usuario.rol})` : 'No autenticado'
        });

        if (!token) {
            this.error = 'No estás autenticado. Por favor inicia sesión primero.';
            this.loading = false;
            return;
        }

        if (usuario && usuario.rol !== 'administrador') {
            this.error = 'Solo los administradores pueden ver todas las reservas. Tu rol: ' + usuario.rol;
            this.loading = false;
            return;
        }

        this.cargarReservas();
    }

    cargarReservas() {
        this.loading = true;
        this.error = null;

        console.log('🔄 Cargando reservas...');
        this.reservaService.getReservas().subscribe({
            next: (reservas: ReservaCalendario[]) => {
                console.log('✅ Reservas cargadas exitosamente:', reservas);

                console.log('📅 Fechas únicas en las reservas:', [...new Set(reservas.map(r => r.fecha_reserva))]);
                console.log('🔍 Primera reserva ejemplo:', reservas[0]);

                // Asegurar que sea array
                if (!reservas || !Array.isArray(reservas)) {
                    console.warn('⚠️ La API no devolvió un array, inicializando vacío');
                    this.reservas = [];
                } else {
                    this.reservas = reservas;
                    // En el next de cargarReservas, después de this.reservas = reservas;
                    if (reservas.length > 0) {
                        console.log('🔍 Estructura completa de la primera reserva:', JSON.stringify(reservas[0], null, 2));
                    }
                }

                this.filtrarReservas();
                this.loading = false;
            },
            error: (err) => {
                console.error('❌ Error al cargar reservas:', err);

                if (err.status === 401) {
                    this.error = 'Error de autenticación. El token puede ser inválido o haber expirado. Por favor, inicia sesión nuevamente.';
                } else if (err.status === 403) {
                    this.error = 'No tienes permisos para ver todas las reservas. Solo los administradores pueden acceder a esta función.';
                } else if (err.status === 0) {
                    this.error = 'Error de conexión. No se pudo conectar al servidor. Verifica que el backend esté corriendo.';
                } else {
                    this.error = 'Error al cargar las reservas. Verifica la conexión.';
                }

                this.reservas = [];
                this.reservasFiltradas = [];
                this.loading = false;
            }
        });
    }

    filtrarReservas() {
        if (!this.reservas || !Array.isArray(this.reservas)) {
            console.warn('⚠️ Reservas no es un array, inicializando como array vacío');
            this.reservas = [];
            this.reservasFiltradas = [];
            return;
        }

        let reservasFiltradas = [...this.reservas];

        // 1. Aplicar filtro por estado primero
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
                // No filtrar por estado
                break;
        }

        // 2. Aplicar filtro por fecha (a menos que estemos en modo "ver todas")
        if (!this.mostrandoTodasLasReservas) {
            if (!this.fechaSeleccionada) {
                // Si no hay fecha seleccionada, mostrar todas las filtradas por estado
                this.reservasFiltradas = reservasFiltradas;
                return;
            }

            // Filtrar por fecha
            const fechaSeleccionadaStr = this.formatDateToLocal(this.fechaSeleccionada);
            console.log('🔍 Filtrando por fecha (LOCAL):', fechaSeleccionadaStr);

            reservasFiltradas = reservasFiltradas.filter(reserva => {
                if (!reserva.fecha_reserva) {
                    console.warn('Reserva sin fecha_reserva:', reserva);
                    return false;
                }

                const reservaFechaStr = reserva.fecha_reserva;
                const coincide = reservaFechaStr === fechaSeleccionadaStr;

                return coincide;
            });
        }

        this.reservasFiltradas = reservasFiltradas;
        console.log(`📊 Filtradas ${this.reservasFiltradas.length} reservas (estado: ${this.filtroEstado})`);
    }

    // Cambiar filtro de estado
    onFiltroEstadoChange(filtro: string) {
        this.filtroEstado = filtro;
        this.filtrarReservas();
    }

    // Contar reservas por estado
    contarReservasPorEstado(estado: string): number {
        if (!this.reservas || !Array.isArray(this.reservas)) {
            return 0;
        }

        let reservasFiltradas = [...this.reservas];

        // Aplicar filtro de fecha para los contadores (a menos que estemos en modo "ver todas")
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

    // Formatear fecha a YYYY-MM-DD en hora local
    formatDateToLocal(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    onFechaChange() {
        this.mostrandoTodasLasReservas = false; // Al cambiar fecha, salimos del modo "todas"
        this.filtrarReservas();
    }

    formatTime(timeString: string): string {
        if (!timeString) return '--:--';
        return timeString.substring(0, 5);
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount || 0);
    }

    contarReservasConfirmadas(): number {
        return this.reservasFiltradas.filter(r => r.estado === 'confirmada').length;
    }

    contarReservasPendientes(): number {
        return this.reservasFiltradas.filter(r => r.estado === 'pendiente').length;
    }

    verDetalles(reserva: ReservaCalendario) {
        console.log('🔍 Ver detalles reserva desde calendario general:', reserva);

        // Obtener información del usuario
        const usuarioStr = localStorage.getItem('usuario');
        const usuarioActual = usuarioStr ? JSON.parse(usuarioStr) : null;

        this.dialog.open(ReservaDetallesModalComponent, {
            width: '600px',
            maxWidth: '90vw',
            data: {
                reserva,
                usuarioActual,
                esVistaTrabajador: false, // Calendario general es siempre vista admin
                contexto: 'calendario-general'
            },
            panelClass: 'reserva-detalles-modal'
        });
    }

    // Nueva función para recargar
    recargar() {
        this.verificarAutenticacion();
    }

    // Ir a login si no está autenticado
    irALogin() {
        window.location.href = '/login';
    }

    debugFecha() {
        const fecha = this.fechaSeleccionada;
        console.log('🐛 DEBUG FECHA:');
        console.log('  - Fecha original:', fecha);
        console.log('  - toISOString():', fecha.toISOString());
        console.log('  - toISOString().split(T)[0]:', fecha.toISOString().split('T')[0]);
        console.log('  - Método local:', this.formatDateToLocal(fecha));
        console.log('  - getDate():', fecha.getDate());
        console.log('  - getUTCDate():', fecha.getUTCDate());
    }

    verTodasLasReservas() {
        this.mostrandoTodasLasReservas = true;
        this.filtrarReservas();
        console.log('📋 Mostrando todas las reservas:', this.reservasFiltradas.length);
    }
}