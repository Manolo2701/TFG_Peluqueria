import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon'; // ✅ AÑADIDO
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // ✅ AÑADIDO

// Interfaces
import { Producto } from '../../interfaces/producto.interface';

export interface ProductoDialogData {
    producto?: Producto; // Si está definido, es edición, si no, es creación
}

@Component({
    selector: 'app-crear-editar-producto-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSnackBarModule,
        MatCheckboxModule,
        MatIconModule, // ✅ AÑADIDO
        MatProgressSpinnerModule // ✅ AÑADIDO
    ],
    templateUrl: './crear-editar-producto-dialog.component.html',
    styleUrls: ['./crear-editar-producto-dialog.component.scss']
})
export class CrearEditarProductoDialogComponent implements OnInit {
    productoForm: FormGroup;
    isEdit = false;
    loading = false;

    constructor(
        private fb: FormBuilder,
        private snackBar: MatSnackBar,
        public dialogRef: MatDialogRef<CrearEditarProductoDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ProductoDialogData
    ) {
        this.isEdit = !!data.producto;

        this.productoForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(3)]],
            precio: [0, [Validators.required, Validators.min(0)]],
            stock: [0, [Validators.required, Validators.min(0)]],
            activo: [true]
        });
    }

    ngOnInit(): void {
        if (this.isEdit && this.data.producto) {
            this.productoForm.patchValue(this.data.producto);
        }
    }

    onSubmit(): void {
        if (this.productoForm.valid) {
            this.loading = true;

            // Simular una llamada a la API
            setTimeout(() => {
                this.loading = false;
                this.snackBar.open(
                    `Producto ${this.isEdit ? 'actualizado' : 'creado'} correctamente`,
                    'Cerrar',
                    { duration: 3000 }
                );
                this.dialogRef.close(this.productoForm.value);
            }, 1000);
        } else {
            this.marcarCamposInvalidos();
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    private marcarCamposInvalidos(): void {
        Object.keys(this.productoForm.controls).forEach(key => {
            const control = this.productoForm.get(key);
            if (control?.invalid) {
                control.markAsTouched();
            }
        });
    }

    // Getters para facilitar el acceso en el template
    get nombre() { return this.productoForm.get('nombre'); }
    get precio() { return this.productoForm.get('precio'); }
    get stock() { return this.productoForm.get('stock'); }
}