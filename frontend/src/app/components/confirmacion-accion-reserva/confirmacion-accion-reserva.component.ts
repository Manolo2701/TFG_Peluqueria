// frontend/src/app/components/confirmacion-accion-reserva/confirmacion-accion-reserva.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface ConfirmacionAccionData {
    tipo: 'aceptar' | 'rechazar';
    reserva: any;
    titulo: string;
    mensaje: string;
    requiereMotivo: boolean;
}

@Component({
    selector: 'app-confirmacion-accion-reserva',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule
    ],
    template: `
    <div class="confirmacion-dialog">
      <div class="modal-header">
        <h2 mat-dialog-title>{{ data.titulo }}</h2>
        <button mat-icon-button (click)="cancelar()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <div class="reserva-info">
          <p class="mensaje">{{ data.mensaje }}</p>
          
          <div class="detalles-reserva">
            <div class="detalle-item">
              <mat-icon>person</mat-icon>
              <span><strong>Cliente:</strong> {{ getNombreCliente() }}</span>
            </div>
            <div class="detalle-item">
              <mat-icon>spa</mat-icon>
              <span><strong>Servicio:</strong> {{ getNombreServicio() }}</span>
            </div>
            <div class="detalle-item">
              <mat-icon>event</mat-icon>
              <span><strong>Fecha:</strong> {{ formatDate(data.reserva.fecha_reserva) }}</span>
            </div>
            <div class="detalle-item">
              <mat-icon>schedule</mat-icon>
              <span><strong>Hora:</strong> {{ formatTime(data.reserva.hora_inicio) }}</span>
            </div>
          </div>

          <form *ngIf="data.requiereMotivo" [formGroup]="motivoForm" class="motivo-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Motivo del rechazo</mat-label>
              <textarea 
                matInput 
                formControlName="motivo" 
                placeholder="Explica brevemente por qué rechazas esta reserva..."
                rows="4"
              ></textarea>
              <mat-error *ngIf="motivoForm.get('motivo')?.hasError('required')">
                El motivo es obligatorio
              </mat-error>
            </mat-form-field>
          </form>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="cancelar()">
          <mat-icon>cancel</mat-icon>
          Cancelar
        </button>
        <button 
          mat-raised-button 
          [color]="data.tipo === 'aceptar' ? 'primary' : 'warn'"
          (click)="confirmar()"
          [disabled]="data.requiereMotivo && !motivoForm.valid"
        >
          <mat-icon>{{ data.tipo === 'aceptar' ? 'check_circle' : 'cancel' }}</mat-icon>
          {{ data.tipo === 'aceptar' ? 'Aceptar Reserva' : 'Rechazar Reserva' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
    styleUrls: ['./confirmacion-accion-reserva.component.scss']
})
export class ConfirmacionAccionReservaComponent {
    motivoForm: FormGroup;

    constructor(
        public dialogRef: MatDialogRef<ConfirmacionAccionReservaComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ConfirmacionAccionData,
        private fb: FormBuilder
    ) {
        this.motivoForm = this.fb.group({
            motivo: ['', data.requiereMotivo ? Validators.required : []]
        });
    }

    getNombreCliente(): string {
        const reserva = this.data.reserva;
        if (reserva.cliente_nombre && reserva.cliente_apellidos) {
            return `${reserva.cliente_nombre} ${reserva.cliente_apellidos}`;
        }
        return 'Cliente no disponible';
    }

    getNombreServicio(): string {
        const reserva = this.data.reserva;
        return reserva.servicio_nombre || 'Servicio no disponible';
    }

    formatDate(dateString: string): string {
        if (!dateString) return 'Fecha no disponible';
        try {
            return new Date(dateString).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    formatTime(timeString: string): string {
        if (!timeString) return '--:--';
        return timeString.substring(0, 5);
    }

    confirmar(): void {
        if (this.data.requiereMotivo && !this.motivoForm.valid) {
            return;
        }

        const resultado = {
            confirmado: true,
            motivo: this.motivoForm.get('motivo')?.value
        };

        this.dialogRef.close(resultado);
    }

    cancelar(): void {
        this.dialogRef.close({ confirmado: false });
    }
}