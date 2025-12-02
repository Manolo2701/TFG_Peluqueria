// Versión simplificada - solicitar-ausencia-modal-simple.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'app-solicitar-ausencia-modal',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule
    ],
    template: `
    <div class="solicitar-ausencia-modal">
      <h2 mat-dialog-title>Solicitar Ausencia</h2>

      <mat-dialog-content>
        <form [formGroup]="ausenciaForm" class="ausencia-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tipo de Ausencia</mat-label>
            <mat-select formControlName="tipo">
              <mat-option value="vacaciones">Vacaciones</mat-option>
              <mat-option value="enfermedad">Enfermedad</mat-option>
              <mat-option value="personal">Personal</mat-option>
              <mat-option value="formacion">Formación</mat-option>
              <mat-option value="otro">Otro</mat-option>
            </mat-select>
            <mat-error *ngIf="ausenciaForm.get('tipo')?.hasError('required')">
              El tipo de ausencia es obligatorio
            </mat-error>
          </mat-form-field>

          <div class="date-row">
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Fecha Inicio</mat-label>
              <input matInput formControlName="fecha_inicio" type="date">
              <mat-error *ngIf="ausenciaForm.get('fecha_inicio')?.hasError('required')">
                La fecha de inicio es obligatoria
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Fecha Fin</mat-label>
              <input matInput formControlName="fecha_fin" type="date">
              <mat-error *ngIf="ausenciaForm.get('fecha_fin')?.hasError('required')">
                La fecha de fin es obligatoria
              </mat-error>
              <mat-error *ngIf="ausenciaForm.get('fecha_fin')?.hasError('fechaAnterior')">
                La fecha de fin no puede ser anterior a la fecha de inicio
              </mat-error>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Motivo</mat-label>
            <textarea matInput formControlName="motivo" rows="4" placeholder="Explica el motivo de tu ausencia..."></textarea>
            <mat-error *ngIf="ausenciaForm.get('motivo')?.hasError('required')">
              El motivo es obligatorio
            </mat-error>
            <mat-error *ngIf="ausenciaForm.get('motivo')?.hasError('minlength')">
              El motivo debe tener al menos 10 caracteres
            </mat-error>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancelar</button>
        <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!ausenciaForm.valid">
          Solicitar Ausencia
        </button>
      </mat-dialog-actions>
    </div>
  `,
    styles: [`
    .solicitar-ausencia-modal {
      min-width: 500px;
    }
    .ausencia-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .full-width {
      width: 100%;
    }
    .date-row {
      display: flex;
      gap: 16px;
    }
    .half-width {
      flex: 1;
    }
    
    /* Mejorar apariencia de inputs de fecha */
    input[type="date"] {
      height: 20px;
      padding: 8px 0;
      font-family: inherit;
    }
  `]
})
export class SolicitarAusenciaModalComponent {
    ausenciaForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<SolicitarAusenciaModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.ausenciaForm = this.fb.group({
            tipo: ['', Validators.required],
            fecha_inicio: ['', Validators.required],
            fecha_fin: ['', [Validators.required, this.fechaFinValidator.bind(this)]],
            motivo: ['', [Validators.required, Validators.minLength(10)]]
        });

        // Validar fechas cuando cambie la fecha de inicio
        this.ausenciaForm.get('fecha_inicio')?.valueChanges.subscribe(() => {
            this.ausenciaForm.get('fecha_fin')?.updateValueAndValidity();
        });
    }

    // Validador personalizado para fecha fin
    private fechaFinValidator(control: AbstractControl) {
        const fechaInicio = this.ausenciaForm?.get('fecha_inicio')?.value;
        const fechaFin = control.value;

        if (fechaInicio && fechaFin) {
            const inicio = new Date(fechaInicio);
            const fin = new Date(fechaFin);

            if (fin < inicio) {
                return { fechaAnterior: true };
            }
        }

        return null;
    }

    onSubmit(): void {
        if (this.ausenciaForm.valid) {
            this.dialogRef.close(this.ausenciaForm.value);
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}