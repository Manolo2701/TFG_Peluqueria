import { Component, inject, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-forgot-password-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './forgot-password-modal.component.html',
    styleUrls: ['./forgot-password-modal.component.scss']
})
export class ForgotPasswordModalComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);

    @Output() closeModal = new EventEmitter<void>();

    // Formulario para solicitar recuperación
    forgotPasswordForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        respuestaSeguridad: ['', [Validators.required]]
    });

    // Formulario para nueva contraseña
    newPasswordForm = this.fb.group({
        nuevaPassword: ['', [Validators.required, Validators.minLength(6), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/)]],
        confirmarPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });

    loading = false;
    step: 'email' | 'question' | 'reset' = 'email';
    errorMessage = '';
    successMessage = '';
    preguntaSeguridad = '';
    resetToken = '';

    // Getters para los controles del formulario
    get email() { return this.forgotPasswordForm.get('email')!; }
    get respuestaSeguridad() { return this.forgotPasswordForm.get('respuestaSeguridad')!; }
    get nuevaPassword() { return this.newPasswordForm.get('nuevaPassword')!; }
    get confirmarPassword() { return this.newPasswordForm.get('confirmarPassword')!; }

    // Validador para coincidencia de contraseñas
    private passwordMatchValidator(group: FormGroup) {
        const password = group.get('nuevaPassword')?.value;
        const confirmPassword = group.get('confirmarPassword')?.value;
        return password === confirmPassword ? null : { mismatch: true };
    }

    // Paso 1: Verificar email y mostrar pregunta
    onSubmit(): void {
        if (this.forgotPasswordForm.get('email')?.invalid) {
            this.errorMessage = 'Por favor ingresa un email válido';
            return;
        }

        this.loading = true;
        this.errorMessage = '';
        this.successMessage = '';

        const email = this.email.value!.toLowerCase().trim();

        // Llamar al backend para obtener la pregunta
        this.authService.obtenerPreguntaSeguridad(email).subscribe({
            next: (response) => {
                this.loading = false;
                this.preguntaSeguridad = response.preguntaSeguridad;
                this.step = 'question';
            },
            error: (error) => {
                this.loading = false;
                this.errorMessage = error.error?.mensaje || 'Error al obtener la pregunta de seguridad';
            }
        });
    }

    // Paso 2: Verificar respuesta
    verifyAnswer(): void {
        if (this.respuestaSeguridad.invalid) {
            this.errorMessage = 'Por favor ingresa tu respuesta';
            return;
        }

        this.loading = true;
        const email = this.email.value!.toLowerCase().trim();
        const respuesta = this.respuestaSeguridad.value!.trim();

        this.authService.verificarRespuestaSeguridad({
            email,
            respuestaSeguridad: respuesta
        }).subscribe({
            next: (response) => {
                this.loading = false;
                this.resetToken = response.resetToken; // Guardar el token
                this.step = 'reset';
                this.errorMessage = '';
            },
            error: (error) => {
                this.loading = false;
                this.errorMessage = error.error?.mensaje || 'Respuesta incorrecta';
            }
        });
    }

    // Paso 3: Cambiar contraseña
    changePassword(): void {
        if (this.newPasswordForm.invalid) {
            if (this.newPasswordForm.errors?.['mismatch']) {
                this.errorMessage = 'Las contraseñas no coinciden';
            } else {
                this.errorMessage = 'La contraseña debe tener al menos 6 caracteres con letra y número';
            }
            return;
        }

        this.loading = true;
        const nuevaPassword = this.nuevaPassword.value!;

        this.authService.resetearPassword({
            resetToken: this.resetToken!,
            nuevaPassword
        }).subscribe({
            next: (response: any) => {
                this.loading = false;
                this.successMessage = '¡Contraseña cambiada exitosamente! Ya puedes iniciar sesión con tu nueva contraseña.';

                setTimeout(() => {
                    this.resetAndClose();
                }, 3000);
            },
            error: (error) => {
                this.loading = false;
                this.errorMessage = error.error?.mensaje || 'Error al cambiar la contraseña';
            }
        });
    }

    // Volver al paso anterior
    goBack(): void {
        if (this.step === 'question') {
            this.step = 'email';
            this.errorMessage = '';
        } else if (this.step === 'reset') {
            this.step = 'question';
            this.errorMessage = '';
        }
    }

    close(): void {
        this.closeModal.emit();
    }

    resetAndClose(): void {
        this.forgotPasswordForm.reset();
        this.newPasswordForm.reset();
        this.step = 'email';
        this.errorMessage = '';
        this.successMessage = '';
        this.loading = false;
        this.resetToken = '';
        this.close();
    }
}