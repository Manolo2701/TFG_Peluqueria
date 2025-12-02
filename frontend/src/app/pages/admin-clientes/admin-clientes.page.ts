import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

// FontAwesome
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

// Environment
import { environment } from '../../../environments/environment';

// Components
import { HistorialClienteModalComponent } from '../../components/historial-cliente-modal/historial-cliente-modal.component';

interface Cliente {
    id: number;
    email: string;
    nombre: string;
    apellidos: string;
    telefono: string;
    direccion: string;
    rol: string;
    fecha_registro: string;
}

@Component({
    selector: 'app-admin-clientes',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        FontAwesomeModule
    ],
    templateUrl: './admin-clientes.page.html',
    styleUrls: ['./admin-clientes.page.scss']
})
export class AdminClientesPage implements OnInit {
    clientes: Cliente[] = [];
    loading = false;
    error: string | null = null;
    totalClientes = 0;

    private apiUrl = environment.apiUrl;

    faWhatsapp = faWhatsapp;

    constructor(
        private http: HttpClient,
        private snackBar: MatSnackBar,
        private library: FaIconLibrary,
        private dialog: MatDialog
    ) {
        library.addIcons(faWhatsapp);
    }

    ngOnInit() {
        this.cargarClientes();
    }

    cargarClientes() {
        this.loading = true;
        this.error = null;

        this.http.get<{ total: number, usuarios: Cliente[] }>(`${this.apiUrl}/usuarios/`).pipe(
            map(response => {
                const clientes = (response.usuarios || []).filter(usuario =>
                    usuario.rol === 'cliente'
                );

                console.log('✅ Clientes filtrados en frontend:', clientes.length);

                return {
                    total: clientes.length,
                    clientes: clientes
                };
            }),
            catchError(error => {
                console.error('❌ Error cargando usuarios:', error);
                const errorMsg = error.message || 'Error al cargar los usuarios';
                this.error = errorMsg;
                this.loading = false;
                this.mostrarError(errorMsg);
                return of({ total: 0, clientes: [] });
            })
        ).subscribe({
            next: (response) => {
                console.log('✅ Clientes cargados (filtrados en frontend):', response);
                this.clientes = response.clientes || [];
                this.totalClientes = response.total || 0;
                this.loading = false;
            }
        });
    }

    getClientesRecientes(): number {
        const hace30Dias = new Date();
        hace30Dias.setDate(hace30Dias.getDate() - 30);

        return this.clientes.filter(cliente => {
            if (!cliente.fecha_registro) return false;
            const fechaRegistro = new Date(cliente.fecha_registro);
            return fechaRegistro >= hace30Dias;
        }).length;
    }

    verHistorial(cliente: Cliente) {
        console.log('Ver historial de:', cliente);

        const dialogRef = this.dialog.open(HistorialClienteModalComponent, {
            width: '900px',
            maxWidth: '95vw',
            maxHeight: '85vh',
            data: { cliente }
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log('Modal de historial cerrado');
        });
    }

    contactarCliente(cliente: Cliente) {
        console.log('Contactar a:', cliente);

        if (cliente.telefono) {
            const mensaje = `Hola ${cliente.nombre}, soy de Peluquería Selene.`;
            const url = `https://wa.me/${cliente.telefono}?text=${encodeURIComponent(mensaje)}`;
            window.open(url, '_blank');
        } else {
            this.mostrarError('No hay número de teléfono disponible para este cliente');
        }
    }

    llamarCliente(cliente: Cliente) {
        if (cliente.telefono) {
            window.open(`tel:${cliente.telefono}`, '_self');
        } else {
            this.mostrarError('No hay número de teléfono disponible para este cliente');
        }
    }

    mostrarExito(mensaje: string) {
        this.snackBar.open(mensaje, 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-success']
        });
    }

    mostrarError(mensaje: string) {
        this.snackBar.open(mensaje, 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error']
        });
    }

    formatDate(dateString: string | null | undefined): string {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    formatTime(dateString: string | null | undefined): string {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '';
        }
    }

    getAntiguedad(fechaCreacion: string | null | undefined): string {
        if (!fechaCreacion) return 'Nueva';

        const registro = new Date(fechaCreacion);
        const hoy = new Date();
        const diffMs = hoy.getTime() - registro.getTime();
        const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDias === 0) return 'Hoy';
        if (diffDias === 1) return 'Ayer';
        if (diffDias < 7) return `${diffDias} días`;
        if (diffDias < 30) return `${Math.floor(diffDias / 7)} semanas`;
        if (diffDias < 365) return `${Math.floor(diffDias / 30)} meses`;
        return `${Math.floor(diffDias / 365)} años`;
    }
}