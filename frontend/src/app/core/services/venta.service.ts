// frontend/src/app/core/services/venta.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    private apiUrl = 'http://localhost:3000/api';

    constructor(private http: HttpClient) { }

    getMisVentas(): Observable<Venta[]> {
        return this.http.get<Venta[]>(`${this.apiUrl}/ventas/mis-ventas`);
    }

    procesarVenta(ventaData: any): Observable<Venta> {
        return this.http.post<Venta>(`${this.apiUrl}/ventas/procesar`, ventaData);
    }

    // Métodos del carrito
    agregarAlCarrito(productoData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/ventas/carrito/agregar`, productoData);
    }

    obtenerCarrito(): Observable<any> {
        return this.http.get(`${this.apiUrl}/ventas/carrito`);
    }

    vaciarCarrito(): Observable<any> {
        return this.http.delete(`${this.apiUrl}/ventas/carrito/vaciar`);
    }
}