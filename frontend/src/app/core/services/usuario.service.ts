import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';

export interface Usuario {
    id: number;
    nombre: string;
    email: string;
    telefono?: string;
    rol: string;
    activo: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class UsuarioService {
    private apiUrl = 'http://localhost:3000/api';

    constructor(private http: HttpClient) { }

    getPerfil(): Observable<Usuario> {
        return this.http.get<Usuario>(`${this.apiUrl}/usuarios/perfil`);
    }

    getUsuarios(): Observable<Usuario[]> {
        return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`);
    }

    getUsuario(id: number): Observable<Usuario> {
        return this.http.get<Usuario>(`${this.apiUrl}/usuarios/${id}`);
    }

    getUsuarioActual(): Observable<any> {
        const usuarioStr = localStorage.getItem('usuario');
        if (usuarioStr) {
            return of(JSON.parse(usuarioStr));
        } else {
            return this.http.get(`${this.apiUrl}/usuarios/perfil`).pipe(
                catchError(error => {
                    console.error('Error al obtener perfil:', error);
                    return of(null);
                })
            );
        }
    }
}