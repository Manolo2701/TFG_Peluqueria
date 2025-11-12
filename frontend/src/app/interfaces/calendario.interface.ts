export interface Ausencia {
    id?: number;
    trabajador_id: number;
    trabajador_nombre?: string;
    tipo: 'vacaciones' | 'baja' | 'otro';
    fecha_inicio: string;
    fecha_fin: string;
    motivo: string;
    estado: 'pendiente' | 'aprobada' | 'rechazada';
}