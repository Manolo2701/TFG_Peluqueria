import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

// Angular Material imports
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { CarritoService } from '../../core/services/carrito.service';
import { ProductosService } from '../../core/services/productos.service';
import { AuthService } from '../../core/services/auth.service';
import { Producto } from '../../interfaces/producto.interface';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-catalogo-productos',
    templateUrl: './catalogo-productos.page.html',
    styleUrls: ['./catalogo-productos.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSnackBarModule
    ]
})
export class CatalogoProductosPage implements OnInit, OnDestroy {
    productos: Producto[] = [];
    productosFiltrados: Producto[] = [];
    terminoBusqueda: string = '';
    sugerencias: string[] = [];
    mostrarSugerencias: boolean = false;
    buscando: boolean = false;
    loading: boolean = true;
    error: string = '';
    cantidadCarrito: number = 0;
    cantidadesSeleccionadas: Map<number, number> = new Map();
    private carritoSubscription: Subscription = new Subscription();
    private authSubscription: Subscription = new Subscription();
    usuario: any = null;

    constructor(
        private carritoService: CarritoService,
        private productosService: ProductosService,
        private authService: AuthService,
        private router: Router,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit() {
        console.log('🔄 Inicializando página de catálogo...');

        this.authSubscription = this.authService.usuarioActual$.subscribe(usuario => {
            console.log('👤 Cambio de usuario detectado:', usuario);
            this.usuario = usuario;

            if (usuario) {
                this.cargarProductos();
                this.carritoService.forzarRecarga();
            } else {
                this.mostrarError('Debes iniciar sesión para acceder al catálogo');
                this.router.navigate(['/login']);
            }
        });

        this.carritoSubscription = this.carritoService.getCarritoObservable().subscribe({
            next: (carrito) => {
                console.log('🛒 Carrito actualizado en catálogo:', carrito);
                this.cantidadCarrito = this.carritoService.getCantidadTotal();
                this.actualizarVistaCarrito();
            },
            error: (error) => {
                console.error('Error en suscripción al carrito:', error);
            }
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

    private actualizarVistaCarrito(): void {
        setTimeout(() => {
            this.cantidadCarrito = this.carritoService.getCantidadTotal();
        }, 0);
    }

    cargarProductos() {
        this.loading = true;
        this.error = '';

        this.productosService.getProductos().subscribe({
            next: (productos) => {
                console.log('📦 Productos cargados:', productos.length);

                this.productos = (Array.isArray(productos) ? productos : []).map(producto => ({
                    ...producto,
                    precio: this.parsearPrecio(producto.precio),
                    stock: this.parsearStock(producto.stock),
                    activo: producto.activo !== undefined ? producto.activo : true
                }));

                this.productosFiltrados = [...this.productos];
                this.loading = false;

                this.productos.forEach(producto => {
                    this.cantidadesSeleccionadas.set(producto.id, 1);
                });

                if (this.productos.length === 0) {
                    this.error = 'No hay productos disponibles en este momento.';
                }
            },
            error: (error) => {
                console.error('Error al cargar productos:', error);
                this.error = 'Error al cargar los productos. Por favor, intenta nuevamente.';
                this.loading = false;
                this.productos = [];
                this.productosFiltrados = [];
            }
        });
    }

    private parsearPrecio(precio: any): number {
        if (precio === null || precio === undefined) return 0;
        if (typeof precio === 'number') return precio;
        if (typeof precio === 'string') {
            const precioLimpio = precio.replace(/[^\d.,]/g, '').replace(',', '.');
            const numero = parseFloat(precioLimpio);
            return isNaN(numero) ? 0 : numero;
        }
        return 0;
    }

    private parsearStock(stock: any): number {
        if (stock === null || stock === undefined) return 0;
        if (typeof stock === 'number') return stock;
        if (typeof stock === 'string') {
            const numero = parseInt(stock, 10);
            return isNaN(numero) ? 0 : numero;
        }
        return 0;
    }

    onBuscarChange() {
        if (this.terminoBusqueda.length > 2 && this.productos.length > 0) {
            this.mostrarSugerencias = true;
            this.sugerencias = this.productos
                .filter(p => p && p.nombre && p.nombre.toLowerCase().includes(this.terminoBusqueda.toLowerCase()))
                .map(p => p.nombre)
                .slice(0, 5);
        } else {
            this.mostrarSugerencias = false;
            this.sugerencias = [];
        }
    }

    buscarProductos() {
        this.buscando = true;
        setTimeout(() => {
            if (this.terminoBusqueda && this.productos.length > 0) {
                this.productosFiltrados = this.productos.filter(producto =>
                    producto.nombre.toLowerCase().includes(this.terminoBusqueda.toLowerCase())
                );
            } else {
                this.productosFiltrados = [...this.productos];
            }
            this.buscando = false;
            this.mostrarSugerencias = false;
        }, 300);
    }

    limpiarBusqueda() {
        this.terminoBusqueda = '';
        this.productosFiltrados = [...this.productos];
        this.mostrarSugerencias = false;
    }

    seleccionarSugerencia(sugerencia: string) {
        this.terminoBusqueda = sugerencia;
        this.buscarProductos();
    }

    getStockDisponible(producto: Producto): number {
        if (!producto || !producto.id) return 0;
        // Mostrar stock REAL de la base de datos, no restar el carrito
        return producto.stock || 0;
    }

    getCantidadSeleccionada(producto: Producto): number {
        if (!producto || !producto.id) return 1;
        return this.cantidadesSeleccionadas.get(producto.id) || 1;
    }

    setCantidadSeleccionada(producto: Producto, cantidad: number): void {
        if (!producto || !producto.id) return;
        this.cantidadesSeleccionadas.set(producto.id, cantidad);
    }

    incrementarCantidad(producto: Producto): void {
        if (!producto) return;

        const cantidadActual = this.getCantidadSeleccionada(producto);
        const stockDisponible = this.getStockDisponible(producto);

        if (cantidadActual < stockDisponible) {
            this.setCantidadSeleccionada(producto, cantidadActual + 1);
        } else {
            this.mostrarError(`No puedes seleccionar más de ${stockDisponible} unidades. Stock disponible: ${stockDisponible}`);
        }
    }

    decrementarCantidad(producto: Producto): void {
        if (!producto) return;

        const cantidadActual = this.getCantidadSeleccionada(producto);
        if (cantidadActual > 1) {
            this.setCantidadSeleccionada(producto, cantidadActual - 1);
        }
    }

    onCantidadChange(producto: Producto, event: any): void {
        const nuevaCantidad = parseInt(event.target.value, 10);
        if (!isNaN(nuevaCantidad)) {
            const stockDisponible = this.getStockDisponible(producto);
            const cantidadFinal = Math.min(Math.max(1, nuevaCantidad), stockDisponible);
            this.setCantidadSeleccionada(producto, cantidadFinal);
        }
    }

    agregarAlCarrito(producto: Producto): void {
        if (!producto) return;

        if (!this.usuario) {
            this.mostrarError('Debes iniciar sesión para agregar productos al carrito');
            this.router.navigate(['/login']);
            return;
        }

        const cantidad = this.getCantidadSeleccionada(producto);
        const stockReal = producto.stock || 0; // Stock real de la BD

        console.log('🛒 Agregando al carrito - Usuario:', this.usuario.id, 'Producto:', producto.id, 'Cantidad:', cantidad, 'Stock real:', stockReal);

        if (cantidad > stockReal) {
            this.mostrarError(`No hay suficiente stock disponible. Stock: ${stockReal}`);
            return;
        }

        if (cantidad <= 0) {
            this.mostrarError('La cantidad debe ser mayor a 0');
            return;
        }

        if (!producto.activo) {
            this.mostrarError('Este producto no está disponible actualmente');
            return;
        }

        this.carritoService.agregarProducto(producto, cantidad).subscribe({
            next: (response) => {
                console.log('✅ Producto agregado al carrito - Respuesta:', response);
                this.setCantidadSeleccionada(producto, 1);
                this.mostrarExito(`${cantidad} ${producto.nombre} agregado(s) al carrito`);
            },
            error: (error) => {
                console.error('❌ Error al agregar al carrito:', error);
                let mensajeError = 'Error al agregar el producto al carrito';

                if (error.error && error.error.error) {
                    mensajeError = error.error.error;
                } else if (error.status === 400) {
                    mensajeError = 'Stock insuficiente';
                }

                this.mostrarError(mensajeError);
            }
        });
    }

    getStockText(stock: number): string {
        if (stock === 0) return 'Sin Stock';
        if (stock < 5) return `Poco Stock (${stock})`;
        return 'En Stock';
    }

    getStockBadgeClass(stock: number): string {
        if (stock === 0) return 'sin-stock';
        if (stock < 5) return 'poco-stock';
        return 'en-stock';
    }

    formatCurrency(value: any): string {
        const numero = typeof value === 'number' ? value : this.parsearPrecio(value);
        return `€${numero.toFixed(2)}`;
    }

    private mostrarError(mensaje: string): void {
        this.snackBar.open(mensaje, 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error']
        });
    }

    private mostrarExito(mensaje: string): void {
        this.snackBar.open(mensaje, 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-success']
        });
    }
}