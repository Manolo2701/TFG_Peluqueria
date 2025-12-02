export interface Reserva {
    id: number;
    cliente_id: number;
    servicio_id: number;
    trabajador_id?: number;
    fecha_reserva: string;
    hora_inicio: string;
    duracion: number;
    estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'rechazada' | 'pendiente_asignacion';
    notas?: string;
    notas_internas?: string;
    politica_cancelacion?: 'flexible' | 'moderada' | 'estricta';
    fecha_creacion?: string;
    fecha_cancelacion?: string;
    motivo_cancelacion?: string;
    penalizacion_aplicada?: number;

    // Campos de relaciones (pueden venir en algunas consultas)
    cliente_nombre?: string;
    cliente_apellidos?: string;
    cliente_telefono?: string;
    servicio_nombre?: string;
    servicio_precio?: number;
    servicio_duracion?: number;
    servicio_categoria?: string;
    trabajador_nombre?: string;
    trabajador_apellidos?: string;

    // Para objetos anidados
    cliente?: {
        nombre: string;
        apellidos: string;
        telefono?: string;
    };
    servicio?: {
        nombre: string;
        precio: number;
        duracion: number;
        categoria: string;
    };
    trabajador?: {
        nombre: string;
        apellidos: string;
        especialidades: string[];
    };
}

export interface ReservaDetallesData {
    reserva: Reserva;
    esVistaTrabajador?: boolean;
    usuarioActual?: any;
    contexto?: 'calendario-general' | 'mi-agenda' | 'mis-reservas';
}