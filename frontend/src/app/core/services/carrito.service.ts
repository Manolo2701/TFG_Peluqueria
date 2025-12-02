import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { CarritoItem, Producto } from '../../interfaces/producto.interface';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CarritoService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private apiUrl = `${environment.apiUrl}/ventas`;

    private carritoItems: CarritoItem[] = [];
    private carritoSubject = new BehaviorSubject<CarritoItem[]>([]);
    private usuarioActualId: number | null = null;

    constructor() {
        this.authService.usuarioActual$.subscribe(usuario => {
            if (usuario && usuario.id !== this.usuarioActualId) {
                console.log('🔄 Cambio de usuario detectado, reiniciando carrito...');
                this.usuarioActualId = usuario.id;
                this.cargarCarritoDesdeBackend();
            } else if (!usuario) {
                console.log('🚪 Usuario cerró sesión, limpiando carrito...');
                this.usuarioActualId = null;
                this.carritoItems = [];
                this.actualizarCarritoSubject();
            }
        });
    }

    private getAuthHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });
    }

    private cargarCarritoDesdeBackend(): void {
        if (!this.usuarioActualId) {
            console.log('❌ No hay usuario autenticado, no se puede cargar carrito');
            this.carritoItems = [];
            this.actualizarCarritoSubject();
            return;
        }

        console.log('🔄 Cargando carrito para usuario:', this.usuarioActualId);

        this.obtenerCarritoBackend().subscribe({
            next: (response: any) => {
                console.log('✅ Carrito cargado desde backend:', response);
                this.carritoItems = response.carrito || [];
                this.actualizarCarritoSubject();
            },
            error: (error) => {
                console.error('❌ Error cargando carrito desde backend:', error);
                this.carritoItems = [];
                this.actualizarCarritoSubject();
            }
        });
    }

    obtenerCarritoBackend(): Observable<any> {
        return this.http.get(`${this.apiUrl}/carrito`, { headers: this.getAuthHeaders() }).pipe(
            map((response: any) => {
                console.log('🛒 Respuesta completa del carrito:', response);

                if (response.carrito && Array.isArray(response.carrito)) {
                    const carritoMapeado = response.carrito.map((item: any) => {
                        console.log('📦 Item del carrito:', item);

                        const producto = item.producto ? {
                            id: item.producto.id || item.producto_id,
                            nombre: item.producto.nombre || 'Producto sin nombre',
                            precio: this.parsearPrecio(item.producto.precio),
                            stock: this.parsearStock(item.producto.stock),
                            activo: item.producto.activo !== undefined ? item.producto.activo : true
                        } : {
                            id: item.producto_id,
                            nombre: 'Producto no disponible',
                            precio: 0,
                            stock: 0,
                            activo: false
                        };

                        return {
                            producto_id: item.producto_id,
                            cantidad: item.cantidad || 0,
                            producto: producto,
                            subtotal: item.subtotal || (producto.precio * (item.cantidad || 0))
                        };
                    });

                    console.log('✅ Carrito mapeado:', carritoMapeado);
                    return {
                        ...response,
                        carrito: carritoMapeado
                    };
                }

                console.warn('⚠️ Carrito vacío o estructura inesperada:', response);
                return { carrito: [] };
            }),
            catchError(error => {
                console.error('❌ Error al obtener carrito:', error);
                return of({ carrito: [] });
            })
        );
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

    agregarProducto(producto: Producto, cantidad: number): Observable<any> {
        console.log('➕ Agregando producto al carrito:', {
            usuario: this.usuarioActualId,
            producto_id: producto.id,
            cantidad
        });

        const payload = {
            producto_id: producto.id,
            cantidad: cantidad
        };

        return this.http.post(
            `${this.apiUrl}/carrito/agregar`,
            payload,
            { headers: this.getAuthHeaders() }
        ).pipe(
            tap((response: any) => {
                console.log('✅ Respuesta agregar producto:', response);
                this.cargarCarritoDesdeBackend();
            })
        );
    }

    getItems(): CarritoItem[] {
        return this.carritoItems;
    }

    getCarritoObservable(): Observable<CarritoItem[]> {
        return this.carritoSubject.asObservable();
    }

    getCantidadTotal(): number {
        return this.carritoItems.reduce((total, item) => total + item.cantidad, 0);
    }

    getCantidadProducto(productoId: number): number {
        const item = this.carritoItems.find(item => item.producto_id === productoId);
        return item ? item.cantidad : 0;
    }

    actualizarCantidad(productoId: number, cantidad: number): Observable<any> {
        console.log('🔄 Actualizando cantidad en servicio:', { productoId, cantidad });

        const payload = {
            producto_id: productoId,
            cantidad: cantidad
        };

        return this.http.put(
            `${this.apiUrl}/carrito/actualizar`,
            payload,
            { headers: this.getAuthHeaders() }
        ).pipe(
            tap((response: any) => {
                console.log('✅ Respuesta actualización cantidad:', response);
                this.cargarCarritoDesdeBackend();
            })
        );
    }

    eliminarProducto(productoId: number): Observable<any> {
        console.log('🗑️ Eliminando producto del carrito:', productoId);

        return this.vaciarCarrito().pipe(
            tap(() => {
                const nuevosItems = this.carritoItems.filter(item => item.producto_id !== productoId);
                this.carritoItems = nuevosItems;
                this.actualizarCarritoSubject();

                if (nuevosItems.length > 0) {
                    console.log('🔄 Reconstruyendo carrito sin el producto eliminado...');
                    nuevosItems.forEach(item => {
                        if (item.producto) {
                            this.agregarProducto(item.producto, item.cantidad).subscribe();
                        }
                    });
                }
            })
        );
    }

    vaciarCarrito(): Observable<any> {
        console.log('🗑️ Vaciando carrito para usuario:', this.usuarioActualId);

        return this.http.delete(
            `${this.apiUrl}/carrito/vaciar`,
            { headers: this.getAuthHeaders() }
        ).pipe(
            tap(() => {
                console.log('✅ Carrito vaciado en servidor');
                this.carritoItems = [];
                this.actualizarCarritoSubject();
            }),
            catchError(error => {
                console.error('❌ Error vaciando carrito:', error);
                this.carritoItems = [];
                this.actualizarCarritoSubject();
                return of({ success: false, error: error.message });
            })
        );
    }

    getTotal(): number {
        return this.carritoItems.reduce((total, item) => total + (item.subtotal || 0), 0);
    }

    verificarStock(): Observable<any> {
        return this.http.get(
            `${this.apiUrl}/carrito/verificar-stock`,
            { headers: this.getAuthHeaders() }
        );
    }

    procesarVenta(datosVenta: any): Observable<any> {
        console.log('💰 Enviando datos de venta:', datosVenta);

        return this.http.post(
            `${this.apiUrl}/procesar`,
            {},
            { headers: this.getAuthHeaders() }
        ).pipe(
            tap((response: any) => {
                console.log('✅ Venta procesada, limpiando carrito local');
                this.carritoItems = [];
                this.actualizarCarritoSubject();
            })
        );
    }

    forzarRecarga(): void {
        this.cargarCarritoDesdeBackend();
    }

    private actualizarCarritoSubject(): void {
        console.log('🔄 Actualizando subject del carrito:', this.carritoItems.length, 'items');
        this.carritoSubject.next([...this.carritoItems]);
    }

    crearOrdenPaypal(datosVenta: any): Observable<any> {
        console.log('💰 Creando orden de PayPal:', datosVenta);

        return this.http.post(
            `${environment.apiUrl}/paypal/crear-orden`,
            datosVenta,
            { headers: this.getAuthHeaders() }
        );
    }

    capturarPagoPaypal(orderID: string): Observable<any> {
        console.log('💰 Capturando pago PayPal:', orderID);

        return this.http.post(
            `${environment.apiUrl}/paypal/capturar-pago`,
            { orderID },
            { headers: this.getAuthHeaders() }
        );
    }
}