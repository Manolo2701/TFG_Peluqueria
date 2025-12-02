import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductoBusqueda } from '../../interfaces/producto.interface';
import { Servicio } from '../../interfaces/servicio.interface';
import { environment } from '../../../environments/environment';

export interface SugerenciaBusqueda {
    id: number;
    nombre: string;
    tipo: string;
    categoria?: string;
    precio?: number;
}

@Injectable({
    providedIn: 'root'
})
export class BusquedaService {
    private apiUrl = `${environment.apiUrl}/busqueda`;

    constructor(private http: HttpClient) { }

    buscarGlobal(termino: string, filtros?: any): Observable<{ resultados: ProductoBusqueda[] }> {
        const params: any = { q: termino };
        if (filtros?.categoria) params.categoria = filtros.categoria;
        if (filtros?.precioMin) params.precioMin = filtros.precioMin;
        if (filtros?.precioMax) params.precioMax = filtros.precioMax;

        return this.http.get<{ resultados: ProductoBusqueda[] }>(`${this.apiUrl}/global`, { params });
    }

    buscarServicios(termino: string): Observable<{ servicios: Servicio[] }> {
        return this.http.get<{ servicios: Servicio[] }>(`${this.apiUrl}/servicios`, {
            params: { q: termino }
        });
    }

    buscarProductos(termino: string, filtros?: any): Observable<{ productos: ProductoBusqueda[] }> {
        const params: any = { q: termino };
        if (filtros?.categoria) params.categoria = filtros.categoria;
        if (filtros?.precioMin) params.precioMin = filtros.precioMin;
        if (filtros?.precioMax) params.precioMax = filtros.precioMax;

        return this.http.get<{ productos: ProductoBusqueda[] }>(`${this.apiUrl}/productos`, { params });
    }

    obtenerSugerencias(termino: string): Observable<{ sugerencias: string[] }> {
        return this.http.get<{ sugerencias: string[] }>(`${this.apiUrl}/sugerencias`, {
            params: { q: termino }
        });
    }

    obtenerCategorias(): Observable<{ categorias: string[] }> {
        return this.http.get<{ categorias: string[] }>(`${this.apiUrl}/categorias`);
    }
}