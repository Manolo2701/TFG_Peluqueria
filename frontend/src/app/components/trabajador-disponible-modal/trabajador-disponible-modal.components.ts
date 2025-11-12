import { Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ReservaService } from "../../core/services/reserva.service";

// trabajadores-disponibles-modal.component.ts
export class TrabajadoresDisponiblesModalComponent {
    trabajadores: any[] = [];
    servicio: any;
    fecha: string;
    hora: string;

    constructor(
        public dialogRef: MatDialogRef<TrabajadoresDisponiblesModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private reservaService: ReservaService
    ) {
        this.servicio = data.servicio;
        this.fecha = data.fecha;
        this.hora = data.hora;
        this.cargarTrabajadoresDisponibles();
    }

    cargarTrabajadoresDisponibles() {
        this.reservaService.getTrabajadoresDisponibles(this.servicio.id, this.fecha, this.hora).subscribe({
            next: (response) => {
                this.trabajadores = response.trabajadores;
            },
            error: (error) => {
                console.error('Error al cargar trabajadores:', error);
            }
        });
    }

    seleccionarTrabajador(trabajador: any) {
        this.dialogRef.close({
            trabajadorSeleccionado: trabajador,
            servicio: this.servicio,
            fecha: this.fecha,
            hora: this.hora
        });
    }

    cancelar() {
        this.dialogRef.close();
    }
}