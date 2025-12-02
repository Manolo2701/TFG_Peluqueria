import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import type { Ausencia } from '../../interfaces/calendario.interface';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CalendarioService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getMisAusencias(): Observable<any> {
        return this.http.get(`${this.apiUrl}/calendario/mis-ausencias`).pipe(
            catchError(error => {
                console.error('Error al cargar mis ausencias:', error);
                return of({ ausencias: [] });
            })
        );
    }

    getTodasAusencias(): Observable<Ausencia[]> {
        console.log('🔄 Solicitando todas las ausencias...');
        return this.http.get<{ ausencias: Ausencia[] }>(`${this.apiUrl}/calendario/ausencias`).pipe(
            tap(response => console.log('✅ Respuesta todas las ausencias:', response)),
            map(response => response.ausencias || []),
            catchError(error => {
                console.error('❌ Error al cargar todas las ausencias:', error);
                if (error.status === 401) {
                    console.error('Error 401: No autorizado - Token inválido o expirado');
                } else if (error.status === 403) {
                    console.error('Error 403: Prohibido - Sin permisos de administrador');
                }
                return of([]);
            })
        );
    }

    solicitarAusencia(ausencia: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/calendario/solicitar-ausencia`, ausencia);
    }

    gestionarAusencia(id: number, estado: 'aprobado' | 'rechazado'): Observable<any> {
        console.log(`🔄 Enviando solicitud para ${estado} ausencia ID: ${id}`);
        return this.http.put(`${this.apiUrl}/calendario/ausencias/${id}/gestionar`, { estado });
    }
}