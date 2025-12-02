export interface Trabajador {
    id: number;
    usuario_id: number;
    nombre: string;
    apellidos: string;
    email: string;
    telefono?: string;
    direccion?: string;
    especialidades: string | string[];
    categoria: string;
    descripcion?: string;
    experiencia?: number;
    horario_laboral?: any;
    fecha_creacion?: string;
}

export interface CrearTrabajadorRequest {
    // Datos de usuario
    email: string;
    password: string;
    nombre: string;
    apellidos: string;
    telefono?: string;
    direccion?: string;

    // Datos de trabajador
    especialidades?: string;
    categoria?: string;
    descripcion?: string;
    experiencia?: number;
    horario_laboral?: any;
}

export interface ActualizarTrabajadorRequest {
    // Datos de usuario
    email?: string;
    nombre?: string;
    apellidos?: string;
    telefono?: string;
    direccion?: string;

    // Datos de trabajador
    especialidades?: string;
    categoria?: string;
    descripcion?: string;
    experiencia?: number;
    horario_laboral?: any;
}