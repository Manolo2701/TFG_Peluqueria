import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { TrabajadorService } from '../../core/services/trabajador.service';
import { CrearTrabajadorRequest } from '../../interfaces/trabajador.interface';

interface HorarioDia {
    dia: string;
    nombre: string;
    activo: boolean;
    inicio: string;
    fin: string;
}

@Component({
    selector: 'app-crear-trabajador-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatChipsModule,
        MatIconModule,
        MatCheckboxModule
    ],
    templateUrl: './crear-trabajador-dialog.component.html',
    styleUrls: ['./crear-trabajador-dialog.component.scss']
})
export class CrearTrabajadorDialogComponent {
    trabajadorForm: FormGroup;
    loading = false;

    categorias = [
        'Peluquería',
        'Estética'
    ];

    especialidadesList = [
        'Cortes de cabello',
        'Coloración',
        'Mechas',
        'Tratamientos capilares',
        'Peinados',
        'Maquillaje',
        'Depilación',
        'Cuidado facial',
        'Uñas',
        'Masajes relajantes',
        'Masajes terapéuticos'
    ];

    diasSemana: HorarioDia[] = [
        { dia: 'lunes', nombre: 'Lunes', activo: false, inicio: '09:30', fin: '20:00' },
        { dia: 'martes', nombre: 'Martes', activo: false, inicio: '09:30', fin: '13:00' },
        { dia: 'miercoles', nombre: 'Miércoles', activo: false, inicio: '09:30', fin: '20:00' },
        { dia: 'jueves', nombre: 'Jueves', activo: false, inicio: '09:30', fin: '13:00' },
        { dia: 'viernes', nombre: 'Viernes', activo: false, inicio: '09:30', fin: '20:00' },
        { dia: 'sabado', nombre: 'Sábado', activo: false, inicio: '09:30', fin: '13:00' },
    ];

    horarioForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private trabajadorService: TrabajadorService,
        private snackBar: MatSnackBar,
        public dialogRef: MatDialogRef<CrearTrabajadorDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.trabajadorForm = this.fb.group({
            // Datos de usuario
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            nombre: ['', Validators.required],
            apellidos: ['', Validators.required],
            telefono: [''],
            direccion: [''],
            // Datos de trabajador
            especialidades: [[]],
            categoria: ['Peluquería', Validators.required],
            descripcion: [''],
            experiencia: [0, [Validators.min(0)]]
        });

        this.horarioForm = this.fb.group({});
        this.inicializarHorarioForm();
    }

    private inicializarHorarioForm(): void {
        this.diasSemana.forEach(dia => {
            this.horarioForm.addControl(`${dia.dia}_activo`, new FormControl(dia.activo));
            this.horarioForm.addControl(`${dia.dia}_inicio`, new FormControl(dia.inicio));
            this.horarioForm.addControl(`${dia.dia}_fin`, new FormControl(dia.fin));
        });
    }

    toggleEspecialidad(especialidad: string): void {
        const especialidadesControl = this.trabajadorForm.get('especialidades');
        if (!especialidadesControl) return;

        const currentEspecialidades: string[] = especialidadesControl.value || [];
        const index = currentEspecialidades.indexOf(especialidad);

        if (index >= 0) {
            currentEspecialidades.splice(index, 1);
        } else {
            currentEspecialidades.push(especialidad);
        }

        especialidadesControl.setValue([...currentEspecialidades]);
    }

    isEspecialidadSelected(especialidad: string): boolean {
        const especialidades: string[] = this.trabajadorForm.get('especialidades')?.value || [];
        return especialidades.includes(especialidad);
    }

    getHorarioLaboralObject(): any {
        const horario: any = {};
        let tieneDiasActivos = false;

        this.diasSemana.forEach(dia => {
            const activo = this.horarioForm.get(`${dia.dia}_activo`)?.value;
            if (activo) {
                tieneDiasActivos = true;
                horario[dia.dia] = {
                    inicio: this.horarioForm.get(`${dia.dia}_inicio`)?.value,
                    fin: this.horarioForm.get(`${dia.dia}_fin`)?.value
                };
            }
        });

        // Si no hay días activos, retornar null
        return tieneDiasActivos ? horario : null;
    }

    onSubmit(): void {
        if (this.trabajadorForm.valid) {
            this.loading = true;

            const formValue = this.trabajadorForm.value;
            const trabajadorData: CrearTrabajadorRequest = {
                email: formValue.email,
                password: formValue.password,
                nombre: formValue.nombre,
                apellidos: formValue.apellidos,
                telefono: formValue.telefono,
                direccion: formValue.direccion,
                especialidades: formValue.especialidades,
                categoria: formValue.categoria,
                descripcion: formValue.descripcion,
                experiencia: formValue.experiencia,
                horario_laboral: this.getHorarioLaboralObject()
            };

            console.log('📤 [DIALOG] Enviando datos:', trabajadorData);

            this.trabajadorService.crearTrabajador(trabajadorData).subscribe({
                next: (response) => {
                    this.loading = false;
                    this.snackBar.open('✅ Trabajador creado exitosamente', 'Cerrar', {
                        duration: 5000,
                        panelClass: ['snackbar-success']
                    });
                    this.dialogRef.close(true);
                },
                error: (error) => {
                    this.loading = false;
                    console.error('❌ Error creando trabajador:', error);
                    this.snackBar.open('❌ Error al crear el trabajador: ' + error.message, 'Cerrar', {
                        duration: 5000,
                        panelClass: ['snackbar-error']
                    });
                }
            });
        } else {
            this.snackBar.open('❌ Por favor, completa todos los campos requeridos', 'Cerrar', {
                duration: 5000,
                panelClass: ['snackbar-error']
            });
        }
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}