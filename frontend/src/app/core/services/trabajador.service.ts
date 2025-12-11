import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { Trabajador, CrearTrabajadorRequest, ActualizarTrabajadorRequest } from '../../interfaces/trabajador.interface';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TrabajadorService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private apiUrl = `${environment.apiUrl}/trabajadores`;

    obtenerMisClientes(): Observable<any> {
        const token = this.authService.getToken();
        let headers = new HttpHeaders();
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }

        return this.http.get<any>(`${this.apiUrl}/mis-clientes`, { headers }).pipe(
            catchError(error => {
                console.error('❌ Error obteniendo clientes:', error);
                return throwError(() => new Error('No se pudieron cargar los clientes'));
            })
        );
    }

    obtenerHistorialCliente(clienteId: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/mis-clientes/${clienteId}/historial`);
    }

    obtenerTodosTrabajadores(): Observable<{ total: number, trabajadores: Trabajador[] }> {
        return this.http.get<{ total: number, trabajadores: Trabajador[] }>(this.apiUrl).pipe(
            catchError(error => {
                console.error('❌ Error obteniendo trabajadores:', error);
                return throwError(() => new Error('No se pudieron cargar los trabajadores'));
            })
        );
    }

    crearTrabajador(trabajadorData: CrearTrabajadorRequest): Observable<any> {
        return this.http.post(`${this.apiUrl}/admin`, trabajadorData).pipe(
            catchError(error => {
                console.error('❌ Error creando trabajador:', error);

                let errorMessage = 'No se pudo crear el trabajador';
                if (error.status === 400) {
                    errorMessage = error.error?.error || 'Datos inválidos';
                } else if (error.status === 500) {
                    errorMessage = 'Error interno del servidor';
                } else if (error.error?.error) {
                    errorMessage = error.error.error;
                }

                return throwError(() => new Error(errorMessage));
            })
        );
    }

    obtenerTrabajador(id: number): Observable<{ trabajador: Trabajador }> {
        return this.http.get<{ trabajador: Trabajador }>(`${this.apiUrl}/admin/${id}`).pipe(
            catchError(error => {
                console.error('❌ Error obteniendo trabajador:', error);

                let errorMessage = 'No se pudo cargar el trabajador';
                if (error.status === 404) {
                    errorMessage = 'Trabajador no encontrado';
                } else if (error.status === 500) {
                    errorMessage = 'Error interno del servidor';
                } else if (error.error?.error) {
                    errorMessage = error.error.error;
                }

                return throwError(() => new Error(errorMessage));
            })
        );
    }

    actualizarTrabajador(id: number, datos: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/admin/${id}`, datos).pipe(
            catchError(error => {
                console.error('❌ Error actualizando trabajador:', error);

                let errorMessage = 'No se pudo actualizar el trabajador';
                if (error.status === 401) {
                    errorMessage = 'Contraseña del administrador incorrecta';
                } else if (error.status === 403) {
                    errorMessage = error.error?.error || 'No tiene permisos para esta acción';
                } else if (error.status === 404) {
                    errorMessage = 'Trabajador no encontrado';
                } else if (error.status === 500) {
                    errorMessage = 'Error interno del servidor';
                } else if (error.error?.error) {
                    errorMessage = error.error.error;
                }

                return throwError(() => new Error(errorMessage));
            })
        );
    }

    eliminarTrabajador(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/admin/${id}`).pipe(
            catchError(error => {
                console.error('❌ Error eliminando trabajador:', error);

                let errorMessage = 'No se pudo eliminar el trabajador';
                if (error.status === 404) {
                    errorMessage = 'Trabajador no encontrado';
                } else if (error.status === 500) {
                    errorMessage = 'Error interno del servidor';
                } else if (error.error?.error) {
                    errorMessage = error.error.error;
                }

                return throwError(() => new Error(errorMessage));
            })
        );
    }

    // Verificar si un usuario tiene perfil de trabajador
    verificarTienePerfilTrabajador(usuarioId: number): Observable<boolean> {
        return this.http.get<any>(`${this.apiUrl}/verificar-perfil/${usuarioId}`).pipe(
            map(response => {
                const tienePerfil = response.tienePerfil || false;
                console.log(`🔍 [SERVICIO] Usuario ${usuarioId} ${tienePerfil ? 'TIENE' : 'NO TIENE'} perfil de trabajador`);
                return tienePerfil;
            }),
            catchError(error => {
                console.error('❌ Error al verificar perfil de trabajador:', error);
                // En caso de error, asumimos que no tiene perfil
                return of(false);
            })
        );
    }

    // Método existente para obtener trabajador por ID de usuario
    obtenerPorUsuarioId(usuarioId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/por-usuario/${usuarioId}`).pipe(
            catchError(error => {
                console.error('Error obteniendo trabajador por usuarioId:', error);
                return of(null); // Devuelve null si hay error
            })
        );
    }
}