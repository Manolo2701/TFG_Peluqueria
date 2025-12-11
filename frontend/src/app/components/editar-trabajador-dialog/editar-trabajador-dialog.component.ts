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
import { Trabajador } from '../../interfaces/trabajador.interface';

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
    selector: 'app-editar-trabajador-dialog',
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
    templateUrl: './editar-trabajador-dialog.component.html',
    styleUrls: ['./editar-trabajador-dialog.component.scss']
})
export class EditarTrabajadorDialogComponent implements OnInit, OnDestroy {
    trabajadorForm: FormGroup;
    loading = false;
    esAdministrador = false;
    esAdministradorHibrido = false;
    mostrarCambioPassword = false;
    mostrarBotonPassword = true;

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
        public dialogRef: MatDialogRef<EditarTrabajadorDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { trabajador: Trabajador }
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
            nombre: ['', [Validators.required, Validators.minLength(2)]],
            apellidos: ['', [Validators.required, Validators.minLength(2)]],
            telefono: ['', [this.phoneValidator.bind(this)]],
            direccion: [''],
            newPassword: ['', [
                Validators.minLength(6),
                Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/)
            ]],
            confirmPassword: [''],
            especialidades: [[], [Validators.required, this.especialidadesValidasValidator.bind(this)]],
            categoria: ['', [Validators.required, this.categoriaValidaValidator.bind(this)]],
            descripcion: [''],
            experiencia: [0, [Validators.min(0), Validators.max(50)]]
        }, { validators: this.passwordMatchValidator.bind(this) });

        this.horarioForm = this.fb.group({});
    }

    private categoriaValidaValidator(control: AbstractControl): ValidationErrors | null {
        const categoria = control.value;
        if (categoria && !this.categorias.includes(categoria)) {
            return { categoriaInvalida: true };
        }
        return null;
    }

    private especialidadesValidasValidator(control: AbstractControl): ValidationErrors | null {
        const especialidades: string[] = control.value || [];
        const categoria = this.trabajadorForm?.get('categoria')?.value;

        if (!categoria || especialidades.length === 0) {
            return null;
        }

        const especialidadesValidas = this.especialidadesPorCategoria[categoria] || [];
        const especialidadesInvalidas = especialidades.filter(esp => !especialidadesValidas.includes(esp));

        if (especialidadesInvalidas.length > 0) {
            return { especialidadesInvalidas: true };
        }

        return null;
    }

    ngOnInit(): void {
        const rolEncontrado = this.data.trabajador.rol;
        const esAdminValores = ['administrador', 'admin', 'administrator', 'ADMIN', 'ADMINISTRADOR'];
        this.esAdministrador = false;

        if (rolEncontrado) {
            const rolString = String(rolEncontrado).toLowerCase();
            this.esAdministrador = esAdminValores.some(valor => rolString.includes(valor));
        }

        this.esAdministradorHibrido = this.esAdministrador && !!this.data.trabajador.id;

        if (this.esAdministradorHibrido) {
            this.mostrarBotonPassword = false;
            this.mostrarCambioPassword = false;
        }

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
                    const categoriaActual = this.data.trabajador.categoria;
                    const categoriaDefault = categoriaActual && this.categorias.includes(categoriaActual)
                        ? categoriaActual
                        : this.categorias[0];

                    this.trabajadorForm.get('categoria')?.setValue(categoriaDefault);
                    this.actualizarEspecialidadesPorCategoria(categoriaDefault);
                }
            },
            error: (error) => {
                console.error('Error cargando categorías y especialidades:', error);
                this.snackBar.open('No se pudieron cargar las categorías. Usando valores por defecto.', 'Cerrar', {
                    duration: 3000,
                    panelClass: ['snackbar-warning']
                });

                this.especialidadesPorCategoria = {
                    'Peluquería': [
                        'Cortes de cabello',
                        'Coloración',
                        'Mechas',
                        'Tratamientos capilares',
                        'Peinados'
                    ],
                    'Estética': [
                        'Maquillaje',
                        'Depilación',
                        'Cuidado facial',
                        'Uñas',
                        'Masajes relajantes',
                        'Masajes terapéuticos'
                    ]
                };
                this.categorias = ['Peluquería', 'Estética'];
            }
        });
    }

    private cargarConfiguracionHorarios(): void {
        this.configSub = this.configuracionService.getConfiguracionPublica().subscribe({
            next: (config: any) => {
                const configuracion: ConfiguracionPublica = config.data || config;
                this.actualizarDiasDesdeConfiguracion(configuracion);
                this.cargarDatosTrabajador();
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
                this.cargarDatosTrabajador();
            }
        });
    }

    private actualizarDiasDesdeConfiguracion(config: ConfiguracionPublica): void {
        const horarioApertura = this.formatearHora(config.horario_apertura);
        const horarioCierre = this.formatearHora(config.horario_cierre);

        let diasTrabajador: string[] = [];
        if (this.data.trabajador.horario_laboral) {
            const horario = typeof this.data.trabajador.horario_laboral === 'string'
                ? JSON.parse(this.data.trabajador.horario_laboral)
                : this.data.trabajador.horario_laboral;
            diasTrabajador = Object.keys(horario);
        }

        const todosLosDias = [...new Set([...config.dias_apertura, ...diasTrabajador])];

        this.diasSemana = todosLosDias
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

    private cargarDatosTrabajador(): void {
        const especialidadesParsed = this.parseEspecialidades(this.data.trabajador.especialidades);
        const emailCompleto = this.data.trabajador.email;
        const emailPrefix = emailCompleto ? emailCompleto.replace('@selene.com', '') : '';

        const categoriaTrabajador = this.data.trabajador.categoria ||
            (this.categorias.length > 0 ? this.categorias[0] : '');

        this.trabajadorForm.patchValue({
            emailPrefix: emailPrefix,
            emailFull: emailCompleto,
            nombre: this.data.trabajador.nombre,
            apellidos: this.data.trabajador.apellidos,
            telefono: this.data.trabajador.telefono || '',
            direccion: this.data.trabajador.direccion || '',
            especialidades: especialidadesParsed,
            categoria: categoriaTrabajador,
            descripcion: this.data.trabajador.descripcion || '',
            experiencia: this.data.trabajador.experiencia || 0
        });

        this.actualizarEspecialidadesPorCategoria(categoriaTrabajador);

        if (this.esAdministradorHibrido) {
            const camposPersonales = ['emailPrefix', 'emailFull', 'nombre', 'apellidos', 'telefono', 'direccion'];
            camposPersonales.forEach(campo => {
                const control = this.trabajadorForm.get(campo);
                if (control) {
                    control.disable({ onlySelf: true, emitEvent: false });
                }
            });

            this.trabajadorForm.get('newPassword')?.disable({ onlySelf: true, emitEvent: false });
            this.trabajadorForm.get('confirmPassword')?.disable({ onlySelf: true, emitEvent: false });

            this.trabajadorForm.get('emailPrefix')?.clearValidators();
            this.trabajadorForm.get('emailPrefix')?.updateValueAndValidity({ onlySelf: true, emitEvent: false });

            this.trabajadorForm.get('nombre')?.clearValidators();
            this.trabajadorForm.get('nombre')?.updateValueAndValidity({ onlySelf: true, emitEvent: false });

            this.trabajadorForm.get('apellidos')?.clearValidators();
            this.trabajadorForm.get('apellidos')?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        }

        if (this.data.trabajador.horario_laboral) {
            this.cargarHorarioExistente(this.data.trabajador.horario_laboral);
        }
    }

    private actualizarEspecialidadesPorCategoria(categoria: string): void {
        this.especialidadesList = this.especialidadesPorCategoria[categoria] || [];

        const especialidadesActuales: string[] = this.trabajadorForm.get('especialidades')?.value || [];
        const especialidadesFiltradas = especialidadesActuales.filter(esp =>
            this.especialidadesList.includes(esp)
        );

        this.trabajadorForm.get('especialidades')?.setValue(especialidadesFiltradas);
        this.trabajadorForm.get('especialidades')?.updateValueAndValidity();
    }

    private parseEspecialidades(especialidades: string | string[]): string[] {
        if (Array.isArray(especialidades)) {
            return especialidades;
        }

        if (typeof especialidades === 'string') {
            try {
                const parsed = JSON.parse(especialidades);
                return Array.isArray(parsed) ? parsed : [especialidades];
            } catch {
                if (especialidades.includes(',')) {
                    return especialidades.split(',').map(esp => esp.trim()).filter(esp => esp !== '');
                }
                return [especialidades];
            }
        }

        return [];
    }

    private cargarHorarioExistente(horarioData: any): void {
        try {
            const horario = typeof horarioData === 'string' ? JSON.parse(horarioData) : horarioData;

            this.diasSemana.forEach(dia => {
                if (horario[dia.dia]) {
                    const inicioControl = this.horarioForm.get(`${dia.dia}_inicio`);
                    const finControl = this.horarioForm.get(`${dia.dia}_fin`);
                    const activoControl = this.horarioForm.get(`${dia.dia}_activo`);

                    if (inicioControl) inicioControl.setValue(this.formatearHora(horario[dia.dia].inicio));
                    if (finControl) finControl.setValue(this.formatearHora(horario[dia.dia].fin));
                    if (activoControl) activoControl.setValue(true);
                } else {
                    const activoControl = this.horarioForm.get(`${dia.dia}_activo`);
                    if (activoControl) activoControl.setValue(false);
                }
            });
        } catch (error) {
            console.error('Error cargando horario existente del trabajador:', error);
        }
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

    private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
        const newPassword = control.get('newPassword')?.value;
        const confirmPassword = control.get('confirmPassword')?.value;

        if (newPassword && confirmPassword && newPassword !== confirmPassword) {
            return { passwordMismatch: true };
        }
        return null;
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
        especialidadesControl.updateValueAndValidity();
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

    toggleCambioPassword(): void {
        this.mostrarCambioPassword = !this.mostrarCambioPassword;

        if (!this.mostrarCambioPassword) {
            this.trabajadorForm.patchValue({
                newPassword: '',
                confirmPassword: ''
            });
            this.trabajadorForm.updateValueAndValidity();
        }
    }

    onSubmit(): void {
        Object.keys(this.trabajadorForm.controls).forEach(key => {
            const control = this.trabajadorForm.get(key);
            control?.markAsTouched();
        });

        if (this.trabajadorForm.valid) {
            const formValue = this.trabajadorForm.getRawValue();

            // Validación adicional en el frontend
            if (!this.categorias.includes(formValue.categoria)) {
                this.snackBar.open('La categoría seleccionada no es válida. Por favor, selecciona una categoría existente.', 'Cerrar', {
                    duration: 5000,
                    panelClass: ['snackbar-error']
                });
                return;
            }

            const especialidadesValidas = this.especialidadesPorCategoria[formValue.categoria] || [];
            const especialidadesInvalidas = formValue.especialidades.filter((esp: string) => !especialidadesValidas.includes(esp));

            if (especialidadesInvalidas.length > 0) {
                this.snackBar.open('Algunas especialidades seleccionadas no son válidas para esta categoría.', 'Cerrar', {
                    duration: 5000,
                    panelClass: ['snackbar-error']
                });
                return;
            }

            this.loading = true;
            const emailCompleto = formValue.emailFull;

            const trabajadorData: any = {
                especialidades: formValue.especialidades,
                categoria: formValue.categoria,
                descripcion: formValue.descripcion || '',
                experiencia: formValue.experiencia,
                horario_laboral: this.getHorarioLaboralObject()
            };

            if (!this.esAdministradorHibrido) {
                trabajadorData.email = emailCompleto;
                trabajadorData.nombre = formValue.nombre;
                trabajadorData.apellidos = formValue.apellidos;
                trabajadorData.telefono = formValue.telefono || '';
                trabajadorData.direccion = formValue.direccion || '';

                if (formValue.newPassword) {
                    trabajadorData.newPassword = formValue.newPassword;
                }
            }

            console.log('📤 [DIALOG-EDIT] Enviando datos actualizados:', trabajadorData);

            this.trabajadorService.actualizarTrabajador(this.data.trabajador.id, trabajadorData).subscribe({
                next: (response) => {
                    this.loading = false;
                    this.snackBar.open('✅ Trabajador actualizado exitosamente', 'Cerrar', {
                        duration: 5000,
                        panelClass: ['snackbar-success']
                    });
                    this.dialogRef.close(true);
                },
                error: (error) => {
                    this.loading = false;
                    console.error('❌ Error completo al actualizar trabajador:', error);

                    let mensaje = 'Error al actualizar el trabajador';

                    // Intentar obtener el mensaje de error del backend
                    if (error.error) {
                        if (typeof error.error === 'string') {
                            try {
                                const errorObj = JSON.parse(error.error);
                                mensaje = errorObj.error || errorObj.mensaje || mensaje;
                            } catch {
                                mensaje = error.error;
                            }
                        } else if (error.error.error) {
                            mensaje = error.error.error;
                        } else if (error.error.mensaje) {
                            mensaje = error.error.mensaje;
                        }
                    }

                    // Mostrar mensaje específico para categoría inválida
                    if (mensaje.toLowerCase().includes('categoría') || mensaje.toLowerCase().includes('categoria')) {
                        mensaje = 'Error: La categoría seleccionada no es válida en el sistema. Por favor, contacta con el administrador.';
                    }

                    this.snackBar.open(`❌ ${mensaje}`, 'Cerrar', {
                        duration: 5000,
                        panelClass: ['snackbar-error']
                    });
                }
            });
        } else {
            const erroresCategoria = this.trabajadorForm.get('categoria')?.errors;
            const erroresEspecialidades = this.trabajadorForm.get('especialidades')?.errors;

            if (erroresCategoria?.['categoriaInvalida']) {
                this.snackBar.open('La categoría seleccionada no es válida. Por favor, selecciona una categoría existente.', 'Cerrar', {
                    duration: 5000,
                    panelClass: ['snackbar-error']
                });
            } else if (erroresEspecialidades?.['especialidadesInvalidas']) {
                this.snackBar.open('Algunas especialidades seleccionadas no son válidas para esta categoría.', 'Cerrar', {
                    duration: 5000,
                    panelClass: ['snackbar-error']
                });
            } else {
                this.snackBar.open('❌ Por favor, corrige los errores en el formulario', 'Cerrar', {
                    duration: 5000,
                    panelClass: ['snackbar-error']
                });
            }
        }
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    get emailPrefixControl() { return this.trabajadorForm.get('emailPrefix'); }
    get emailFullControl() { return this.trabajadorForm.get('emailFull'); }
    get nombreControl() { return this.trabajadorForm.get('nombre'); }
    get apellidosControl() { return this.trabajadorForm.get('apellidos'); }
    get telefonoControl() { return this.trabajadorForm.get('telefono'); }
    get experienciaControl() { return this.trabajadorForm.get('experiencia'); }
    get especialidadesControl() { return this.trabajadorForm.get('especialidades'); }
    get newPasswordControl() { return this.trabajadorForm.get('newPassword'); }
    get confirmPasswordControl() { return this.trabajadorForm.get('confirmPassword'); }
}