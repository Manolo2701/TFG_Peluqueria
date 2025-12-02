import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { AuthService } from './auth.service';
import { DashboardStats } from '../../interfaces/dashboard.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/dashboard`;

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

  crearReservaRapida(datosReserva: any): Observable<any> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json');
    }

    return this.http.post<any>(`${environment.apiUrl}/reservas`, datosReserva, { headers }).pipe(
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

    return this.http.get<any>(`${environment.apiUrl}/servicios`, { headers }).pipe(
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

    return this.http.get<any>(`${environment.apiUrl}/trabajadores`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error obteniendo trabajadores:', error);
        return throwError(() => new Error('No se pudieron cargar los trabajadores'));
      })
    );
  }

  obtenerTodosLosTrabajadores(): Observable<any> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.get<any>(`${environment.apiUrl}/usuarios?rol=trabajador`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error obteniendo trabajadores:', error);
        return throwError(() => new Error('No se pudieron cargar los trabajadores'));
      })
    );
  }

  obtenerTodosLosServicios(): Observable<any> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.get<any>(`${environment.apiUrl}/servicios`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error obteniendo servicios:', error);
        return throwError(() => new Error('No se pudieron cargar los servicios'));
      })
    );
  }

  obtenerTodosLosProductos(): Observable<any> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.get<any>(`${environment.apiUrl}/productos`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error obteniendo productos:', error);
        return throwError(() => new Error('No se pudieron cargar los productos'));
      })
    );
  }

  obtenerConfiguracionNegocio(): Observable<any> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.get<any>(`${environment.apiUrl}/configuracion`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error obteniendo configuración:', error);
        return throwError(() => new Error('No se pudo cargar la configuración'));
      })
    );
  }

  actualizarConfiguracionNegocio(configData: any): Observable<any> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json');
    }

    return this.http.put<any>(`${environment.apiUrl}/configuracion`, configData, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error actualizando configuración:', error);
        return throwError(() => new Error('No se pudo actualizar la configuración'));
      })
    );
  }

  getEstadisticasAvanzadas(): Observable<any> {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.get<any>(`${this.apiUrl}/estadisticas-avanzadas`, { headers }).pipe(
      catchError(error => {
        console.error('❌ Error obteniendo estadísticas avanzadas:', error);
        return throwError(() => new Error('No se pudieron cargar las estadísticas avanzadas'));
      })
    );
  }
}