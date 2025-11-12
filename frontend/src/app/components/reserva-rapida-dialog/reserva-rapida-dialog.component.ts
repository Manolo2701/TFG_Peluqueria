// frontend/src/app/components/reserva-rapida-dialog/reserva-rapida-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-reserva-rapida-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="reserva-rapida-dialog">
      <h2 mat-dialog-title>Nueva Reserva Rápida</h2>
      
      <mat-dialog-content>
        <form [formGroup]="reservaForm" class="reserva-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Servicio</mat-label>
            <mat-select formControlName="servicio_id" required>
              <mat-option *ngFor="let servicio of data.servicios" [value]="servicio.id">
                {{ servicio.nombre }} - {{ servicio.precio | currency:'EUR' }} ({{ servicio.duracion }}min)
              </mat-option>
            </mat-select>
            <mat-error *ngIf="reservaForm.get('servicio_id')?.hasError('required')">
              El servicio es obligatorio
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Trabajador (Opcional)</mat-label>
            <mat-select formControlName="trabajador_id">
              <mat-option value="">Cualquier trabajador disponible</mat-option>
              <mat-option *ngFor="let trabajador of data.trabajadores" [value]="trabajador.id">
                {{ trabajador.nombre }} {{ trabajador.apellidos }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Fecha</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="fecha_reserva" required>
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="reservaForm.get('fecha_reserva')?.hasError('required')">
              La fecha es obligatoria
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Hora de Inicio</mat-label>
            <input matInput type="time" formControlName="hora_inicio" required>
            <mat-error *ngIf="reservaForm.get('hora_inicio')?.hasError('required')">
              La hora es obligatoria
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Notas (Opcional)</mat-label>
            <textarea matInput formControlName="notas" rows="3" placeholder="Notas adicionales..."></textarea>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="cancelar()">Cancelar</button>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="confirmar()"
          [disabled]="!reservaForm.valid || loading"
        >
          <mat-icon *ngIf="loading" class="spinner">hourglass_empty</mat-icon>
          {{ loading ? 'Creando...' : 'Crear Reserva' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .reserva-rapida-dialog {
      min-width: 400px;
    }
    
    .reserva-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .spinner {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class ReservaRapidaDialogComponent implements OnInit {
  reservaForm: FormGroup;
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<ReservaRapidaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private dashboardService: DashboardService
  ) {
    this.reservaForm = this.fb.group({
      servicio_id: ['', Validators.required],
      trabajador_id: [''],
      fecha_reserva: ['', Validators.required],
      hora_inicio: ['', Validators.required],
      notas: ['']
    });
  }

  ngOnInit() {
    // Establecer fecha por defecto (mañana)
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    this.reservaForm.patchValue({
      fecha_reserva: manana,
      hora_inicio: '10:00'
    });
  }

  confirmar() {
    if (this.reservaForm.valid) {
      this.loading = true;

      const formData = this.reservaForm.value;
      // Formatear fecha para el backend
      const fecha = new Date(formData.fecha_reserva);
      const fechaFormateada = fecha.toISOString().split('T')[0];

      const datosReserva = {
        ...formData,
        fecha_reserva: fechaFormateada
      };

      this.dashboardService.crearReservaRapida(datosReserva).subscribe({
        next: (response) => {
          this.loading = false;
          this.dialogRef.close(response);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error creando reserva:', error);
          // El error se maneja en el componente principal
          this.dialogRef.close(null);
        }
      });
    }
  }

  cancelar() {
    this.dialogRef.close(null);
  }
}