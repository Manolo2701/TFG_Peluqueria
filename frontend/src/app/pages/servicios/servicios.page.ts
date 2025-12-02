import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ServicioService } from '../../core/services/servicio.service'; // ✅ Solo el servicio
import { Servicio } from '../../interfaces/servicio.interface'; // ✅ La interfaz desde su archivo

@Component({
    selector: 'app-servicios',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatChipsModule,
        MatDialogModule
    ],
    templateUrl: './servicios.page.html',
    styleUrls: ['./servicios.page.scss']
})
export class ServiciosPage implements OnInit {
    servicios: Servicio[] = [];
    serviciosFiltrados: Servicio[] = [];
    categorias: string[] = [];
    categoriaFiltro: string = '';
    loading = true;
    error: string | null = null;

    // Datos de ejemplo para pruebas - INCLUYENDO 'activo'
    serviciosEjemplo: Servicio[] = [
        {
            id: 1,
            nombre: 'Corte de Cabello',
            descripcion: 'Corte moderno y personalizado según tu estilo',
            precio: 25,
            duracion: 45,
            categoria: 'peluqueria',
            activo: true
        },
        {
            id: 2,
            nombre: 'Manicura Básica',
            descripcion: 'Limpieza, corte y esmaltado de uñas',
            precio: 15,
            duracion: 30,
            categoria: 'unas',
            activo: true
        },
        {
            id: 3,
            nombre: 'Limpieza Facial',
            descripcion: 'Limpieza profunda e hidratación facial',
            precio: 40,
            duracion: 60,
            categoria: 'facial',
            activo: true
        },
        {
            id: 4,
            nombre: 'Masaje Relajante',
            descripcion: 'Masaje terapéutico para aliviar tensiones',
            precio: 50,
            duracion: 60,
            categoria: 'corporal',
            activo: true
        }
    ];

    constructor(
        private servicioService: ServicioService,
        private router: Router,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) { }

    ngOnInit() {
        this.cargarServicios();
    }

    cargarServicios() {
        this.loading = true;
        this.error = null;

        this.servicioService.getServicios().subscribe({
            next: (response: any) => {
                console.log('📦 Respuesta recibida:', response);

                let serviciosArray: any[] = [];

                // ✅ CORRECCIÓN: Manejo seguro de diferentes formatos de respuesta
                if (Array.isArray(response)) {
                    serviciosArray = response;
                } else if (response && typeof response === 'object') {
                    // Si es un objeto con propiedad servicios
                    if (Array.isArray(response.servicios)) {
                        serviciosArray = response.servicios;
                    } else if (Array.isArray(response.data)) {
                        serviciosArray = response.data;
                    } else {
                        // Si no es array, usar datos de ejemplo
                        console.warn('⚠️ Formato de respuesta no esperado, usando datos de ejemplo');
                        serviciosArray = this.serviciosEjemplo;
                    }
                } else {
                    // Si la respuesta es null/undefined, usar datos de ejemplo
                    console.warn('⚠️ No se recibieron servicios, usando datos de ejemplo');
                    serviciosArray = this.serviciosEjemplo;
                }

                // Validar que cada servicio tenga la estructura correcta
                this.servicios = serviciosArray.map(servicio => this.validarServicio(servicio));
                this.serviciosFiltrados = [...this.servicios];
                this.extraerCategorias();
                this.loading = false;

                console.log('✅ Servicios procesados:', this.servicios);
            },
            error: (err) => {
                console.error('❌ Error cargando servicios:', err);

                // ✅ CORRECCIÓN: Usar datos de ejemplo si hay error
                console.warn('⚠️ Usando datos de ejemplo debido a error');
                this.servicios = this.serviciosEjemplo;
                this.serviciosFiltrados = [...this.servicios];
                this.extraerCategorias();
                this.loading = false;

                this.snackBar.open(
                    'Usando datos de demostración. Los servicios reales se cargarán cuando el backend esté disponible.',
                    'Cerrar',
                    { duration: 5000 }
                );
            }
        });
    }

    // ✅ NUEVO MÉTODO: Validar estructura del servicio INCLUYENDO 'activo'
    private validarServicio(servicio: any): Servicio {
        return {
            id: servicio.id || 0,
            nombre: servicio.nombre || 'Servicio sin nombre',
            descripcion: servicio.descripcion || 'Descripción no disponible',
            precio: servicio.precio || 0,
            duracion: servicio.duracion || 30,
            categoria: servicio.categoria || 'general',
            activo: servicio.activo !== undefined ? servicio.activo : true
        };
    }

    extraerCategorias() {
        if (!Array.isArray(this.servicios) || this.servicios.length === 0) {
            this.categorias = [];
            return;
        }

        const categoriasUnicas = new Set(this.servicios.map(s => s.categoria));
        this.categorias = Array.from(categoriasUnicas);
        console.log('📂 Categorías extraídas:', this.categorias);
    }

    filtrarPorCategoria(categoria: string) {
        this.categoriaFiltro = categoria;
        if (categoria) {
            this.serviciosFiltrados = this.servicios.filter(s => s.categoria === categoria);
        } else {
            this.serviciosFiltrados = [...this.servicios];
        }
        console.log('🔍 Servicios filtrados:', this.serviciosFiltrados.length);
    }

    reservarServicio(servicio: Servicio) {
        console.log('🎯 Reservando servicio:', servicio);
        this.router.navigate(['/reservar'], {
            queryParams: {
                servicioId: servicio.id,
                servicioNombre: servicio.nombre
            }
        });
    }

    verDetallesServicio(servicio: Servicio) {
        this.snackBar.open(
            `💎 ${servicio.nombre}: ${servicio.descripcion} - ${this.formatCurrency(servicio.precio)}`,
            'Cerrar',
            { duration: 5000 }
        );
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount || 0);
    }

    getCategoriaIcon(categoria: string): string {
        const iconMap: { [key: string]: string } = {
            'peluqueria': 'content_cut',
            'estetica': 'spa',
            'facial': 'face',
            'corporal': 'body',
            'unas': 'style',
            'maquillaje': 'palette',
            'depilacion': 'waves',
            'general': 'spa'
        };
        return iconMap[categoria.toLowerCase()] || 'spa';
    }
}