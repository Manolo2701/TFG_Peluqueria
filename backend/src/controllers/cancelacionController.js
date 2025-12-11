const Reserva = require('../models/Reserva');

exports.cancelarReserva = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo, politica } = req.body;
        const usuarioId = req.usuario.id;
        const usuarioRol = req.usuario.rol;

        console.log('🚨 INICIANDO CANCELACIÓN DE RESERVA:', {
            id,
            motivo,
            politica,
            usuarioId,
            usuarioRol
        });

        // Obtener la reserva para verificar permisos
        const reserva = await Reserva.buscarPorId(id);
        if (!reserva) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        console.log('📋 Reserva encontrada:', {
            id: reserva.id,
            estado: reserva.estado,
            cliente_id: reserva.cliente_id,
            trabajador_id: reserva.trabajador_id
        });

        // Cliente solo puede cancelar sus propias reservas
        // administradores y trabajadores pueden cancelar cualquier reserva
        if (usuarioRol === 'cliente' && reserva.cliente_id !== usuarioId) {
            return res.status(403).json({ error: 'No tienes permisos para cancelar esta reserva' });
        }

        // Verificar que la reserva no esté ya cancelada, completada O rechazada
        if (reserva.estado === 'cancelada') {
            return res.status(400).json({ error: 'La reserva ya está cancelada' });
        }

        if (reserva.estado === 'completada') {
            return res.status(400).json({ error: 'No se puede cancelar una reserva completada' });
        }

        if (reserva.estado === 'rechazada') {
            return res.status(400).json({
                error: 'No se puede cancelar una reserva que ha sido rechazada por el profesional'
            });
        }

        // Validar política de cancelación (para futuro)
        const politicasValidas = ['flexible', 'moderada', 'estricta'];
        const politicaElegida = politica || 'flexible';

        if (!politicasValidas.includes(politicaElegida)) {
            return res.status(400).json({
                error: 'Política de cancelación no válida',
                politicas_validas: politicasValidas
            });
        }

        // Validar que se proporcione un motivo
        if (!motivo || motivo.trim() === '') {
            return res.status(400).json({ error: 'El motivo de cancelación es obligatorio' });
        }

        const motivoLimpio = motivo.trim();
        console.log('✅ Motivo de cancelación validado:', motivoLimpio);

        // Realizar la cancelación con la política seleccionada
        const cancelacionExitosa = await Reserva.cancelarConPolitica(id, motivoLimpio, politicaElegida);

        if (!cancelacionExitosa) {
            return res.status(500).json({ error: 'Error al cancelar la reserva' });
        }

        // Obtener la reserva actualizada para la respuesta
        const reservaActualizada = await Reserva.buscarPorId(id);

        console.log('✅ Reserva cancelada exitosamente:', {
            id: reservaActualizada.id,
            estado: reservaActualizada.estado,
            motivo_cancelacion: reservaActualizada.motivo_cancelacion,
            politica_cancelacion: reservaActualizada.politica_cancelacion,
            penalizacion_aplicada: reservaActualizada.penalizacion_aplicada
        });

        res.json({
            mensaje: 'Reserva cancelada exitosamente',
            reserva: reservaActualizada,
            detalles: `Se aplicó la política ${politicaElegida}. Penalización aplicada: €${reservaActualizada.penalizacion_aplicada}`
        });

    } catch (error) {
        console.error('❌ Error en cancelarReserva:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Obtener políticas de cancelación disponibles
exports.obtenerPoliticas = async (req, res) => {
    try {
        const politicas = Reserva.obtenerPoliticasDisponibles();

        res.json({
            politicas,
            total: politicas.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo políticas:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Obtener detalles de cancelación de una reserva
exports.obtenerDetallesCancelacion = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario.id;
        const usuarioRol = req.usuario.rol;

        const reserva = await Reserva.buscarPorId(id);
        if (!reserva) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        // Verificar permisos
        if (usuarioRol === 'cliente' && reserva.cliente_id !== usuarioId) {
            return res.status(403).json({ error: 'No tienes permisos para ver esta reserva' });
        }

        const puedeCancelar = reserva.estado !== 'cancelada' &&
            reserva.estado !== 'completada' &&
            reserva.estado !== 'rechazada';

        // Si la reserva no está cancelada, calcular penalización potencial (para futuro)
        let detallesCancelacion = {};

        if (reserva.estado === 'cancelada') {
            detallesCancelacion = {
                cancelada: true,
                fecha_cancelacion: reserva.fecha_cancelacion,
                motivo_cancelacion: reserva.motivo_cancelacion,
                politica_aplicada: reserva.politica_cancelacion,
                penalizacion_aplicada: reserva.penalizacion_aplicada
            };
        } else if (reserva.estado === 'rechazada') {
            detallesCancelacion = {
                cancelada: false,
                puede_cancelar: false,
                mensaje: 'Esta reserva fue rechazada por el profesional y no puede ser cancelada.'
            };
        } else {
            // Calcular penalizaciones potenciales para cada política (para futuro)
            const politicas = Reserva.obtenerPoliticasDisponibles();
            const penalizacionesPotenciales = politicas.map(politica => {
                const penalizacion = Reserva.calcularPenalizacion(reserva, politica.valor);
                return {
                    politica: politica.nombre,
                    valor: politica.valor,
                    descripcion: politica.descripcion,
                    penalizacion_estimada: penalizacion
                };
            });

            detallesCancelacion = {
                cancelada: false,
                puede_cancelar: true,
                penalizaciones_potenciales: penalizacionesPotenciales,
                mensaje: 'La reserva puede ser cancelada. Las penalizaciones mostradas son estimadas.'
            };
        }

        res.json(detallesCancelacion);

    } catch (error) {
        console.error('❌ Error obteniendo detalles de cancelación:', error.message);
        res.status(500).json({ error: error.message });
    }
};