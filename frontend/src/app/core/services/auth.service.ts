import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import {
  LoginRequest,
  AuthResponse,
  Usuario,
  RegisterRequest,
  RegisterResponse,
  SecurityQuestionRequest,
  SecurityQuestionResponse,
  VerifySecurityAnswerRequest,
  VerifySecurityAnswerResponse,
  ResetPasswordRequest
} from '../../interfaces/auth.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private usuarioActualSubject = new BehaviorSubject<Usuario | null>(null);
  public usuarioActual$ = this.usuarioActualSubject.asObservable();

  constructor() {
    this.cargarUsuarioDesdeStorage();
  }

  get usuarioActualValue(): Usuario | null {
    return this.usuarioActualSubject.value;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    console.log('🔗 URL de login:', `${this.apiUrl}/auth/login`); 
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        console.log('✅ Login exitoso:', response);
        this.guardarSesion(response);
      })
    );
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/registro`, userData);
  }

  // Obtener pregunta de seguridad
  obtenerPreguntaSeguridad(email: string): Observable<SecurityQuestionResponse> {
    return this.http.post<SecurityQuestionResponse>(
      `${this.apiUrl}/auth/obtener-pregunta`,
      { email }
    );
  }

  // Verificar respuesta de seguridad
  verificarRespuestaSeguridad(data: VerifySecurityAnswerRequest): Observable<VerifySecurityAnswerResponse> {
    return this.http.post<VerifySecurityAnswerResponse>(
      `${this.apiUrl}/auth/verificar-respuesta`,
      data
    );
  }

  // 🔐 Resetear contraseña con token
  resetearPassword(data: ResetPasswordRequest): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/auth/resetear-password`,
      data
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.usuarioActualSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  estaAutenticado(): boolean {
    return !!this.getToken();
  }

  getRol(): string | null {
    const usuario = this.usuarioActualSubject.value;
    return usuario ? usuario.rol : null;
  }

  actualizarUsuarioLocal(usuario: any): void {
    const usuarioActual = this.usuarioActualValue;
    if (usuarioActual) {
      const usuarioActualizado = {
        ...usuarioActual,
        ...usuario
      };
      localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
      this.usuarioActualSubject.next(usuarioActualizado);
    }
  }

  redirigirADashboard(): void {
    // Este método puede ser implementado si se necesita redirigir
    // Actualmente se maneja en los componentes
  }

  private guardarSesion(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('usuario', JSON.stringify(response.usuario));
    this.usuarioActualSubject.next(response.usuario);
  }

  private cargarUsuarioDesdeStorage(): void {
    const token = localStorage.getItem('token');
    const usuarioStr = localStorage.getItem('usuario');

    if (token && usuarioStr) {
      try {
        const usuario: Usuario = JSON.parse(usuarioStr);
        this.usuarioActualSubject.next(usuario);
      } catch (error) {
        this.logout();
      }
    }
  }
}