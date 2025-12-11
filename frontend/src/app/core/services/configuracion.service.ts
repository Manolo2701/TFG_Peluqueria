import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CategoriasEspecialidades {
    [key: string]: string[];
}

export interface ConfiguracionNegocio {
    id: number;
    nombre_negocio: string;
    horario_apertura: string;
    horario_cierre: string;
    dias_apertura: string[];
    tiempo_minimo_entre_reservas: number;
    maximo_reservas_por_dia: number;
    politica_cancelacion_default: string;
    categorias_especialidades?: CategoriasEspecialidades;
}

export interface ConfiguracionPublica {
    nombre_negocio: string;
    horario_apertura: string;
    horario_cierre: string;
    dias_apertura: string[];
}

export interface Festivo {
    id: number;
    fecha: string;
    motivo: string;
    recurrente: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ConfiguracionService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/configuracion`;

    getConfiguracion(): Observable<ConfiguracionNegocio> {
        return this.http.get<ConfiguracionNegocio>(`${this.apiUrl}/`).pipe(
            catchError(error => {
                console.error('Error cargando configuración, usando valores por defecto:', error);
                return of({
                    id: 1,
                    nombre_negocio: 'Peluquería Selene',
                    horario_apertura: '09:30',
                    horario_cierre: '20:00',
                    dias_apertura: ['martes', 'miercoles', 'jueves', 'viernes', 'sabado'],
                    tiempo_minimo_entre_reservas: 15,
                    maximo_reservas_por_dia: 50,
                    politica_cancelacion_default: 'flexible'
                });
            })
        );
    }

    getConfiguracionPublica(): Observable<ConfiguracionPublica> {
        return this.http.get<{ success: boolean, data: ConfiguracionPublica }>(`${this.apiUrl}/publica`).pipe(
            map(response => response.data),
            catchError(error => {
                console.error('Error cargando configuración pública, usando valores por defecto:', error);
                return of({
                    nombre_negocio: 'Peluquería Selene',
                    horario_apertura: '09:30',
                    horario_cierre: '20:00',
                    dias_apertura: ['martes', 'miercoles', 'jueves', 'viernes', 'sabado']
                });
            })
        );
    }

    getCategoriasEspecialidades(): Observable<CategoriasEspecialidades> {
        return this.http.get<{ success: boolean, data: CategoriasEspecialidades }>(`${this.apiUrl}/categorias-especialidades`).pipe(
            map(response => response.data),
            catchError(error => {
                console.error('Error cargando categorías y especialidades:', error);
                return of({});
            })
        );
    }

    updateCategoriasEspecialidades(categoriasEspecialidades: CategoriasEspecialidades): Observable<any> {
        return this.http.put(`${this.apiUrl}/categorias-especialidades`, { categoriasEspecialidades }).pipe(
            catchError(error => {
                console.error('Error actualizando categorías y especialidades:', error);
                throw error;
            })
        );
    }

    getFestivos(): Observable<Festivo[]> {
        return this.http.get<Festivo[]>(`${this.apiUrl}/festivos`).pipe(
            catchError(error => {
                console.error('Error cargando festivos:', error);
                return of([]);
            })
        );
    }
}