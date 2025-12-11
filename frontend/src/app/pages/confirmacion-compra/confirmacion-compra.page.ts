import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-confirmacion-compra',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './confirmacion-compra.page.html',
    styleUrls: ['./confirmacion-compra.page.scss']
})
export class ConfirmacionCompraPage implements OnInit {
    loading = true;
    error: string | null = null;
    venta: any = null;

    constructor(
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        this.cargarConfirmacion();
    }

    cargarConfirmacion() {
        this.loading = true;
        this.error = null;

        const ventaId = this.route.snapshot.queryParams['venta_id'];
        const transaccionId = this.route.snapshot.queryParams['orden'];

        if (!ventaId && !transaccionId) {
            this.error = 'No se encontró información de la compra';
            this.loading = false;
            return;
        }

        // Simular datos de la venta con estructura correcta
        setTimeout(() => {
            const carritoItems = this.getCarritoFromSession();

            this.venta = {
                id: ventaId,
                transaccion_id: transaccionId,
                fecha_venta: new Date().toISOString(),
                metodo_pago: 'paypal',
                estado: 'completada',
                total: this.getTotalFromSession(),
                detalles: carritoItems.map(item => ({
                    producto: {
                        nombre: item.producto?.nombre || 'Producto',
                        precio: item.producto?.precio || 0
                    },
                    cantidad: item.cantidad,
                    precio_unitario: item.producto?.precio || 0,
                    subtotal: item.subtotal || 0
                }))
            };
            this.loading = false;
        }, 1000);
    }

    private getCarritoFromSession(): any[] {
        // Obtener carrito de sessionStorage
        const carrito = sessionStorage.getItem('ultimaCompraCarrito');
        return carrito ? JSON.parse(carrito) : [];
    }

    private getTotalFromSession(): number {
        return parseFloat(sessionStorage.getItem('ultimaCompraTotal') || '0');
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
                weekday: 'long',
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

    getMetodoPagoText(metodo: string): string {
        const metodos: { [key: string]: string } = {
            'paypal': 'PayPal',
            'tarjeta': 'Tarjeta de Crédito',
            'transferencia': 'Transferencia Bancaria'
        };
        return metodos[metodo] || metodo;
    }

    getEstadoText(estado: string): string {
        const estados: { [key: string]: string } = {
            'completada': 'Completada',
            'pendiente': 'Pendiente',
            'cancelada': 'Cancelada'
        };
        return estados[estado] || estado;
    }

    // MÉTODOS PARA ENVÍO
    calcularEnvio(): string {
        const costoEnvio = this.getCostoEnvio();
        return costoEnvio === 0 ? 'Gratuito' : this.formatCurrency(costoEnvio);
    }

    getCostoEnvio(): number {
        // Envío gratuito a partir de 30€, costo de 4.95€ para compras menores
        return this.venta.total >= 30 ? 0 : 4.95;
    }

    getTotalConEnvio(): number {
        return this.venta.total + this.getCostoEnvio();
    }

    volverAlDashboard() {
        this.router.navigate(['/dashboard']);
    }

    irAMisCompras() {
        this.router.navigate(['/mis-compras']);
    }

    imprimirRecibo() {
        window.print();
    }
}