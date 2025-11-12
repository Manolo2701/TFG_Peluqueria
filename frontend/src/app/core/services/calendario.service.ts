// frontend/src/app/core/services/calendario.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import type { Ausencia } from '../../interfaces/calendario.interface'; // Cambio aquí

@Injectable({
    providedIn: 'root'
})
export class CalendarioService {
    private apiUrl = 'http://localhost:3000/api';

    constructor(private http: HttpClient) { }

    // Obtener ausencias del trabajador actual
    getMisAusencias(): Observable<any> {
        return this.http.get(`${this.apiUrl}/calendario/mis-ausencias`).pipe(
            catchError(error => {
                console.error('Error al cargar mis ausencias:', error);
                return of({ ausencias: [] });
            })
        );
    }

    // Obtener todas las ausencias (admin)
    getTodasAusencias(): Observable<Ausencia[]> {
        console.log('🔄 Solicitando todas las ausencias...');
        return this.http.get<Ausencia[]>(`${this.apiUrl}/calendario/ausencias`).pipe(
            tap(response => console.log('✅ Respuesta todas las ausencias:', response)),
            catchError(error => {
                console.error('❌ Error al cargar todas las ausencias:', error);
                // Mostrar más detalles del error
                if (error.status === 401) {
                    console.error('Error 401: No autorizado - Token inválido o expirado');
                } else if (error.status === 403) {
                    console.error('Error 403: Prohibido - Sin permisos de administrador');
                }
                return of([]);
            })
        );
    }

    // Solicitar ausencia
    solicitarAusencia(ausencia: Omit<Ausencia, 'id' | 'estado'>): Observable<any> {
        return this.http.post(`${this.apiUrl}/calendario/solicitar-ausencia`, ausencia);
    }

    // Gestionar ausencia (admin)
    gestionarAusencia(id: number, estado: 'aprobada' | 'rechazada'): Observable<any> {
        return this.http.put(`${this.apiUrl}/calendario/ausencias/${id}/gestionar`, { estado });
    }

}