export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  direccion?: string;
  rol?: 'cliente' | 'trabajador' | 'administrador';
  preguntaSeguridad?: string;    // Nuevo campo
  respuestaSeguridad?: string;   // Nuevo campo
}

export interface AuthResponse {
  mensaje: string;
  token: string;
  usuario: Usuario;
}

export interface RegisterResponse {
  mensaje: string;
  id: number;
}

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  apellidos: string;
  rol: 'cliente' | 'trabajador' | 'administrador';
}

// 🔐 Nuevas interfaces para recuperación de contraseña
export interface SecurityQuestionRequest {
  email: string;
}

export interface SecurityQuestionResponse {
  preguntaSeguridad: string;
}

export interface VerifySecurityAnswerRequest {
  email: string;
  respuestaSeguridad: string;
}

export interface VerifySecurityAnswerResponse {
  mensaje: string;
  resetToken: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  nuevaPassword: string;
}