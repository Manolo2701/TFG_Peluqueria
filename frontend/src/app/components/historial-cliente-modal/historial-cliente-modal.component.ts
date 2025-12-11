import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { TrabajadorService } from '../../core/services/trabajador.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { AuthService } from '../../core/services/auth.service';

interface ReservaHistorial {
    id: number;
    fecha: string;
    horaInicio: string;
    duracion: number;
    estado: string;
    notas: string;
    precio: number;
    fechaCreacion: string;
    servicio: {
        nombre: string;
        descripcion: string;
        categoria: string;
    };
}

@Component({
    selector: 'app-historial-cliente-modal',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatCardModule,
        MatChipsModule,
        MatTabsModule
    ],
    templateUrl: './historial-cliente-modal.component.html',
    styleUrls: ['./historial-cliente-modal.component.scss']
})
export class HistorialClienteModalComponent implements OnInit {
    historial: ReservaHistorial[] = [];
    loading = false;
    error: string | null = null;
    estadisticas: any = null;

    constructor(
        public dialogRef: MatDialogRef<HistorialClienteModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { cliente: any },
        private trabajadorService: TrabajadorService,
        private usuarioService: UsuarioService,
        private authService: AuthService
    ) { }

    ngOnInit() {
        this.cargarHistorial();
    }

    cargarHistorial() {
        this.loading = true;
        this.error = null;

        const rolUsuario = this.authService.getRol();

        if (rolUsuario === 'administrador') {
            // Para administradores: usar el nuevo endpoint que obtiene TODAS las reservas
            this.usuarioService.obtenerHistorialCliente(this.data.cliente.id).subscribe({
                next: (response) => {
                    this.historial = response.historial;
                    this.estadisticas = response.estadisticas;
                    this.loading = false;
                },
                error: (err) => {
                    this.error = err.message;
                    this.loading = false;
                    console.error('Error cargando historial (admin):', err);
                }
            });
        } else {
            // Para trabajadores: usar el endpoint existente que obtiene solo SUS reservas
            this.trabajadorService.obtenerHistorialCliente(this.data.cliente.id).subscribe({
                next: (response) => {
                    this.historial = response.historial;
                    this.estadisticas = response.estadisticas;
                    this.loading = false;
                },
                error: (err) => {
                    this.error = err.message;
                    this.loading = false;
                    console.error('Error cargando historial:', err);
                }
            });
        }
    }

    cerrar() {
        this.dialogRef.close();
    }

    formatearFecha(fecha: string): string {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatearHora(hora: string): string {
        return hora.substring(0, 5); // Formato HH:MM
    }

    formatearDuracion(minutos: number): string {
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        if (horas > 0) {
            return `${horas}h ${mins}min`;
        }
        return `${mins}min`;
    }

    formatearPrecio(precio: any): string {
        try {
            let precioNumero: number;

            if (typeof precio === 'number') {
                precioNumero = precio;
            } else if (typeof precio === 'string') {
                const precioLimpio = precio.replace(/[^\d,.-]/g, '').replace(',', '.');
                precioNumero = parseFloat(precioLimpio);
            } else {
                precioNumero = Number(precio);
            }

            if (isNaN(precioNumero) || !isFinite(precioNumero)) {
                console.warn('⚠️ Precio no válido:', precio);
                return '0.00€';
            }

            return `${precioNumero.toFixed(2)}€`;
        } catch (error) {
            console.error('❌ Error formateando precio:', error, 'Precio original:', precio);
            return '0.00€';
        }
    }

    getReservasConfirmadas(): ReservaHistorial[] {
        return this.historial.filter(r => r.estado === 'confirmada');
    }

    getReservasCanceladas(): ReservaHistorial[] {
        return this.historial.filter(r => r.estado === 'cancelada');
    }

    getReservasPendientes(): ReservaHistorial[] {
        return this.historial.filter(r => r.estado === 'pendiente');
    }

    getReservasCompletadas(): ReservaHistorial[] {
        return this.historial.filter(r => r.estado === 'completada');
    }
}