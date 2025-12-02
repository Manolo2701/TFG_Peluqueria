import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ConfiguracionNegocio {
    id: number;
    nombre_negocio: string;
    horario_apertura: string;
    horario_cierre: string;
    dias_apertura: string[];
    tiempo_minimo_entre_reservas: number;
    maximo_reservas_por_dia: number;
    politica_cancelacion_default: string;
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

    getFestivos(): Observable<Festivo[]> {
        return this.http.get<Festivo[]>(`${this.apiUrl}/festivos`).pipe(
            catchError(error => {
                console.error('Error cargando festivos:', error);
                return of([]);
            })
        );
    }
}