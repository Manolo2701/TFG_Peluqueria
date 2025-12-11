import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services
import { TrabajadorService } from '../../core/services/trabajador.service';
import { AuthService } from '../../core/services/auth.service';

// Interfaces
import { Trabajador } from '../../interfaces/trabajador.interface';

// Componentes de diálogo
import { CrearTrabajadorDialogComponent } from '../../components/crear-trabajador-dialog/crear-trabajador-dialog.component';
import { EditarTrabajadorDialogComponent } from '../../components/editar-trabajador-dialog/editar-trabajador-dialog.component';

@Component({
    selector: 'app-admin-trabajadores',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatTableModule,
        MatIconModule,
        MatDialogModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatTooltipModule
    ],
    templateUrl: './admin-trabajadores.page.html',
    styleUrls: ['./admin-trabajadores.page.scss']
})
export class AdminTrabajadoresPage implements OnInit {
    trabajadores: Trabajador[] = [];
    loading = true;
    error: string | null = null;
    usuario: any = null;

    // Columnas para la tabla
    displayedColumns: string[] = ['nombre', 'email', 'telefono', 'categoria', 'especialidades', 'acciones'];

    constructor(
        private trabajadorService: TrabajadorService,
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) { }

    ngOnInit() {
        this.usuario = this.authService.usuarioActualValue;
        this.cargarTrabajadores();
    }

    cargarTrabajadores() {
        this.loading = true;
        this.error = null;

        this.trabajadorService.obtenerTodosTrabajadores().subscribe({
            next: (response) => {
                this.trabajadores = response.trabajadores;
                this.loading = false;

                // Agrega esto temporalmente en cargarTrabajadores() para depurar:
                console.log('Respuesta completa del endpoint:', response);
                console.log('Primer trabajador:', response.trabajadores[0]);
            },
            error: (error) => {
                console.error('Error cargando trabajadores:', error);
                this.error = error.message;
                this.loading = false;
                this.mostrarError('Error al cargar los trabajadores');
            }
        });


    }

    // Métodos para las acciones
    crearTrabajador() {
        const dialogRef = this.dialog.open(CrearTrabajadorDialogComponent, {
            width: '700px',
            maxWidth: '90vw'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.cargarTrabajadores();
            }
        });
    }

    editarTrabajador(trabajador: Trabajador) {
        const dialogRef = this.dialog.open(EditarTrabajadorDialogComponent, {
            width: '700px',
            maxWidth: '90vw',
            data: { trabajador }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.cargarTrabajadores();
            }
        });
    }

    eliminarTrabajador(trabajador: Trabajador) {
        if (confirm(`¿Estás seguro de que quieres eliminar a ${trabajador.nombre} ${trabajador.apellidos}?`)) {
            this.trabajadorService.eliminarTrabajador(trabajador.id).subscribe({
                next: (response) => {
                    this.mostrarExito('Trabajador eliminado exitosamente');
                    this.cargarTrabajadores();
                },
                error: (error) => {
                    console.error('Error eliminando trabajador:', error);
                    this.mostrarError('Error al eliminar el trabajador: ' + error.message);
                }
            });
        }
    }

    // Contadores para estadísticas
    contarTrabajadoresPorCategoria(categoria: string): number {
        return this.trabajadores.filter(t => t.categoria === categoria).length;
    }

    // Helpers
    mostrarExito(mensaje: string) {
        this.snackBar.open(mensaje, 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-success']
        });
    }

    mostrarError(mensaje: string) {
        this.snackBar.open(mensaje, 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error']
        });
    }

    // Formatear especialidades para mostrar
    formatearEspecialidades(especialidades: string | string[]): string {
        if (Array.isArray(especialidades)) {
            return especialidades.join(', ');
        }

        if (typeof especialidades === 'string') {
            try {
                const parsed = JSON.parse(especialidades);
                return Array.isArray(parsed) ? parsed.join(', ') : especialidades;
            } catch {
                return especialidades;
            }
        }

        return 'No especificado';
    }

    // Función para recargar (usada en el header)
    recargar() {
        this.cargarTrabajadores();
    }
}