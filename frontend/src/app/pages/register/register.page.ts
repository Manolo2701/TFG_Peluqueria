import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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

  registerForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    telefono: [''],
    direccion: ['']
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

  onSubmit(): void {
    if (this.registerForm.valid) {
      // ✅ Verificación adicional de tipos
      const formValues = this.registerForm.value;

      if (!formValues.nombre || !formValues.apellidos || !formValues.email || !formValues.password) {
        this.errorMessage = 'Por favor completa todos los campos obligatorios';
        return;
      }

      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const registerData: RegisterRequest = {
        nombre: formValues.nombre,
        apellidos: formValues.apellidos,
        email: formValues.email,
        password: formValues.password,
        telefono: formValues.telefono || undefined,
        direccion: formValues.direccion || undefined,
        rol: 'cliente'
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
}