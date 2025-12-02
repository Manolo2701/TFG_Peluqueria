import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Reserva {
    id: number;
    cliente_id: number;
    servicio_id: number;
    trabajador_id?: number;
    fecha_reserva: string;
    hora_inicio: string;
    duracion: number;
    estado: string;
    precio_total: number;
    notas_internas?: string;
    fecha_creacion: string;
    motivo_cancelacion?: string;
    politica_cancelacion?: string;
    fecha_cancelacion?: string;
    penalizacion_aplicada?: number;
    cliente_nombre?: string;
    cliente_apellidos?: string;
    servicio_nombre?: string;
    trabajador_nombre?: string;
    trabajador_apellidos?: string;
    precio?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ReservaService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getReservas(): Observable<Reserva[]> {
        return this.http.get<any>(`${this.apiUrl}/reservas`).pipe(
            map(response => {
                console.log('📦 Respuesta completa del backend:', response);

                if (response && response.reservas && Array.isArray(response.reservas)) {
                    console.log(`✅ Extrayendo ${response.reservas.length} reservas del objeto de respuesta`);
                    return response.reservas;
                } else if (Array.isArray(response)) {
                    console.log(`✅ Respuesta es directamente un array de ${response.length} reservas`);
                    return response;
                } else {
                    console.warn('⚠️ Estructura de respuesta inesperada:', response);
                    return [];
                }
            }),
            catchError(error => {
                console.error('❌ Error al cargar reservas:', {
                    status: error.status,
                    message: error.message,
                    url: `${this.apiUrl}/reservas`
                });

                if (error.status === 401) {
                    console.error('🔐 Error 401: No autorizado - Token inválido o faltante');
                }

                return of([]);
            })
        );
    }

    getMisReservas(): Observable<Reserva[]> {
        return this.http.get<Reserva[]>(`${this.apiUrl}/reservas/mis-reservas`).pipe(
            catchError(error => {
                console.error('Error al cargar mis reservas:', error);
                return of([]);
            })
        );
    }

    getReserva(id: number): Observable<Reserva> {
        return this.http.get<Reserva>(`${this.apiUrl}/reservas/${id}`);
    }

    crearReserva(reservaData: any): Observable<any> {
        console.log('📤 Enviando datos al backend:', reservaData);
        return this.http.post(`${this.apiUrl}/reservas/crear`, reservaData).pipe(
            catchError(error => {
                console.error('Error creando reserva:', error);
                return throwError(() => error);
            })
        );
    }

    actualizarReserva(id: number, cambios: Partial<Reserva>): Observable<Reserva> {
        return this.http.put<Reserva>(`${this.apiUrl}/reservas/${id}`, cambios);
    }

    getNotasInternas(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/reservas/${id}/notas-internas`);
    }

    actualizarNotasInternas(id: number, notas: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/reservas/${id}/notas-internas`, { notas });
    }

    getReservasTrabajador(): Observable<Reserva[]> {
        console.log('🔄 [SERVICIO] Obteniendo reservas para trabajador...');

        return this.http.get<any>(`${this.apiUrl}/trabajadores/mis-reservas`).pipe(
            map((response: any) => {
                console.log('📦 Respuesta completa del backend:', response);

                let reservas: any[] = [];

                if (Array.isArray(response)) {
                    reservas = response;
                } else if (response && Array.isArray(response.reservas)) {
                    reservas = response.reservas;
                } else if (response && response.data) {
                    reservas = Array.isArray(response.data) ? response.data : [response.data];
                } else {
                    console.warn('⚠️ Estructura de respuesta inesperada:', response);
                    reservas = [];
                }

                console.log(`✅ [SERVICIO] ${reservas.length} reservas procesadas para trabajador`);

                reservas.forEach((reserva, index) => {
                    if (reserva.estado === 'cancelada') {
                        console.log(`🔍 [SERVICIO] Reserva cancelada ${reserva.id}:`, {
                            motivo_cancelacion: reserva.motivo_cancelacion,
                            politica_cancelacion: reserva.politica_cancelacion,
                            fecha_cancelacion: reserva.fecha_cancelacion,
                            penalizacion_aplicada: reserva.penalizacion_aplicada
                        });
                    }
                });

                return reservas as Reserva[];
            }),
            tap((reservas: Reserva[]) => {
                if (reservas && reservas.length > 0) {
                    console.log('📋 [SERVICIO] Primera reserva:', {
                        id: reservas[0].id,
                        cliente: `${reservas[0].cliente_nombre} ${reservas[0].cliente_apellidos}`,
                        servicio: reservas[0].servicio_nombre,
                        estado: reservas[0].estado,
                        fecha: reservas[0].fecha_reserva,
                        hora: reservas[0].hora_inicio,
                        motivo_cancelacion: reservas[0].motivo_cancelacion
                    });
                }
            }),
            catchError((error: any) => {
                console.error('❌ [SERVICIO] Error obteniendo reservas de trabajador:', error);

                if (error.status === 403) {
                    console.error('🔐 Error 403: No tienes permisos de trabajador');
                    return throwError(() => new Error('No estás registrado como trabajador'));
                } else if (error.status === 401) {
                    console.error('🔐 Error 401: No autorizado');
                    return throwError(() => new Error('Debes iniciar sesión'));
                } else {
                    return throwError(() => new Error('Error al cargar tus reservas'));
                }
            })
        );
    }

    aceptarReserva(id: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/trabajadores/reservas/${id}/aceptar`, {}).pipe(
            catchError(error => {
                console.error('Error al aceptar reserva:', error);
                throw error;
            })
        );
    }

    rechazarReserva(id: number, motivo: string): Observable<any> {
        const body = { motivo };
        return this.http.put(`${this.apiUrl}/trabajadores/reservas/${id}/rechazar`, body).pipe(
            catchError(error => {
                console.error('Error al rechazar reserva:', error);
                throw error;
            })
        );
    }

    getTrabajadoresDisponibles(servicioId: number, fecha: string, hora: string): Observable<any> {
        const params = {
            servicio_id: servicioId.toString(),
            fecha: fecha,
            hora: hora
        };

        return this.http.get(`${this.apiUrl}/reservas/trabajadores-disponibles`, { params }).pipe(
            catchError(error => {
                if (error.status === 409) {
                    console.log('ℹ️ Info: Usuario ya tiene reserva en ese horario - Comportamiento esperado');
                    return of(error.error);
                } else {
                    console.error('❌ Error real al cargar trabajadores disponibles:', error);
                    return throwError(() => error);
                }
            })
        );
    }

    cancelarReserva(id: number, motivo: string, politica: string): Observable<any> {
        console.log('⚠️ Sistema de políticas de cancelación en desarrollo - Próximamente disponible');

        return this.http.put(`${this.apiUrl}/cancelacion/${id}/cancelar`, {
            motivo,
            politica
        }).pipe(
            tap(response => {
                console.log('✅ Reserva cancelada - Sistema de penalizaciones en desarrollo');
            }),
            catchError(error => {
                console.error('Error cancelando reserva:', error);
                return throwError(() => error);
            })
        );
    }

    getPoliticasCancelacion(): Observable<any> {
        return this.http.get(`${this.apiUrl}/cancelacion/politicas`).pipe(
            catchError(error => {
                console.error('Error obteniendo políticas de cancelación:', error);
                return throwError(() => error);
            })
        );
    }

    monitorearServicioAutomatico(): Observable<any> {
        return this.http.get(`${this.apiUrl}/reservas/estado-automatico`).pipe(
            catchError(error => {
                console.error('Error monitoreando servicio automático:', error);
                return of({ servicioActivo: false, error: error.message });
            })
        );
    }
}