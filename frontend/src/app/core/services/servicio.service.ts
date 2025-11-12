import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';

export interface Servicio {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    duracion: number;
    categoria: string;
    activo: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ServicioService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:3000/api';

    getServicios(): Observable<Servicio[]> {
        return this.http.get<any>(`${this.apiUrl}/servicios`).pipe(
            map(response => {
                console.log('🔍 Respuesta completa del backend:', response);

                if (response && Array.isArray(response.servicios)) {
                    console.log('✅ Servicios encontrados:', response.servicios.length);
                    return response.servicios;
                }
                else if (Array.isArray(response)) {
                    console.log('⚠️  Respuesta directa (array):', response.length);
                    return response;
                }
                else {
                    console.warn('❌ Formato de respuesta inesperado');
                    return [];
                }
            }),
            catchError(error => {
                console.error('❌ Error en getServicios:', error);
                return of([]);
            })
        );
    }

    buscarServicios(termino: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/busqueda/servicios?q=${encodeURIComponent(termino)}`).pipe(
            map((response: any) => {
                return response.servicios || response || [];
            }),
            catchError(error => {
                console.error('Error en búsqueda de servicios:', error);
                return of([]);
            })
        );
    }

    obtenerSugerencias(termino: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/busqueda/sugerencias?q=${encodeURIComponent(termino)}`).pipe(
            map((response: any) => {
                return response.sugerencias || [];
            }),
            catchError(error => {
                console.error('Error al obtener sugerencias:', error);
                return of([]);
            })
        );
    }

    getServiciosPorCategoria(categoria: string): Observable<Servicio[]> {
        return this.http.get<any>(`${this.apiUrl}/servicios/categoria/${categoria}`).pipe(
            map(response => {
                if (response && Array.isArray(response.servicios)) {
                    return response.servicios;
                } else if (Array.isArray(response)) {
                    return response;
                } else {
                    return [];
                }
            }),
            catchError(error => {
                console.error('Error cargando servicios por categoría:', error);
                return of([]);
            })
        );
    }
}