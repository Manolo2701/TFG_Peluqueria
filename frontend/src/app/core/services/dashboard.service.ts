// frontend/src/app/core/services/dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { AuthService } from './auth.service';
import { DashboardStats } from '../../interfaces/dashboard.interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:3000/api/dashboard';

  getEstadisticas(): Observable<DashboardStats> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    console.log('🔄 Solicitando estadísticas generales...');

    return this.http.get<any>(`${this.apiUrl}/estadisticas`, { headers }).pipe(
      map(response => {
        console.log('📊 Respuesta completa del backend:', response);
        return response.data;
      }),
      catchError(error => {
        console.error('❌ Error en DashboardService:', error);
        return throwError(() => new Error('No se pudieron cargar las estadísticas del dashboard'));
      })
    );
  }

  getEstadisticasTrabajador(): Observable<DashboardStats> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    console.log('🔄 Solicitando estadísticas de trabajador...');

    return this.http.get<any>(`${this.apiUrl}/estadisticas-trabajador`, { headers }).pipe(
      map(response => {
        console.log('📊 Respuesta vista trabajador:', response);
        return response.data;
      }),
      catchError(error => {
        console.error('❌ Error en DashboardService (vista trabajador):', error);
        return throwError(() => new Error('No se pudieron cargar las estadísticas de trabajador'));
      })
    );
  }

  // Nuevos métodos para acciones rápidas
  crearReservaRapida(datosReserva: any): Observable<any> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json');
    }

    return this.http.post<any>(`http://localhost:3000/api/reservas`, datosReserva, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error creando reserva rápida:', error);
        return throwError(() => new Error('No se pudo crear la reserva'));
      })
    );
  }

  obtenerServiciosDisponibles(): Observable<any> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.get<any>(`http://localhost:3000/api/servicios`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error obteniendo servicios:', error);
        return throwError(() => new Error('No se pudieron cargar los servicios'));
      })
    );
  }

  obtenerTrabajadoresDisponibles(): Observable<any> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.get<any>(`http://localhost:3000/api/trabajadores`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error obteniendo trabajadores:', error);
        return throwError(() => new Error('No se pudieron cargar los trabajadores'));
      })
    );
  }
}