import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface Producto {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    categoria: string;
    imagen_url?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Cliente {
    id: number;
    email: string;
    nombre: string;
    apellidos: string;
    telefono: string;
    direccion: string;
    rol: string;
    fecha_registro: string;
}

export interface ActualizarPerfilRequest {
    nombre?: string;
    apellidos?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    currentPassword?: string;
    newPassword?: string;
}

export interface PerfilResponse {
    id: number;
    email: string;
    nombre: string;
    apellidos: string;
    telefono: string;
    direccion: string;
    rol: string;
    fecha_registro: string;
}

@Injectable({
    providedIn: 'root'
})
export class UsuarioService {
    private apiUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    obtenerClientes(): Observable<{ total: number, clientes: Cliente[] }> {
        return this.http.get<{ total: number, clientes: Cliente[] }>(`${this.apiUrl}/usuarios/clientes`).pipe(
            catchError(error => {
                console.error('Error al obtener clientes:', error);
                return of({ total: 0, clientes: [] });
            })
        );
    }

    obtenerPerfil(): Observable<any> {
        return this.http.get(`${this.apiUrl}/usuarios/perfil`).pipe(
            catchError(error => {
                console.error('Error al obtener perfil:', error);
                throw error;
            })
        );
    }

    obtenerPerfilCompleto(): Observable<PerfilResponse> {
        return this.http.get<any>(`${this.apiUrl}/usuarios/perfil`).pipe(
            map((response: any) => {
                // El backend devuelve { mensaje: string, usuario: PerfilResponse }
                return response.usuario || response;
            }),
            catchError(error => {
                console.error('Error al obtener perfil:', error);
                throw error;
            })
        );
    }

    actualizarPerfil(datos: ActualizarPerfilRequest): Observable<any> {
        return this.http.put(`${this.apiUrl}/usuarios/perfil`, datos).pipe(
            catchError(error => {
                console.error('Error al actualizar perfil:', error);
                throw error;
            })
        );
    }

    obtenerUsuarios(): Observable<any> {
        return this.http.get(`${this.apiUrl}/usuarios/`).pipe(
            catchError(error => {
                console.error('Error al obtener usuarios:', error);
                return of({ total: 0, usuarios: [] });
            })
        );
    }

    obtenerUsuario(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/usuarios/${id}`).pipe(
            catchError(error => {
                console.error('Error al obtener usuario:', error);
                throw error;
            })
        );
    }

    getProductos(): Observable<Producto[]> {
        return this.http.get<any>(`${this.apiUrl}/productos`).pipe(
            map(response => {
                let productos: any[] = [];

                if (Array.isArray(response)) {
                    productos = response;
                } else if (response && Array.isArray((response as any).data)) {
                    productos = (response as any).data;
                } else if (response && Array.isArray((response as any).productos)) {
                    productos = (response as any).productos;
                } else {
                    console.warn('La respuesta no es un array:', response);
                    productos = [];
                }

                return productos.map(producto => ({
                    ...producto,
                    precio: this.parsearPrecio(producto.precio),
                    stock: this.parsearStock(producto.stock)
                }));
            }),
            catchError(error => {
                console.error('Error al obtener productos:', error);
                return of([]);
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

    getProducto(id: number): Observable<Producto> {
        return this.http.get<Producto>(`${this.apiUrl}/productos/${id}`).pipe(
            catchError(error => {
                console.error('Error al obtener producto:', error);
                throw error;
            })
        );
    }

    buscarProductos(termino: string): Observable<Producto[]> {
        return this.http.get<Producto[]>(`${this.apiUrl}/productos/buscar`, {
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

    // Método para verificar si puede acceder al perfil - CORREGIDO
    puedeAccederAlPerfil(): boolean {
        const usuario = this.authService.usuarioActualValue;
        if (!usuario) {
            return false;
        }
        return usuario.rol === 'cliente' || usuario.rol === 'administrador';
    }
}