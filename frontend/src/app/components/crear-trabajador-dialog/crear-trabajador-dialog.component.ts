import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Subscription } from 'rxjs';

import { TrabajadorService } from '../../core/services/trabajador.service';
import { ConfiguracionService, CategoriasEspecialidades } from '../../core/services/configuracion.service';
import { CrearTrabajadorRequest } from '../../interfaces/trabajador.interface';

interface HorarioDia {
    dia: string;
    nombre: string;
    activo: boolean;
    inicio: string;
    fin: string;
}

interface ConfiguracionPublica {
    nombre_negocio: string;
    horario_apertura: string;
    horario_cierre: string;
    dias_apertura: string[];
}

const MAPA_DIAS = {
    lunes: { key: 'lunes', nombre: 'Lunes' },
    martes: { key: 'martes', nombre: 'Martes' },
    miercoles: { key: 'miercoles', nombre: 'Miércoles' },
    jueves: { key: 'jueves', nombre: 'Jueves' },
    viernes: { key: 'viernes', nombre: 'Viernes' },
    sabado: { key: 'sabado', nombre: 'Sábado' },
    domingo: { key: 'domingo', nombre: 'Domingo' }
};

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
export class CrearTrabajadorDialogComponent implements OnInit, OnDestroy {
    trabajadorForm: FormGroup;
    loading = false;

    categorias: string[] = [];
    especialidadesPorCategoria: CategoriasEspecialidades = {};
    especialidadesList: string[] = [];

    diasSemana: HorarioDia[] = [];
    horarioForm: FormGroup;

    private configSub?: Subscription;
    private categoriasSub?: Subscription;

    constructor(
        private fb: FormBuilder,
        private trabajadorService: TrabajadorService,
        private configuracionService: ConfiguracionService,
        private snackBar: MatSnackBar,
        public dialogRef: MatDialogRef<CrearTrabajadorDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.trabajadorForm = this.fb.group({
            emailPrefix: ['', [
                Validators.required,
                Validators.minLength(3),
                Validators.maxLength(30),
                Validators.pattern(/^[a-zA-Z0-9._-]+$/),
                this.noAtSignValidator.bind(this)
            ]],
            emailFull: [{ value: '', disabled: true }],
            password: ['', [
                Validators.required,
                Validators.minLength(6),
                Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/)
            ]],
            nombre: ['', [Validators.required, Validators.minLength(2)]],
            apellidos: ['', [Validators.required, Validators.minLength(2)]],
            telefono: ['', [this.phoneValidator.bind(this)]],
            direccion: [''],
            especialidades: [[], Validators.required],
            categoria: ['', Validators.required],
            descripcion: [''],
            experiencia: [0, [Validators.min(0), Validators.max(50)]]
        });

        this.horarioForm = this.fb.group({});
    }

    private noAtSignValidator(control: AbstractControl): ValidationErrors | null {
        const value = control.value;
        if (value && value.includes('@')) {
            return { containsAtSign: true };
        }
        return null;
    }

    private phoneValidator(control: AbstractControl): ValidationErrors | null {
        const value = control.value;

        if (!value || value.trim() === '') {
            return null;
        }

        const cleaned = value.replace(/\s+/g, '').replace(/-/g, '');
        const phonePattern = /^(\+34|0034|34)?[6789]\d{8}$/;

        if (!phonePattern.test(cleaned)) {
            return { phoneInvalid: true };
        }

        return null;
    }

    ngOnInit(): void {
        this.cargarCategoriasEspecialidades();
        this.cargarConfiguracionHorarios();

        this.trabajadorForm.get('categoria')?.valueChanges.subscribe(categoria => {
            this.actualizarEspecialidadesPorCategoria(categoria);
        });

        this.trabajadorForm.get('emailPrefix')?.valueChanges.subscribe(prefix => {
            const emailCompleto = prefix ? `${prefix}@selene.com` : '';
            this.trabajadorForm.get('emailFull')?.setValue(emailCompleto);
        });
    }

    ngOnDestroy(): void {
        if (this.configSub) {
            this.configSub.unsubscribe();
        }
        if (this.categoriasSub) {
            this.categoriasSub.unsubscribe();
        }
    }

    private cargarCategoriasEspecialidades(): void {
        this.categoriasSub = this.configuracionService.getCategoriasEspecialidades().subscribe({
            next: (data: CategoriasEspecialidades) => {
                this.especialidadesPorCategoria = data;
                this.categorias = Object.keys(data);

                if (this.categorias.length > 0) {
                    const categoriaDefault = this.categorias[0];

                    this.trabajadorForm.get('categoria')?.setValue(categoriaDefault);
                    this.actualizarEspecialidadesPorCategoria(categoriaDefault);
                } else {
                    this.snackBar.open('No hay categorías configuradas en el sistema', 'Cerrar', {
                        duration: 3000,
                        panelClass: ['snackbar-warning']
                    });
                }
            },
            error: (error) => {
                console.error('Error cargando categorías y especialidades:', error);
                this.snackBar.open('No se pudieron cargar las categorías desde la base de datos', 'Cerrar', {
                    duration: 3000,
                    panelClass: ['snackbar-warning']
                });

                this.especialidadesPorCategoria = {};
                this.categorias = [];
            }
        });
    }

    private cargarConfiguracionHorarios(): void {
        this.configSub = this.configuracionService.getConfiguracionPublica().subscribe({
            next: (config: any) => {
                const configuracion: ConfiguracionPublica = config.data || config;
                this.actualizarDiasDesdeConfiguracion(configuracion);
            },
            error: (error) => {
                console.error('Error cargando configuración:', error);
                this.snackBar.open('No se pudieron cargar los horarios de configuración. Usando valores por defecto.', 'Cerrar', {
                    duration: 3000,
                    panelClass: ['snackbar-warning']
                });
                this.actualizarDiasDesdeConfiguracion({
                    nombre_negocio: 'Peluquería Selene',
                    horario_apertura: '09:30',
                    horario_cierre: '20:00',
                    dias_apertura: ['martes', 'miercoles', 'jueves', 'viernes', 'sabado']
                });
            }
        });
    }

    private actualizarDiasDesdeConfiguracion(config: ConfiguracionPublica): void {
        const horarioApertura = this.formatearHora(config.horario_apertura);
        const horarioCierre = this.formatearHora(config.horario_cierre);

        this.diasSemana = config.dias_apertura
            .filter(diaKey => MAPA_DIAS[diaKey as keyof typeof MAPA_DIAS])
            .map(diaKey => {
                const diaInfo = MAPA_DIAS[diaKey as keyof typeof MAPA_DIAS];
                return {
                    dia: diaInfo.key,
                    nombre: diaInfo.nombre,
                    activo: false,
                    inicio: horarioApertura,
                    fin: horarioCierre
                };
            })
            .sort((a, b) => {
                const orden = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
                return orden.indexOf(a.dia) - orden.indexOf(b.dia);
            });

        this.reconstruirHorarioForm();
    }

    private formatearHora(hora: string): string {
        if (hora && hora.includes(':') && hora.split(':').length === 3) {
            const partes = hora.split(':');
            return `${partes[0]}:${partes[1]}`;
        }
        return hora || '09:30';
    }

    private reconstruirHorarioForm(): void {
        Object.keys(this.horarioForm.controls).forEach(key => {
            this.horarioForm.removeControl(key);
        });

        this.diasSemana.forEach(dia => {
            this.horarioForm.addControl(`${dia.dia}_activo`, new FormControl(dia.activo));
            this.horarioForm.addControl(`${dia.dia}_inicio`, new FormControl(dia.inicio));
            this.horarioForm.addControl(`${dia.dia}_fin`, new FormControl(dia.fin));
        });
    }

    private actualizarEspecialidadesPorCategoria(categoria: string): void {
        this.especialidadesList = this.especialidadesPorCategoria[categoria] || [];

        const especialidadesActuales: string[] = this.trabajadorForm.get('especialidades')?.value || [];
        const especialidadesFiltradas = especialidadesActuales.filter(esp =>
            this.especialidadesList.includes(esp)
        );

        this.trabajadorForm.get('especialidades')?.setValue(especialidadesFiltradas);
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
        especialidadesControl.markAsTouched();
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

        return tieneDiasActivos ? horario : null;
    }

    onSubmit(): void {
        Object.keys(this.trabajadorForm.controls).forEach(key => {
            const control = this.trabajadorForm.get(key);
            control?.markAsTouched();
        });

        if (this.trabajadorForm.valid) {
            this.loading = true;

            const formValue = this.trabajadorForm.getRawValue();
            const emailCompleto = formValue.emailFull;

            const trabajadorData: CrearTrabajadorRequest = {
                email: emailCompleto,
                password: formValue.password,
                nombre: formValue.nombre,
                apellidos: formValue.apellidos,
                telefono: formValue.telefono || '',
                direccion: formValue.direccion || '',
                especialidades: formValue.especialidades,
                categoria: formValue.categoria,
                descripcion: formValue.descripcion || '',
                experiencia: formValue.experiencia,
                horario_laboral: this.getHorarioLaboralObject()
            };

            this.trabajadorService.crearTrabajador(trabajadorData).subscribe({
                next: (response) => {
                    this.loading = false;
                    this.snackBar.open('Trabajador creado exitosamente', 'Cerrar', {
                        duration: 5000,
                        panelClass: ['snackbar-success']
                    });
                    this.dialogRef.close(true);
                },
                error: (error) => {
                    this.loading = false;
                    console.error('Error creando trabajador:', error);
                    const mensaje = error.error?.error || error.error?.mensaje || error.message || 'Error al crear el trabajador';
                    this.snackBar.open(`${mensaje}`, 'Cerrar', {
                        duration: 5000,
                        panelClass: ['snackbar-error']
                    });
                }
            });
        } else {
            this.snackBar.open('Por favor, corrige los errores en el formulario', 'Cerrar', {
                duration: 5000,
                panelClass: ['snackbar-error']
            });
        }
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    get emailPrefixControl() { return this.trabajadorForm.get('emailPrefix'); }
    get emailFullControl() { return this.trabajadorForm.get('emailFull'); }
    get passwordControl() { return this.trabajadorForm.get('password'); }
    get nombreControl() { return this.trabajadorForm.get('nombre'); }
    get apellidosControl() { return this.trabajadorForm.get('apellidos'); }
    get telefonoControl() { return this.trabajadorForm.get('telefono'); }
    get experienciaControl() { return this.trabajadorForm.get('experiencia'); }
    get especialidadesControl() { return this.trabajadorForm.get('especialidades'); }
}