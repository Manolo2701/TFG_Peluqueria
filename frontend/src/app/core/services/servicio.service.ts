import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { Servicio } from '../../interfaces/servicio.interface';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ServicioService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

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

    crearServicio(servicioData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/servicios`, servicioData).pipe(
            catchError(error => {
                console.error('Error creando servicio:', error);
                throw error;
            })
        );
    }

    actualizarServicio(id: number, servicioData: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/servicios/${id}`, servicioData).pipe(
            catchError(error => {
                console.error('Error actualizando servicio:', error);
                throw error;
            })
        );
    }

    eliminarServicio(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/servicios/${id}`).pipe(
            catchError(error => {
                console.error('Error eliminando servicio:', error);
                throw error;
            })
        );
    }
}