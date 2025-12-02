import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

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
        MatChipsModule,
        MatMenuModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule
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
        private dialog: MatDialog,
        private fb: FormBuilder
    ) { }

    ngOnInit() {
        this.cargarMisReservas();
    }

    // Método para volver al dashboard
    volver() {
        this.router.navigate(['/dashboard']);
    }

    cargarMisReservas() {
        this.loading = true;
        this.error = null;

        this.reservaService.getMisReservas().subscribe({
            next: (response: any) => {
                if (response && Array.isArray(response.reservas)) {
                    this.reservas = response.reservas;
                } else if (Array.isArray(response)) {
                    this.reservas = response;
                } else {
                    this.reservas = [];
                }

                this.filtrarReservas();
                this.loading = false;
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
        const usuarioStr = localStorage.getItem('usuario');
        const usuarioActual = usuarioStr ? JSON.parse(usuarioStr) : null;

        const dialogRef = this.dialog.open(ReservaDetallesModalComponent, {
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

        // Manejar directamente la cancelación desde el modal
        dialogRef.afterClosed().subscribe(result => {
            if (result && result.accion === 'cancelada') {
                // Usar directamente el motivo y política del resultado
                this.confirmarCancelacion(reserva, result.motivo, result.politica);
            }
        });
    }

    // Diálogo simple de cancelación solo con motivo
    abrirDialogoCancelacionSimple(reserva: Reserva) {
        const dialogRef = this.dialog.open(DialogoCancelacionSimpleComponent, {
            width: '400px',
            data: {
                reserva: reserva
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Usar la política de la reserva - CORREGIDO: cliente no elige política
                const politica = reserva.politica_cancelacion || 'flexible';
                this.confirmarCancelacion(reserva, result.motivo, politica);
            }
        });
    }

    // Función para cancelar reserva desde la lista
    cancelarReserva(reserva: Reserva) {
        this.abrirDialogoCancelacionSimple(reserva);
    }

    confirmarCancelacion(reserva: Reserva, motivo: string, politica: string) {
        this.reservaService.cancelarReserva(reserva.id, motivo, politica).subscribe({
            next: (response) => {
                this.snackBar.open('✅ Reserva cancelada exitosamente', 'Cerrar', { duration: 5000 });
                this.cargarMisReservas();
            },
            error: (error) => {
                console.error('❌ Error cancelando reserva:', error);
                this.snackBar.open('❌ Error al cancelar la reserva: ' + error.error?.error, 'Cerrar', { duration: 5000 });
            }
        });
    }

    puedeCancelar(reserva: Reserva): boolean {
        if (reserva.estado === 'cancelada' || reserva.estado === 'completada' || reserva.estado === 'rechazada') {
            return false;
        }

        const ahora = new Date();
        const fechaReserva = new Date(reserva.fecha_reserva + 'T' + reserva.hora_inicio);
        return fechaReserva > ahora;
    }

    nuevaReserva() {
        this.router.navigate(['/reservar']);
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
            return 'Fecha inválida';
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
            case 'confirmada': return 'estado-confirmada';
            case 'pendiente': return 'estado-pendiente';
            case 'cancelada': return 'estado-cancelada';
            case 'completada': return 'estado-completada';
            case 'rechazada': return 'estado-rechazada';  // ✅ NUEVO ESTADO
            default: return 'estado-desconocido';
        }
    }

    getEstadoIcon(estado: string): string {
        switch (estado) {
            case 'confirmada': return 'check_circle';
            case 'pendiente': return 'schedule';
            case 'cancelada': return 'cancel';
            case 'completada': return 'done_all';
            case 'rechazada': return 'block';  // ✅ NUEVO ESTADO
            default: return 'help';
        }
    }

    contarReservasPorEstado(estado: string): number {
        return this.reservas.filter(reserva => reserva.estado === estado).length;
    }
}

// Componente de diálogo simple para cancelación (solo motivo)
@Component({
    selector: 'app-dialogo-cancelacion-simple',
    template: `
    <div class="dialogo-cancelacion-simple">
        <h2 mat-dialog-title>Cancelar Reserva</h2>
        
        <mat-dialog-content>
            <p>¿Estás seguro de que deseas cancelar esta reserva?</p>
            
            <div class="info-reserva">
                <strong>{{ data.reserva.servicio_nombre }}</strong><br>
                {{ formatDate(data.reserva.fecha_reserva) }} a las {{ formatTime(data.reserva.hora_inicio) }}
            </div>

            <form [formGroup]="cancelacionForm">
                <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Motivo de cancelación</mat-label>
                    <textarea matInput formControlName="motivo" placeholder="Ingresa el motivo de la cancelación" rows="3"></textarea>
                    <mat-error *ngIf="cancelacionForm.get('motivo')?.hasError('required')">
                        El motivo es obligatorio
                    </mat-error>
                </mat-form-field>

                <div class="politica-info" *ngIf="getPoliticaCancelacion()">
                    <mat-icon>info</mat-icon>
                    <span>{{ getPoliticaCancelacion() }}</span>
                </div>
            </form>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
            <button mat-button (click)="cancelar()">No Cancelar</button>
            <button mat-raised-button color="warn" (click)="confirmar()" [disabled]="!cancelacionForm.valid">
                <mat-icon>cancel</mat-icon>
                Confirmar Cancelación
            </button>
        </mat-dialog-actions>
    </div>
    `,
    styles: [`
    .dialogo-cancelacion-simple {
        padding: 0;
    }
    .full-width {
        width: 100%;
        margin-bottom: 16px;
    }
    .info-reserva {
        background: #f5f5f5;
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 16px;
        text-align: center;
    }
    .politica-info {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #e3f2fd;
        border-radius: 4px;
        color: #1976d2;
        font-size: 14px;
        
        mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
        }
    }
    `],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule]
})
export class DialogoCancelacionSimpleComponent {
    cancelacionForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<DialogoCancelacionSimpleComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.cancelacionForm = this.fb.group({
            motivo: ['', Validators.required]
        });
    }

    confirmar() {
        if (this.cancelacionForm.valid) {
            this.dialogRef.close(this.cancelacionForm.value);
        }
    }

    cancelar() {
        this.dialogRef.close();
    }

    getPoliticaCancelacion(): string {
        return 'Sistema de políticas de cancelación en desarrollo. Próximamente disponible.';
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
            return 'Fecha inválida';
        }
    }

    formatTime(timeString: string): string {
        if (!timeString) return '--:--';
        return timeString.substring(0, 5);
    }
}