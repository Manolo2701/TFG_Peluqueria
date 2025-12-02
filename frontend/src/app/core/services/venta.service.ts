import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto, CarritoItem } from '../../interfaces/producto.interface';
import { environment } from '../../../environments/environment';

export interface Venta {
    id: number;
    id_usuario: number;
    total: number;
    estado: string;
    metodo_pago: string;
    created_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class VentaService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    obtenerProductos(): Observable<{ productos: Producto[] }> {
        return this.http.get<{ productos: Producto[] }>(`${this.apiUrl}/ventas/productos`);
    }

    obtenerProducto(id: number): Observable<Producto> {
        return this.http.get<Producto>(`${this.apiUrl}/ventas/productos/${id}`);
    }

    agregarAlCarrito(productoData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/ventas/carrito/agregar`, productoData);
    }

    obtenerCarrito(): Observable<CarritoItem[]> {
        return this.http.get<CarritoItem[]>(`${this.apiUrl}/ventas/carrito`);
    }

    vaciarCarrito(): Observable<any> {
        return this.http.delete(`${this.apiUrl}/ventas/carrito/vaciar`);
    }

    getMisVentas(): Observable<Venta[]> {
        return this.http.get<Venta[]>(`${this.apiUrl}/ventas/mis-ventas`);
    }

    procesarVenta(ventaData: any): Observable<Venta> {
        return this.http.post<Venta>(`${this.apiUrl}/ventas/procesar`, ventaData);
    }

    obtenerVentaPorId(ventaId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${ventaId}`);
    }

    obtenerVentaPorTransaccion(transaccionId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/transaccion/${transaccionId}`);
    }
}