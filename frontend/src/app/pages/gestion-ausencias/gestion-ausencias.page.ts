import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';

import { CalendarioService } from '../../core/services/calendario.service';
import { Ausencia } from '../../interfaces/calendario.interface';

@Component({
    selector: 'app-gestion-ausencias',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatSelectModule,
        MatFormFieldModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './gestion-ausencias.page.html',
    styleUrls: ['./gestion-ausencias.page.scss']
})
export class GestionAusenciasPage implements OnInit {
    ausencias: Ausencia[] = [];
    ausenciasFiltradas: Ausencia[] = [];
    loading = false;
    error = '';
    esAdministrador = false;

    // Filtros
    filtroEstado = 'todos';
    filtroTipo = 'todos';

    // Columnas de la tabla
    columnasMostradas: string[] = ['trabajador', 'tipo', 'fechas', 'motivo', 'estado', 'acciones'];

    constructor(private calendarioService: CalendarioService) { }

    ngOnInit() {
        this.verificarPermisos();
        this.cargarAusencias();
    }

    verificarPermisos() {
        const usuarioStr = localStorage.getItem('usuario');
        const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;
        this.esAdministrador = usuario?.rol === 'administrador';

        if (!this.esAdministrador) {
            this.error = 'Solo los administradores pueden acceder a esta página.';
        }
    }

    cargarAusencias() {
        if (!this.esAdministrador) return;

        this.loading = true;
        this.error = '';

        console.log('🔄 Cargando todas las ausencias para administrador...');

        this.calendarioService.getTodasAusencias().subscribe({
            next: (ausencias: Ausencia[]) => {
                console.log('✅ Ausencias cargadas:', ausencias);
                this.ausencias = ausencias;
                this.aplicarFiltros();
                this.loading = false;
            },
            error: (error) => {
                console.error('❌ Error al cargar ausencias:', error);
                this.error = 'Error al cargar las solicitudes de ausencia. Por favor, intenta nuevamente.';
                this.loading = false;
                this.ausencias = [];
                this.ausenciasFiltradas = [];
            }
        });
    }

    aplicarFiltros() {
        this.ausenciasFiltradas = this.ausencias.filter(ausencia => {
            const coincideEstado = this.filtroEstado === 'todos' || ausencia.estado === this.filtroEstado;
            const coincideTipo = this.filtroTipo === 'todos' || ausencia.tipo === this.filtroTipo;
            return coincideEstado && coincideTipo;
        });
    }

    limpiarFiltros() {
        this.filtroEstado = 'todos';
        this.filtroTipo = 'todos';
        this.aplicarFiltros();
    }

    aprobarAusencia(ausencia: Ausencia) {
        if (!ausencia.id || !this.esAdministrador) return;

        console.log(`✅ Aprobando ausencia ID: ${ausencia.id}`);

        this.calendarioService.gestionarAusencia(ausencia.id, 'aprobado').subscribe({
            next: () => {
                console.log('✅ Ausencia aprobada correctamente');
                // Actualizar la ausencia localmente
                ausencia.estado = 'aprobado';
                this.aplicarFiltros();
            },
            error: (error) => {
                console.error('Error aprobando ausencia:', error);
                this.error = 'Error al aprobar la ausencia. Por favor, intenta nuevamente.';
            }
        });
    }

    rechazarAusencia(ausencia: Ausencia) {
        if (!ausencia.id || !this.esAdministrador) return;

        console.log(`❌ Rechazando ausencia ID: ${ausencia.id}`);

        this.calendarioService.gestionarAusencia(ausencia.id, 'rechazado').subscribe({
            next: () => {
                console.log('✅ Ausencia rechazada correctamente');
                // Actualizar la ausencia localmente
                ausencia.estado = 'rechazado';
                this.aplicarFiltros();
            },
            error: (error) => {
                console.error('Error rechazando ausencia:', error);
                this.error = 'Error al rechazar la ausencia. Por favor, intenta nuevamente.';
            }
        });
    }

    // Métodos auxiliares para estadísticas
    contarAusenciasPorEstado(estado: string): number {
        if (estado === 'pendiente') {
            return this.ausencias.filter(a => a.estado === 'pendiente').length;
        } else if (estado === 'aprobado') {
            return this.ausencias.filter(a => a.estado === 'aprobado').length;
        } else if (estado === 'rechazado') {
            return this.ausencias.filter(a => a.estado === 'rechazado').length;
        }
        return this.ausencias.length;
    }

    // Métodos para estilos
    getNombreTrabajador(ausencia: Ausencia): string {
        if (ausencia.nombre && ausencia.apellidos) {
            return `${ausencia.nombre} ${ausencia.apellidos}`;
        }
        return `Trabajador ${ausencia.trabajador_id}`;
    }

    getTipoClass(tipo: string): string {
        return tipo; // Los estilos CSS usarán esta clase directamente
    }

    getEstadoClass(estado: string): string {
        return estado; // Los estilos CSS usarán esta clase directamente
    }

    getEstadoIcon(estado: string): string {
        switch (estado) {
            case 'pendiente': return 'pending';
            case 'aprobado': return 'check_circle';
            case 'rechazado': return 'cancel';
            default: return 'help';
        }
    }
}