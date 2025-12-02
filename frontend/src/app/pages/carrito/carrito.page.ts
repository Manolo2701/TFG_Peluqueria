import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Services
import { CarritoService } from '../../core/services/carrito.service';
import { AuthService } from '../../core/services/auth.service';
import { CarritoItem } from '../../interfaces/producto.interface';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-carrito',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatTableModule,
        MatDialogModule
    ],
    templateUrl: './carrito.page.html',
    styleUrls: ['./carrito.page.scss']
})
export class CarritoPage implements OnInit, OnDestroy {
    carrito: CarritoItem[] = [];
    loading = true;
    error: string | null = null;
    usuario: any = null;
    private carritoSubscription: Subscription = new Subscription();
    private authSubscription: Subscription = new Subscription();

    displayedColumns: string[] = ['producto', 'precio', 'cantidad', 'subtotal', 'acciones'];

    constructor(
        private carritoService: CarritoService,
        private authService: AuthService,
        private router: Router,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) { }

    ngOnInit() {
        console.log('🔄 Inicializando página de carrito...');

        this.authSubscription = this.authService.usuarioActual$.subscribe(usuario => {
            console.log('👤 Cambio de usuario en carrito:', usuario);
            this.usuario = usuario;

            if (!usuario) {
                this.mostrarError('Debes iniciar sesión para acceder al carrito');
                this.router.navigate(['/login']);
                return;
            }

            setTimeout(() => {
                this.debugCarrito();
            }, 1000);

            this.loading = true;
            this.error = null;
            this.carrito = [];

            this.carritoSubscription = this.carritoService.getCarritoObservable().subscribe({
                next: (carrito) => {
                    console.log('🛒 Carrito actualizado en página:', carrito);
                    this.carrito = carrito;
                    this.loading = false;
                    this.error = null;
                },
                error: (error) => {
                    console.error('Error cargando carrito:', error);
                    this.error = 'Error al cargar el carrito';
                    this.loading = false;
                    this.mostrarError('Error al cargar el carrito');
                }
            });

            this.cargarCarrito();
        });
    }

    ngOnDestroy() {
        if (this.carritoSubscription) {
            this.carritoSubscription.unsubscribe();
        }
        if (this.authSubscription) {
            this.authSubscription.unsubscribe();
        }
    }

    cargarCarrito() {
        console.log('🔄 Cargando carrito para usuario:', this.usuario?.id);
        this.loading = true;
        this.error = null;
        this.carritoService.obtenerCarritoBackend().subscribe({
            next: (response: any) => {
                console.log('✅ Carrito cargado:', response);
                this.loading = false;
            },
            error: (err) => {
                console.error('Error cargando carrito:', err);
                this.error = 'Error al cargar el carrito';
                this.loading = false;
                this.mostrarError('Error al cargar el carrito');
            }
        });
    }

    get totalCarrito(): number {
        return this.carrito.reduce((total, item) => total + (item.subtotal || 0), 0);
    }

    get cantidadTotal(): number {
        return this.carrito.reduce((total, item) => total + item.cantidad, 0);
    }

    // ✅ MÉTODOS PARA ENVÍO
    calcularEnvio(): string {
        const costoEnvio = this.getCostoEnvio();
        return costoEnvio === 0 ? 'Gratuito' : this.formatCurrency(costoEnvio);
    }

    getCostoEnvio(): number {
        // Envío gratuito a partir de 30€, costo de 4.95€ para compras menores
        return this.totalCarrito >= 30 ? 0 : 4.95;
    }

    getTotalConEnvio(): number {
        return this.totalCarrito + this.getCostoEnvio();
    }

    actualizarCantidad(item: CarritoItem, nuevaCantidad: number) {
        console.log('🔄 Actualizando cantidad:', {
            producto: item.producto?.nombre,
            cantidadActual: item.cantidad,
            nuevaCantidad: nuevaCantidad,
            stock: item.producto?.stock
        });

        if (nuevaCantidad < 1) {
            this.eliminarDelCarrito(item);
            return;
        }

        // ✅ Verificar stock REAL
        if (nuevaCantidad > (item.producto?.stock || 0)) {
            this.mostrarError(`No hay suficiente stock. Stock disponible: ${item.producto?.stock || 0}`);
            return;
        }

        this.carritoService.actualizarCantidad(item.producto_id, nuevaCantidad).subscribe({
            next: (response) => {
                console.log('✅ Cantidad actualizada exitosamente:', response);
                this.mostrarExito('Cantidad actualizada');
                // NO recargar la página, solo actualizar el carrito localmente
                const itemIndex = this.carrito.findIndex(i => i.producto_id === item.producto_id);
                if (itemIndex > -1) {
                    this.carrito[itemIndex].cantidad = nuevaCantidad;
                    this.carrito[itemIndex].subtotal = (item.producto?.precio || 0) * nuevaCantidad;
                }
            },
            error: (error) => {
                console.error('❌ Error actualizando cantidad:', error);
                let mensajeError = 'Error al actualizar la cantidad';
                if (error.error?.error) {
                    mensajeError = error.error.error;
                }
                this.mostrarError(mensajeError);
            }
        });
    }

    debugCarrito() {
        console.log('🐛 DEBUG Carrito actual:', {
            carrito: this.carrito,
            items: this.carrito.map(item => ({
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                producto: item.producto,
                subtotal: item.subtotal
            }))
        });
    }

    onCantidadChange(item: CarritoItem, event: any) {
        const nuevaCantidad = parseInt(event.target.value, 10);
        console.log('📝 Cambio manual de cantidad:', nuevaCantidad);

        if (isNaN(nuevaCantidad) || nuevaCantidad < 1) {
            // Si no es un número válido, restaurar valor anterior
            event.target.value = item.cantidad;
            return;
        }

        this.actualizarCantidad(item, nuevaCantidad);
    }

    validarCantidad(item: CarritoItem) {
        if (item.cantidad < 1) {
            this.actualizarCantidad(item, 1);
        } else if (item.cantidad > (item.producto?.stock || 0)) {
            this.actualizarCantidad(item, item.producto?.stock || 1);
        }
    }

    eliminarDelCarrito(item: CarritoItem) {
        this.carritoService.eliminarProducto(item.producto_id).subscribe({
            next: () => {
                this.mostrarExito('Producto eliminado del carrito');
            },
            error: (error) => {
                console.error('Error eliminando producto:', error);
                this.mostrarError('Error al eliminar el producto del carrito');
            }
        });
    }

    vaciarCarrito() {
        this.carritoService.vaciarCarrito().subscribe({
            next: () => {
                this.mostrarExito('Carrito vaciado');
            },
            error: (err) => {
                console.error('Error vaciando carrito:', err);
                this.mostrarError('Error al vaciar el carrito');
            }
        });
    }

    procesarVentaPaypal() {
        console.log('🔍 Iniciando proceso de pago con PayPal...');

        if (!this.usuario) {
            this.mostrarError('Debes iniciar sesión para realizar una compra');
            this.router.navigate(['/login']);
            return;
        }

        if (this.carrito.length === 0) {
            this.mostrarError('El carrito está vacío');
            return;
        }

        const ventaData = {
            items: this.carrito.map(item => ({
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio: item.producto?.precio || 0,
                nombre: item.producto?.nombre || 'Producto'
            })),
            total: this.getTotalConEnvio() // ✅ Usar total con envío
        };

        console.log('💰 Total con envío:', this.formatCurrency(this.getTotalConEnvio()));

        this.loading = true;

        this.carritoService.crearOrdenPaypal(ventaData).subscribe({
            next: (response: any) => {
                console.log('✅ Respuesta de PayPal:', response);
                this.loading = false;

                if (response.success && response.approvalUrl) {
                    
                    if (response.paypalReal) {
                        this.mostrarExito('Redirigiendo a PayPal...');
                        console.log('🌐 PayPal REAL: Redirigiendo a:', response.approvalUrl);
                        
                        // ✅ GUARDAR DATOS PARA EL RECIBO
                        sessionStorage.setItem('ultimaCompraTotal', this.getTotalConEnvio().toString());
                        sessionStorage.setItem('ultimaCompraCarrito', JSON.stringify(this.carrito));
                        sessionStorage.setItem('paypalOrderId', response.orderID);

                        // Vaciar carrito localmente
                        this.carritoService.vaciarCarrito().subscribe(() => {
                            console.log('✅ Carrito vaciado localmente');
                        });

                        this.carrito = [];

                        // ✅ REDIRIGIR A PAYPAL REAL
                        setTimeout(() => {
                            window.location.href = response.approvalUrl;
                        }, 1500);

                    } else {
                        // Modo simulación
                        this.mostrarExito('¡Compra realizada exitosamente! (Modo simulación)');
                        
                        sessionStorage.setItem('ultimaCompraTotal', this.getTotalConEnvio().toString());
                        sessionStorage.setItem('ultimaCompraCarrito', JSON.stringify(this.carrito));

                        this.carritoService.vaciarCarrito().subscribe(() => {
                            console.log('✅ Carrito vaciado localmente');
                        });

                        this.carrito = [];

                        setTimeout(() => {
                            window.location.href = response.approvalUrl;
                        }, 1000);
                    }

                } else {
                    this.mostrarError('Error al procesar la compra: ' + (response.message || 'Respuesta inválida'));
                }
            },
            error: (err) => {
                console.error('❌ Error completo:', err);
                const serverMessage = err.error?.error || err.error?.message || 'Error interno del servidor';
                this.loading = false;
                this.mostrarError(`Error: ${serverMessage}`);
            }
        });
    }

    seguirComprando() {
        this.router.navigate(['/catalogo-productos']);
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
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