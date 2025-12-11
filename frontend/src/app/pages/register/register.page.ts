import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RegisterRequest } from '../../interfaces/auth.interface';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss'
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Expresiones regulares mejoradas
  private emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Preguntas de seguridad predefinidas
  securityQuestions = [
    '¿Cuál es el nombre de tu primera mascota?',
    '¿Cuál es tu ciudad de nacimiento?',
    '¿Cuál es el nombre de tu mejor amigo de la infancia?',
    '¿Cuál es el segundo nombre de tu madre?',
    '¿En qué colegio estudiaste primaria?',
    '¿Cuál es tu película favorita?',
    '¿Cuál es tu deporte favorito?',
    '¿Cuál es el nombre de tu profesor favorito?'
  ];

  registerForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [
      Validators.required,
      Validators.email,
      this.emailValidator.bind(this)
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(6),
      Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/)
    ]],
    telefono: ['', [
      this.phoneValidator.bind(this)
    ]],
    direccion: [''],
    preguntaSeguridad: [this.securityQuestions[0], Validators.required],
    respuestaSeguridad: ['', [Validators.required, Validators.minLength(3)]]
  });

  loading = false;
  errorMessage = '';
  successMessage = '';

  // Getters para los controles del formulario
  get nombre() { return this.registerForm.get('nombre')!; }
  get apellidos() { return this.registerForm.get('apellidos')!; }
  get email() { return this.registerForm.get('email')!; }
  get password() { return this.registerForm.get('password')!; }
  get telefono() { return this.registerForm.get('telefono')!; }
  get direccion() { return this.registerForm.get('direccion')!; }
  get preguntaSeguridad() { return this.registerForm.get('preguntaSeguridad')!; }
  get respuestaSeguridad() { return this.registerForm.get('respuestaSeguridad')!; }

  // Validador personalizado para email
  private emailValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const email = control.value.trim().toLowerCase();

    if (!this.emailPattern.test(email)) {
      return { emailInvalid: true };
    }

    return null;
  }

  // Validador personalizado para teléfono - múltiples formatos
  private phoneValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value || control.value.trim() === '') {
      return null; // Teléfono es opcional
    }

    const phone = control.value.trim();
    const cleanedPhone = phone.replace(/[\s\-()]/g, '');

    if (!/^\d+$/.test(cleanedPhone)) {
      return { phoneInvalidFormat: true };
    }

    if (cleanedPhone.length < 9 || cleanedPhone.length > 12) {
      return { phoneInvalidLength: true };
    }

    if (cleanedPhone.startsWith('34') && cleanedPhone.length === 11) {
      const rest = cleanedPhone.substring(2);
      if (!/^[6-9]\d{8}$/.test(rest)) {
        return { phoneInvalid: true };
      }
    } else if (cleanedPhone.startsWith('0034') && cleanedPhone.length === 12) {
      const rest = cleanedPhone.substring(4);
      if (!/^[6-9]\d{8}$/.test(rest)) {
        return { phoneInvalid: true };
      }
    } else if (cleanedPhone.length === 9) {
      if (!/^[6-9]\d{8}$/.test(cleanedPhone)) {
        return { phoneInvalid: true };
      }
    } else {
      return { phoneInvalidFormat: true };
    }

    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const formValues = this.registerForm.value;

      if (!formValues.nombre || !formValues.apellidos || !formValues.email || !formValues.password ||
        !formValues.preguntaSeguridad || !formValues.respuestaSeguridad) {
        this.errorMessage = 'Por favor completa todos los campos obligatorios';
        return;
      }

      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      // Limpiar y formatear datos para el backend
      const registerData: RegisterRequest = {
        nombre: formValues.nombre.trim(),
        apellidos: formValues.apellidos.trim(),
        email: formValues.email.trim().toLowerCase(),
        password: formValues.password,
        telefono: formValues.telefono ? this.formatPhoneNumber(formValues.telefono) : undefined,
        direccion: formValues.direccion?.trim() || undefined,
        rol: 'cliente',
        preguntaSeguridad: formValues.preguntaSeguridad,
        respuestaSeguridad: formValues.respuestaSeguridad.trim()
      };

      this.authService.register(registerData).subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = '¡Cuenta creada exitosamente! Redirigiendo al login...';

          setTimeout(() => {
            this.router.navigate(['/login'], {
              queryParams: { registered: 'true' }
            });
          }, 2000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.mensaje || 'Error al crear la cuenta';
        }
      });
    }
  }

  // Método para formatear número de teléfono
  private formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[\s\-()]/g, '');

    if (cleaned.startsWith('0034') && cleaned.length === 12) {
      return `+34${cleaned.substring(4)}`;
    } else if (cleaned.startsWith('34') && cleaned.length === 11) {
      return `+${cleaned}`;
    } else if (cleaned.length === 9) {
      return `+34${cleaned}`;
    }

    return cleaned;
  }
}