import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon'; 
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; 

// Interfaces
import { Servicio } from '../../interfaces/servicio.interface';

export interface ServicioDialogData {
    servicio?: Servicio; // Si está definido, es edición, si no, es creación
}

@Component({
    selector: 'app-crear-editar-servicio-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatSnackBarModule,
        MatCheckboxModule,
        MatIconModule, 
        MatProgressSpinnerModule 
    ],
    templateUrl: './crear-editar-servicio-dialog.component.html',
    styleUrls: ['./crear-editar-servicio-dialog.component.scss']
})
export class CrearEditarServicioDialogComponent implements OnInit {
    servicioForm: FormGroup;
    isEdit = false;
    loading = false;

    categorias: string[] = [
        'Peluquería',
        'Estética',
    ];

    constructor(
        private fb: FormBuilder,
        private snackBar: MatSnackBar,
        public dialogRef: MatDialogRef<CrearEditarServicioDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ServicioDialogData
    ) {
        this.isEdit = !!data.servicio;

        this.servicioForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(3)]],
            descripcion: [''],
            duracion: [30, [Validators.required, Validators.min(1)]],
            precio: [0, [Validators.required, Validators.min(0)]],
            categoria: ['', Validators.required],
            activo: [true]
        });
    }

    ngOnInit(): void {
        if (this.isEdit && this.data.servicio) {
            this.servicioForm.patchValue(this.data.servicio);
        }
    }

    onSubmit(): void {
        if (this.servicioForm.valid) {
            this.loading = true;

            setTimeout(() => {
                this.loading = false;
                this.snackBar.open(
                    `Servicio ${this.isEdit ? 'actualizado' : 'creado'} correctamente`,
                    'Cerrar',
                    { duration: 3000 }
                );
                this.dialogRef.close(this.servicioForm.value);
            }, 1000);
        } else {
            this.marcarCamposInvalidos();
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    private marcarCamposInvalidos(): void {
        Object.keys(this.servicioForm.controls).forEach(key => {
            const control = this.servicioForm.get(key);
            if (control?.invalid) {
                control.markAsTouched();
            }
        });
    }

    // Getters para facilitar el acceso en el template
    get nombre() { return this.servicioForm.get('nombre'); }
    get descripcion() { return this.servicioForm.get('descripcion'); }
    get duracion() { return this.servicioForm.get('duracion'); }
    get precio() { return this.servicioForm.get('precio'); }
    get categoria() { return this.servicioForm.get('categoria'); }
}