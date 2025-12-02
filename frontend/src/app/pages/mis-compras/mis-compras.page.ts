import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

// Services
import { VentaService } from '../../core/services/venta.service';
import { AuthService } from '../../core/services/auth.service';
import { HistorialClienteModalComponent } from '../../components/historial-cliente-modal/historial-cliente-modal.component';

@Component({
    selector: 'app-mis-compras',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSnackBarModule
    ],
    templateUrl: './mis-compras.page.html',
    styleUrls: ['./mis-compras.page.scss']
})
export class MisComprasPage implements OnInit {
    loading = true;
    error: string | null = null;
    ventas: any[] = [];
    usuario: any = null;

    constructor(
        private ventaService: VentaService,
        private authService: AuthService,
        private router: Router,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit() {
        this.authService.usuarioActual$.subscribe(usuario => {
            this.usuario = usuario;
            if (usuario) {
                this.cargarMisCompras();
            } else {
                this.router.navigate(['/login']);
            }
        });
    }

    cargarMisCompras() {
        this.loading = true;
        this.error = null;

        this.ventaService.getMisVentas().subscribe({
            next: (response: any) => {
                console.log('✅ Compras cargadas:', response);
                this.ventas = response.ventas || [];
                this.loading = false;
            },
            error: (err) => {
                console.error('❌ Error cargando compras:', err);
                this.error = 'Error al cargar tus compras';
                this.loading = false;
                this.mostrarError('Error al cargar tus compras');
            }
        });
    }

    getTotalGastado(): number {
        return this.ventas.reduce((total, venta) => total + parseFloat(venta.total || 0), 0);
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    formatDate(dateString: string): string {
        if (!dateString) return 'Fecha no disponible';
        try {
            return new Date(dateString).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    }

    getEstadoText(estado: string): string {
        const estados: { [key: string]: string } = {
            'completada': 'Completada',
            'pendiente': 'Pendiente',
            'cancelada': 'Cancelada'
        };
        return estados[estado] || estado;
    }

    getEstadoIcon(estado: string): string {
        const iconos: { [key: string]: string } = {
            'completada': 'check_circle',
            'pendiente': 'schedule',
            'cancelada': 'cancel'
        };
        return iconos[estado] || 'help';
    }

    getEstadoIconClass(estado: string): string {
        return `estado-icon estado-${estado}`;
    }

    getMetodoPagoText(metodo: string): string {
        const metodos: { [key: string]: string } = {
            'paypal': 'PayPal',
            'tarjeta': 'Tarjeta',
            'transferencia': 'Transferencia'
        };
        return metodos[metodo] || metodo;
    }

    verDetalles(venta: any) {
        // Navegar a la página de confirmación con los datos de esta venta
        this.router.navigate(['/confirmacion-compra'], {
            queryParams: {
                venta_id: venta.id,
                orden: venta.transaccion_id,
                from: 'mis-compras'
            }
        });
    }

    descargarFactura(venta: any) {
        this.mostrarExito('Descargando factura...');
        // En una implementación real, aquí llamarías al servicio para generar PDF
        console.log('📄 Descargando factura para venta:', venta.id);

        // Simular descarga
        setTimeout(() => {
            this.mostrarExito('Factura descargada correctamente');
        }, 1000);
    }

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
}