export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  telefono?: string;  // Opcional
  direccion?: string; // Opcional
  rol?: 'cliente' | 'trabajador' | 'administrador';
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