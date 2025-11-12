import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';

import { ReservaService, Reserva } from '../../core/services/reserva.service';
import { ReservaDetallesModalComponent } from '../../components/reserva-detalles-modal/reserva-detalles-modal.component';

@Component({
    selector: 'app-mis-reservas',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatDialogModule,
        MatTabsModule,
        MatChipsModule
    ],
    templateUrl: './mis-reservas.page.html',
    styleUrls: ['./mis-reservas.page.scss']
})
export class MisReservasPage implements OnInit {
    reservas: Reserva[] = [];
    reservasFiltradas: Reserva[] = [];
    loading = true;
    error: string | null = null;
    filtroActivo: string = 'todas';

    constructor(
        private reservaService: ReservaService,
        private router: Router,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) { }

    ngOnInit() {
        this.cargarMisReservas();
    }

    cargarMisReservas() {
        this.loading = true;
        this.error = null;

        this.reservaService.getMisReservas().subscribe({
            next: (response: any) => {
                // Manejar diferentes formatos de respuesta
                if (response && Array.isArray(response.reservas)) {
                    this.reservas = response.reservas;
                } else if (Array.isArray(response)) {
                    this.reservas = response;
                } else {
                    this.reservas = [];
                }

                this.filtrarReservas();
                this.loading = false;
                console.log('✅ Mis reservas cargadas:', this.reservas);
            },
            error: (err) => {
                console.error('❌ Error cargando mis reservas:', err);
                this.error = 'Error al cargar tus reservas. Por favor, intenta nuevamente.';
                this.loading = false;
                this.snackBar.open(this.error, 'Cerrar', { duration: 5000 });
            }
        });
    }

    filtrarReservas() {
        if (this.filtroActivo === 'todas') {
            this.reservasFiltradas = [...this.reservas];
        } else {
            this.reservasFiltradas = this.reservas.filter(
                reserva => reserva.estado === this.filtroActivo
            );
        }
    }

    onFiltroChange(filtro: string) {
        this.filtroActivo = filtro;
        this.filtrarReservas();
    }

    verDetalles(reserva: Reserva) {
        console.log('🔍 Ver detalles desde Mis Reservas:', reserva);

        const usuarioStr = localStorage.getItem('usuario');
        const usuarioActual = usuarioStr ? JSON.parse(usuarioStr) : null;

        this.dialog.open(ReservaDetallesModalComponent, {
            width: '600px',
            maxWidth: '90vw',
            data: {
                reserva,
                usuarioActual,
                esVistaTrabajador: false,
                contexto: 'mis-reservas'
            },
            panelClass: 'reserva-detalles-modal'
        });
    }

    nuevaReserva() {
        this.router.navigate(['/servicios']);
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

    getEstadoColor(estado: string): string {
        switch (estado) {
            case 'confirmada':
                return 'estado-confirmada';
            case 'pendiente':
                return 'estado-pendiente';
            case 'cancelada':
                return 'estado-cancelada';
            case 'completada':
                return 'estado-completada';
            default:
                return 'estado-desconocido';
        }
    }

    getEstadoIcon(estado: string): string {
        switch (estado) {
            case 'confirmada':
                return 'check_circle';
            case 'pendiente':
                return 'schedule';
            case 'cancelada':
                return 'cancel';
            case 'completada':
                return 'done_all';
            default:
                return 'help';
        }
    }

    contarReservasPorEstado(estado: string): number {
        return this.reservas.filter(reserva => reserva.estado === estado).length;
    }
}