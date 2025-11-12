import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

// EN reserva.service.ts - ACTUALIZA la interfaz Reserva:
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

    cliente_nombre?: string;
    cliente_apellidos?: string;
    servicio_nombre?: string;
    trabajador_nombre?: string;  // ✅ Este campo debe venir del backend
    trabajador_apellidos?: string; // ✅ Nuevo campo
    precio?: number;
    politica_cancelacion?: string;
    fecha_cancelacion?: string;
    motivo_cancelacion?: string;
    penalizacion_aplicada?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ReservaService {
    [x: string]: any;
    private apiUrl = 'http://localhost:3000/api';

    constructor(private http: HttpClient) { }

    // EN reserva.service.ts - ACTUALIZA solo el método getReservas():
    getReservas(): Observable<Reserva[]> {
        return this.http.get<any>(`${this.apiUrl}/reservas`).pipe(
            map(response => {
                console.log('📦 Respuesta completa del backend:', response);

                // ✅ EXTRAER el array de reservas del objeto de respuesta
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

    // Obtener mis reservas (para usuarios normales)
    getMisReservas(): Observable<Reserva[]> {
        return this.http.get<Reserva[]>(`${this.apiUrl}/reservas/mis-reservas`).pipe(
            catchError(error => {
                console.error('Error al cargar mis reservas:', error);
                return of([]);
            })
        );
    }

    // Obtener una reserva específica
    getReserva(id: number): Observable<Reserva> {
        return this.http.get<Reserva>(`${this.apiUrl}/reservas/${id}`);
    }

    // Crear nueva reserva
    crearReserva(reservaData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/reservas/crear`, reservaData).pipe(
            catchError(error => {
                console.error('Error creando reserva:', error);
                return throwError(() => error);
            })
        );
    }

    // Actualizar reserva
    actualizarReserva(id: number, cambios: Partial<Reserva>): Observable<Reserva> {
        return this.http.put<Reserva>(`${this.apiUrl}/reservas/${id}`, cambios);
    }

    // Obtener notas internas
    getNotasInternas(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/reservas/${id}/notas-internas`);
    }

    // Actualizar notas internas
    actualizarNotasInternas(id: number, notas: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/reservas/${id}/notas-internas`, { notas });
    }

    // Métodos específicos para trabajadores
    getReservasTrabajador(): Observable<Reserva[]> {
        console.log('🔄 [SERVICIO] Obteniendo reservas para trabajador...');

        return this.http.get<any>(`${this.apiUrl}/trabajadores/mis-reservas`).pipe(
            map((response: any) => {
                // Manejar diferentes formatos de respuesta
                let reservas: any[] = [];

                if (Array.isArray(response)) {
                    reservas = response;
                } else if (response && Array.isArray(response.reservas)) {
                    reservas = response.reservas;
                } else if (response && response.data) {
                    reservas = Array.isArray(response.data) ? response.data : [response.data];
                }

                console.log('✅ [SERVICIO] Reservas de trabajador procesadas:', reservas);
                return reservas as Reserva[];
            }),
            tap((reservas: Reserva[]) => {
                if (reservas && reservas.length > 0) {
                    console.log('📋 [SERVICIO] Estructura de la primera reserva:', JSON.stringify(reservas[0], null, 2));
                }
            }),
            catchError((error: any) => {
                console.error('❌ [SERVICIO] Error obteniendo reservas de trabajador:', error);
                return throwError(() => error);
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

    rechazarReserva(id: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/trabajadores/reservas/${id}/rechazar`, {}).pipe(
            catchError(error => {
                console.error('Error al rechazar reserva:', error);
                throw error;
            })
        );
    }

    // En reserva.service.ts
    getTrabajadoresDisponibles(servicioId: number, fecha: string, hora: string): Observable<any> {
        const params = {
            servicio_id: servicioId.toString(),
            fecha: fecha,
            hora: hora
        };

        return this.http.get(`${this.apiUrl}/reservas/trabajadores-disponibles`, { params });
    }
}