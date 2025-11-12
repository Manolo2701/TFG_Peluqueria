// frontend/src/app/interfaces/dashboard.interface.ts
export interface DashboardStats {
    rol: string;
    misReservasHoy: number;
    totalReservas: number;
    reservasConfirmadas: number;
    reservasPendientes: number;
    proximasReservas: any[];
    serviciosPopulares: any[];
    // Para admin/trabajador
    totalReservasHoy: number;
    ingresosHoy: number;
    totalVentasHoy: number;
}

export interface ServicioPopular {
    id: number;
    nombre: string;
    total_reservas: number;
    categoria?: string;
    precio?: number;
}

export interface ProximaReserva {
    id: number;
    fecha_reserva: string;
    hora_inicio: string;
    servicio_nombre: string;
    servicio_precio: number;
    estado: string;
    cliente_nombre?: string;
    trabajador_nombre?: string;
}