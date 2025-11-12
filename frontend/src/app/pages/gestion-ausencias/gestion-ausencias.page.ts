// frontend/src/app/pages/gestion-ausencias/gestion-ausencias.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CalendarioService } from '../../core/services/calendario.service';
import { Ausencia } from '../../interfaces/calendario.interface';

@Component({
    selector: 'app-gestion-ausencias',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './gestion-ausencias.page.html',
    styleUrls: ['./gestion-ausencias.page.scss']
})
export class GestionAusenciasPage implements OnInit {
    ausencias: Ausencia[] = [];
    loading = false;
    error = '';

    constructor(private calendarioService: CalendarioService) { }

    ngOnInit() {
        this.cargarAusencias();
    }

    cargarAusencias() {
        const usuarioStr = localStorage.getItem('usuario');
        const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;

        // Solo cargar ausencias si el usuario es trabajador o admin-trabajador
        if (usuario && (usuario.rol === 'trabajador' || usuario.rol === 'administrador')) {
            console.log('🔄 Cargando ausencias para trabajador/admin...');
            this.calendarioService.getMisAusencias().subscribe({
                next: (response) => {
                    console.log('✅ Ausencias cargadas:', response.ausencias);
                    this.ausencias = response.ausencias || [];
                },
                error: (error) => {
                    console.error('❌ Error al cargar ausencias:', error);
                    this.ausencias = [];
                }
            });
        } else {
            console.log('ℹ️ Usuario no es trabajador, omitiendo carga de ausencias');
            this.ausencias = [];
        }
    }

    aprobarAusencia(ausencia: Ausencia) {
        if (!ausencia.id) return;

        this.calendarioService.gestionarAusencia(ausencia.id, 'aprobada').subscribe({
            next: () => {
                ausencia.estado = 'aprobada';
            },
            error: (error) => {
                console.error('Error aprobando ausencia:', error);
                this.error = 'Error al aprobar la ausencia';
            }
        });
    }

    rechazarAusencia(ausencia: Ausencia) {
        if (!ausencia.id) return;

        this.calendarioService.gestionarAusencia(ausencia.id, 'rechazada').subscribe({
            next: () => {
                ausencia.estado = 'rechazada';
            },
            error: (error) => {
                console.error('Error rechazando ausencia:', error);
                this.error = 'Error al rechazar la ausencia';
            }
        });
    }

    getBadgeClass(estado: string): string {
        switch (estado) {
            case 'pendiente': return 'badge bg-warning';
            case 'aprobada': return 'badge bg-success';
            case 'rechazada': return 'badge bg-danger';
            default: return 'badge bg-secondary';
        }
    }

    getTipoClass(tipo: string): string {
        switch (tipo) {
            case 'vacaciones': return 'badge bg-info';
            case 'baja': return 'badge bg-warning';
            case 'otro': return 'badge bg-secondary';
            default: return 'badge bg-secondary';
        }
    }
}