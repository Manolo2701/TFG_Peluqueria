const Reserva = require('../models/Reserva');

class ReservaAutoService {
    static iniciar() {
        console.log('🔄 Iniciando servicio automático de reservas (setInterval)...');

        // Ejecutar cada dos minutos usando setInterval nativo
        setInterval(async () => {
            try {
                console.log('⏰ Ejecutando verificación automática de reservas...');
                await this.verificarReservasPendientes();
                await this.verificarReservasCompletadas();
            } catch (error) {
                console.error('❌ Error en verificación automática:', error);
            }
        }, 120000); // 2 minutos

        // Ejecutar una vez inmediatamente al iniciar
        setTimeout(async () => {
            try {
                console.log('🚀 Ejecutando verificación inicial...');
                await this.verificarReservasPendientes();
                await this.verificarReservasCompletadas();
            } catch (error) {
                console.error('❌ Error en verificación inicial:', error);
            }
        }, 5000);
    }

    // Verificar reservas pendientes que deben ser rechazadas automáticamente
    static async verificarReservasPendientes() {
        try {
            const ahora = new Date();

            console.log('🔍 Buscando reservas pendientes para auto-rechazo...');

            // Obtener todas las reservas pendientes
            const todasReservas = await Reserva.listarTodas();
            const reservasPendientes = todasReservas.filter(reserva =>
                reserva.estado === 'pendiente'
            );

            console.log(`📊 Reservas pendientes encontradas: ${reservasPendientes.length}`);

            let autoRechazadas = 0;

            for (const reserva of reservasPendientes) {
                const fechaReserva = new Date(`${reserva.fecha_reserva}T${reserva.hora_inicio}`);

                // Verificar si faltan 2 horas o menos O si la cita ya pasó
                const diferenciaHoras = (fechaReserva - ahora) / (1000 * 60 * 60);

                console.log(`🔍 Reserva ${reserva.id}: Diferencia = ${diferenciaHoras.toFixed(2)} horas, Fecha: ${reserva.fecha_reserva} ${reserva.hora_inicio}`);

                // Rechazar si la cita está a 2 horas o menos, o si ya pasó
                if (diferenciaHoras <= 2) {
                    console.log(`⏰ Auto-rechazando reserva ${reserva.id} - Diferencia: ${diferenciaHoras.toFixed(2)} horas`);

                    await Reserva.actualizarEstado(reserva.id, 'rechazada');

                    // También actualizar motivo para indicar que fue rechazo automático
                    await Reserva.actualizarMotivo(
                        reserva.id,
                        `❌ RECHAZO AUTOMÁTICO: La reserva fue rechazada automáticamente porque no fue confirmada a tiempo (${new Date().toLocaleString()})`
                    );

                    console.log(`✅ Reserva ${reserva.id} auto-rechazada`);
                    autoRechazadas++;
                }
            }

            if (autoRechazadas > 0) {
                console.log(`🎯 Total de reservas auto-rechazadas: ${autoRechazadas}`);
            } else {
                console.log(`✅ No hay reservas pendientes que requieran auto-rechazo`);
            }

        } catch (error) {
            console.error('❌ Error en verificarReservasPendientes:', error);
        }
    }

    // Verificar reservas confirmadas que deben marcarse como completadas
    static async verificarReservasCompletadas() {
        try {
            const ahora = new Date();
            console.log('🔍 Buscando reservas confirmadas para auto-completar...');

            const todasReservas = await Reserva.listarTodas();
            const reservasConfirmadas = todasReservas.filter(r => r.estado === 'confirmada');

            console.log(`📊 Reservas confirmadas encontradas: ${reservasConfirmadas.length}`);
            let autoCompletadas = 0;

            for (const reserva of reservasConfirmadas) {
                const [year, month, day] = reserva.fecha_reserva.split('-').map(Number);
                const [hour, minute, second] = reserva.hora_inicio.split(':').map(Number);

                const fechaReserva = new Date(year, month - 1, day, hour, minute, second, 0);
                const fechaFinReserva = new Date(fechaReserva.getTime() + reserva.duracion * 60000);

                console.log(`🔍 Reserva ${reserva.id}: Fecha cita: ${reserva.fecha_reserva} ${reserva.hora_inicio}, Duración: ${reserva.duracion}min, Hora fin: ${fechaFinReserva.toLocaleTimeString()}, Hora actual: ${ahora.toLocaleTimeString()}, Ya pasó: ${fechaFinReserva <= ahora}`);

                if (fechaFinReserva <= ahora) {
                    console.log(`✅ Auto-completando reserva ${reserva.id}`);

                    await Reserva.actualizarEstado(reserva.id, 'completada');
                    await Reserva.actualizarNotasInternas(
                        reserva.id,
                        `✅ COMPLETADO AUTOMÁTICO: La reserva fue marcada como completada automáticamente (${ahora.toLocaleString()})`
                    );

                    autoCompletadas++;
                }
            }

            if (autoCompletadas > 0) {
                console.log(`🎯 Total de reservas auto-completadas: ${autoCompletadas}`);
            } else {
                console.log(`✅ No hay reservas confirmadas que requieran auto-completado`);
            }

        } catch (error) {
            console.error('❌ Error en verificarReservasCompletadas:', error);
        }
    }


    // Método para obtener el estado actual del servicio (para debugging)
    static async obtenerEstadoServicio() {
        try {
            const todasReservas = await Reserva.listarTodas();
            const porEstado = {};

            todasReservas.forEach(reserva => {
                if (!porEstado[reserva.estado]) {
                    porEstado[reserva.estado] = 0;
                }
                porEstado[reserva.estado]++;
            });

            return {
                total: todasReservas.length,
                porEstado,
                ultimaVerificacion: new Date().toISOString(),
                servicioActivo: true,
                metodo: 'setInterval'
            };
        } catch (error) {
            console.error('Error obteniendo estado del servicio:', error);
            return {
                error: error.message,
                servicioActivo: false
            };
        }
    }
}

module.exports = ReservaAutoService;