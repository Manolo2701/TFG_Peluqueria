export interface Ausencia {
    id?: number;
    trabajador_id: number;
    nombre?: string;
    apellidos?: string;
    tipo: 'vacaciones' | 'enfermedad' | 'personal' | 'formacion' | 'otro';
    fecha_inicio: string;
    fecha_fin: string;
    motivo: string;
    estado: 'pendiente' | 'aprobado' | 'rechazado';
    fecha_creacion?: string;
}