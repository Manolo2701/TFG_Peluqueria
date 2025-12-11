import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

// Services
import { UsuarioService, PerfilResponse, ActualizarPerfilRequest } from '../../core/services/usuario.service';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-mi-perfil',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatDividerModule
    ],
    templateUrl: './mi-perfil.page.html',
    styleUrls: ['./mi-perfil.page.scss']
})
export class MiPerfilPage implements OnInit, OnDestroy {
    perfilForm: FormGroup;
    perfilData: PerfilResponse | null = null;
    loading = false;
    guardando = false;
    mostrarCambioPassword = false;
    usuario: any = null;
    error: string | null = null;
    private subs: Subscription[] = [];

    constructor(
        private fb: FormBuilder,
        private usuarioService: UsuarioService,
        private authService: AuthService,
        private router: Router,
        private snackBar: MatSnackBar
    ) {
        console.log('🔧 [MI-PERFIL] URL de API:', environment.apiUrl);

        this.perfilForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(2)]],
            apellidos: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            telefono: ['', [this.phoneValidator]],
            direccion: [''],
            currentPassword: [''],
            newPassword: ['', [
                Validators.minLength(6),
                Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)
            ]],
            confirmPassword: ['']
        }, { validators: [this.passwordMatchValidator, this.passwordChangeValidator] });
    }

    ngOnInit(): void {
        console.log('🔧 [MI-PERFIL] Inicializando componente...');

        // Verificar permisos
        const userSub = this.authService.usuarioActual$.subscribe(usuario => {
            this.usuario = usuario;

            console.log('🔧 [MI-PERFIL] Usuario actual:', usuario);

            if (!usuario) {
                console.log('🔧 [MI-PERFIL] No hay usuario, redirigiendo a login');
                this.router.navigate(['/login']);
                return;
            }

            // Solo clientes y administradores pueden acceder
            if (usuario.rol === 'trabajador') {
                console.log('🔧 [MI-PERFIL] Usuario es trabajador, redirigiendo a dashboard');
                this.mostrarError('Los trabajadores no pueden acceder a esta página');
                this.router.navigate(['/dashboard']);
                return;
            }

            console.log('🔧 [MI-PERFIL] Usuario puede acceder al perfil, cargando datos...');
            this.cargarPerfil();
        });
        this.subs.push(userSub);
    }

    // Validador de teléfono (igual que en registro)
    phoneValidator(control: AbstractControl): ValidationErrors | null {
        const value = control.value;

        if (!value || value.trim() === '') {
            return null; // Teléfono es opcional
        }

        // Limpiar espacios y guiones
        const cleaned = value.replace(/\s+/g, '').replace(/-/g, '');

        // Verificar que solo contenga números y opcionalmente prefijo
        const phonePattern = /^(\+34|0034|34)?[6789]\d{8}$/;

        if (!phonePattern.test(cleaned)) {
            return { phoneInvalid: true };
        }

        // Contar solo los dígitos (sin prefijo)
        const digitsOnly = cleaned.replace(/\D/g, '');

        if (digitsOnly.length < 9 || digitsOnly.length > 12) {
            return { phoneInvalidLength: true };
        }

        return null;
    }

    // Validador para coincidencia de contraseñas
    passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
        const newPassword = control.get('newPassword')?.value;
        const confirmPassword = control.get('confirmPassword')?.value;

        if (newPassword && confirmPassword && newPassword !== confirmPassword) {
            return { passwordMismatch: true };
        }
        return null;
    }

    // Validador para cambio de contraseña
    passwordChangeValidator(control: AbstractControl): ValidationErrors | null {
        const newPassword = control.get('newPassword')?.value;
        const confirmPassword = control.get('confirmPassword')?.value;
        const currentPassword = control.get('currentPassword')?.value;

        // Si se está intentando cambiar la contraseña
        if (newPassword || confirmPassword) {
            // Se requiere la contraseña actual
            if (!currentPassword) {
                return { currentPasswordRequired: true };
            }

            // Ambas contraseñas nuevas deben estar presentes
            if (!newPassword || !confirmPassword) {
                return { bothPasswordsRequired: true };
            }
        }

        return null;
    }

    // Obtener el primer nombre para mostrar
    get primerNombre(): string {
        if (!this.perfilData?.nombre) return 'Usuario';
        return this.perfilData.nombre.split(' ')[0] || 'Usuario';
    }

    cargarPerfil(): void {
        this.loading = true;
        this.error = null;
        console.log('🔧 [MI-PERFIL] Cargando perfil...');

        this.usuarioService.obtenerPerfilCompleto().subscribe({
            next: (data) => {
                console.log('✅ [MI-PERFIL] Perfil cargado:', data);
                this.perfilData = data;
                this.perfilForm.patchValue({
                    nombre: data.nombre,
                    apellidos: data.apellidos || '',
                    email: data.email,
                    telefono: data.telefono || '',
                    direccion: data.direccion || ''
                });
                this.loading = false;
            },
            error: (error) => {
                console.error('❌ [MI-PERFIL] Error cargando perfil:', error);
                console.error('❌ [MI-PERFIL] Detalles del error:', error.status, error.statusText);
                console.error('❌ [MI-PERFIL] URL intentada:', error.url);

                this.error = 'Error al cargar los datos del perfil: ' + (error.statusText || error.message);
                this.mostrarError(this.error);
                this.loading = false;
            }
        });
    }

    formatearFecha(fecha: string): string {
        if (!fecha) return 'No disponible';
        try {
            const date = new Date(fecha);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return fecha;
        }
    }

    toggleCambioPassword(): void {
        this.mostrarCambioPassword = !this.mostrarCambioPassword;

        if (!this.mostrarCambioPassword) {
            this.perfilForm.patchValue({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            this.perfilForm.updateValueAndValidity();
        }
    }

    onSubmit(): void {
        if (this.perfilForm.invalid) {
            this.mostrarError('Por favor, corrige los errores en el formulario');

            // Marcar todos los campos como tocados para mostrar errores
            Object.keys(this.perfilForm.controls).forEach(key => {
                const control = this.perfilForm.get(key);
                control?.markAsTouched();
            });

            return;
        }

        const formValue = this.perfilForm.value;

        this.guardando = true;
        console.log('🔧 [MI-PERFIL] Enviando datos para actualizar:', formValue);

        const datosActualizacion: ActualizarPerfilRequest = {
            nombre: formValue.nombre,
            apellidos: formValue.apellidos,
            email: formValue.email,
            telefono: formValue.telefono || '',
            direccion: formValue.direccion || ''
        };

        // Solo incluir passwords si se están cambiando
        if (formValue.newPassword && formValue.currentPassword) {
            datosActualizacion.currentPassword = formValue.currentPassword;
            datosActualizacion.newPassword = formValue.newPassword;
        }

        this.usuarioService.actualizarPerfil(datosActualizacion).subscribe({
            next: (response) => {
                console.log('✅ [MI-PERFIL] Perfil actualizado:', response);
                this.guardando = false;
                this.mostrarExito('Perfil actualizado correctamente');

                // Actualizar datos en el auth service
                const usuarioActualizado = response.usuario || response;
                this.authService.actualizarUsuarioLocal(usuarioActualizado);

                // Resetear campos de contraseña
                this.perfilForm.patchValue({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                this.mostrarCambioPassword = false;
                this.perfilForm.updateValueAndValidity();

                // Recargar perfil para obtener datos actualizados
                this.cargarPerfil();
            },
            error: (error) => {
                console.error('❌ [MI-PERFIL] Error actualizando perfil:', error);
                console.error('❌ [MI-PERFIL] Detalles:', error.status, error.statusText);

                this.guardando = false;
                const mensaje = error.error?.error || error.error?.mensaje || error.message || 'Error al actualizar el perfil';
                this.mostrarError(mensaje);
            }
        });
    }

    mostrarExito(mensaje: string): void {
        this.snackBar.open(mensaje, 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-success']
        });
    }

    mostrarError(mensaje: string): void {
        this.snackBar.open(mensaje, 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error']
        });
    }

    // Getters para acceder fácilmente a los controles del formulario
    get nombreControl() {
        return this.perfilForm.get('nombre');
    }

    get apellidosControl() {
        return this.perfilForm.get('apellidos');
    }

    get emailControl() {
        return this.perfilForm.get('email');
    }

    get telefonoControl() {
        return this.perfilForm.get('telefono');
    }

    get newPasswordControl() {
        return this.perfilForm.get('newPassword');
    }

    get confirmPasswordControl() {
        return this.perfilForm.get('confirmPassword');
    }

    get currentPasswordControl() {
        return this.perfilForm.get('currentPassword');
    }

    // Método para volver al dashboard
    volverAlDashboard(): void {
        this.router.navigate(['/dashboard']);
    }

    ngOnDestroy(): void {
        this.subs.forEach(sub => sub.unsubscribe());
    }
}