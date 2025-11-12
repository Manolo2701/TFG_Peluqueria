const Reserva = require('../models/Reserva');

// Actualizar notas internas de una reserva
exports.actualizarNotasInternas = async (req, res) => {
    try {
        const { id } = req.params;
        const { notas_internas } = req.body;
        const usuario = req.usuario;

        // Verificar que el usuario es trabajador o administrador
        if (usuario.rol !== 'trabajador' && usuario.rol !== 'administrador') {
            return res.status(403).json({ 
                error: 'Solo trabajadores y administradores pueden editar notas internas' 
            });
        }

        // Verificar que la reserva existe
        const reserva = await Reserva.buscarPorId(id);
        if (!reserva) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        // Si es trabajador, verificar que está asignado a la reserva
        if (usuario.rol === 'trabajador' && reserva.trabajador_id !== usuario.id) {
            return res.status(403).json({ 
                error: 'Solo puedes editar notas de tus propias reservas' 
            });
        }

        // Actualizar notas internas
        const actualizado = await Reserva.actualizarNotasInternas(id, notas_internas);
        
        if (actualizado) {
            res.json({ 
                mensaje: 'Notas internas actualizadas correctamente',
                notas_internas: notas_internas
            });
        } else {
            res.status(500).json({ error: 'Error al actualizar notas internas' });
        }
    } catch (error) {
        console.error('❌ Error en actualizarNotasInternas:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Obtener notas internas de una reserva
exports.obtenerNotasInternas = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = req.usuario;

        // Verificar permisos
        if (usuario.rol !== 'trabajador' && usuario.rol !== 'administrador') {
            return res.status(403).json({ 
                error: 'No tienes permisos para ver notas internas' 
            });
        }

        // Verificar que la reserva existe
        const reserva = await Reserva.buscarPorId(id);
        if (!reserva) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        // Si es trabajador, verificar que está asignado a la reserva
        if (usuario.rol === 'trabajador' && reserva.trabajador_id !== usuario.id) {
            return res.status(403).json({ 
                error: 'Solo puedes ver notas de tus propias reservas' 
            });
        }

        const notas = await Reserva.obtenerNotasInternas(id);
        
        res.json({
            reserva_id: parseInt(id),
            notas_internas: notas
        });
    } catch (error) {
        console.error('❌ Error en obtenerNotasInternas:', error.message);
        res.status(500).json({ error: error.message });
    }
};