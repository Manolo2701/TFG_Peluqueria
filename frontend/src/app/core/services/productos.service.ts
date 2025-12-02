import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Producto } from '../../interfaces/producto.interface';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ProductosService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    getProductos(): Observable<Producto[]> {
        return this.http.get<any>(`${this.apiUrl}/productos`).pipe(
            map(response => {
                console.log('Respuesta completa de productos:', response);

                let productosArray: any[] = [];

                if (Array.isArray(response)) {
                    productosArray = response;
                } else if (response && Array.isArray(response.productos)) {
                    productosArray = response.productos;
                } else if (response && Array.isArray(response.data)) {
                    productosArray = response.data;
                } else {
                    console.warn('Estructura de respuesta no reconocida:', response);
                    productosArray = [];
                }

                return productosArray.map((producto: any) => ({
                    id: producto.id,
                    nombre: producto.nombre || 'Producto sin nombre',
                    precio: this.parsearPrecio(producto.precio),
                    stock: this.parsearStock(producto.stock),
                    activo: producto.activo !== undefined ? producto.activo : true
                }));
            }),
            catchError(error => {
                console.error('Error al obtener productos:', error);
                return of([]);
            })
        );
    }

    getProducto(id: number): Observable<Producto> {
        return this.http.get<any>(`${this.apiUrl}/productos/${id}`).pipe(
            map(producto => ({
                id: producto.id,
                nombre: producto.nombre || 'Producto sin nombre',
                precio: this.parsearPrecio(producto.precio),
                stock: this.parsearStock(producto.stock),
                activo: producto.activo !== undefined ? producto.activo : true
            })),
            catchError(error => {
                console.error('Error al obtener producto:', error);
                throw error;
            })
        );
    }

    buscarProductos(termino: string): Observable<Producto[]> {
        return this.http.get<Producto[]>(`${this.apiUrl}/busqueda/productos`, {
            params: { q: termino }
        }).pipe(
            catchError(error => {
                console.error('Error al buscar productos:', error);
                return of([]);
            })
        );
    }

    getProductosPorCategoria(categoria: string): Observable<Producto[]> {
        return this.http.get<Producto[]>(`${this.apiUrl}/productos/categoria/${categoria}`).pipe(
            catchError(error => {
                console.error('Error al obtener productos por categoría:', error);
                return of([]);
            })
        );
    }

    crearProducto(productoData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/productos`, productoData).pipe(
            catchError(error => {
                console.error('Error creando producto:', error);
                throw error;
            })
        );
    }

    actualizarProducto(id: number, productoData: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/productos/${id}`, productoData).pipe(
            catchError(error => {
                console.error('Error actualizando producto:', error);
                throw error;
            })
        );
    }

    eliminarProducto(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/productos/${id}`).pipe(
            catchError(error => {
                console.error('Error eliminando producto:', error);
                throw error;
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
}