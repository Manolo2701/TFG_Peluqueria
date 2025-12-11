const { pool } = require('../config/database');

class AusenciaTrabajador {
    // Crear una nueva ausencia
    static async crear(ausenciaData) {
        try {
            console.log(`📝 [AUSENCIA_MODEL] Creando ausencia con datos:`, ausenciaData);
            console.log(`📝 [AUSENCIA_MODEL] trabajador_id: ${ausenciaData.trabajador_id}, tipo: ${typeof ausenciaData.trabajador_id}`);

            // ✅ VERIFICAR que trabajador_id es un número
            if (typeof ausenciaData.trabajador_id !== 'number') {
                console.error('❌ [AUSENCIA_MODEL] trabajador_id no es un número:', ausenciaData.trabajador_id);
                throw new Error('trabajador_id debe ser un número');
            }

            const [result] = await pool.execute(
                `INSERT INTO ausencia_trabajador 
            (trabajador_id, tipo, fecha_inicio, fecha_fin, motivo, estado) 
            VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    ausenciaData.trabajador_id,
                    ausenciaData.tipo,
                    ausenciaData.fecha_inicio,
                    ausenciaData.fecha_fin,
                    ausenciaData.motivo,
                    ausenciaData.estado || 'pendiente'
                ]
            );

            console.log(`✅ [AUSENCIA_MODEL] Ausencia creada con ID: ${result.insertId}`);
            return result.insertId;
        } catch (error) {
            console.error('❌ Error en AusenciaTrabajador.crear:', error);
            throw error;
        }
    }

    // Obtener ausencias por trabajador en base a su ID de usuario
    static async obtenerPorTrabajador(usuarioId) {
        try {
            console.log(`🔍 [AUSENCIA_MODEL] Obteniendo ausencias para usuarioId: ${usuarioId}, tipo: ${typeof usuarioId}`);

            if (typeof usuarioId !== 'number') {
                console.error('❌ [AUSENCIA_MODEL] usuarioId no es un número:', usuarioId);
                throw new Error('usuarioId debe ser un número');
            }

            const [rows] = await pool.execute(
                `SELECT * FROM ausencia_trabajador 
             WHERE trabajador_id = ? 
             ORDER BY fecha_inicio DESC`,
                [usuarioId]
            );

            console.log(`✅ [AUSENCIA_MODEL] Ausencias encontradas: ${rows.length}`);
            return rows;
        } catch (error) {
            console.error('❌ Error en AusenciaTrabajador.obtenerPorTrabajador:', error);
            throw error;
        }
    }

    // Obtener todas las ausencias (admin)
    static async obtenerTodas(filtros = {}) {
        try {
            let query = `
                SELECT a.*, u.nombre, u.apellidos 
                FROM ausencia_trabajador a
                JOIN usuario u ON a.trabajador_id = u.id
                WHERE 1=1
            `;
            const params = [];

            if (filtros.estado) {
                query += ' AND a.estado = ?';
                params.push(filtros.estado);
            }

            if (filtros.trabajador_id) {
                query += ' AND a.trabajador_id = ?';
                params.push(filtros.trabajador_id);
            }

            query += ' ORDER BY a.fecha_inicio DESC';

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error en AusenciaTrabajador.obtenerTodas:', error);
            throw error;
        }
    }

    // Actualizar estado de una ausencia
    static async actualizarEstado(id, estado) {
        try {
            const [result] = await pool.execute(
                'UPDATE ausencia_trabajador SET estado = ? WHERE id = ?',
                [estado, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en AusenciaTrabajador.actualizarEstado:', error);
            throw error;
        }
    }

    // Verificar disponibilidad usando usuario_id
    static async verificarDisponibilidad(usuarioId, fecha) {
        try {
            console.log(`🔍 [VERIFICAR_DISPONIBILIDAD] Consultando ausencias para usuario_id ${usuarioId} en fecha ${fecha}`);

            const [rows] = await pool.execute(
                `SELECT * FROM ausencia_trabajador 
                 WHERE trabajador_id = ? 
                 AND estado = 'aprobado'
                 AND ? BETWEEN fecha_inicio AND fecha_fin`,
                [usuarioId, fecha]  // usuarioId es el trabajador_id en ausencia_trabajador
            );

            console.log(`📊 [VERIFICAR_DISPONIBILIDAD] Encontradas ${rows.length} ausencias aprobadas`);
            if (rows.length > 0) {
                console.log(`📋 Ausencias encontradas:`, rows.map(r => ({
                    id: r.id,
                    tipo: r.tipo,
                    fecha_inicio: r.fecha_inicio,
                    fecha_fin: r.fecha_fin,
                    estado: r.estado
                })));
            }

            return rows.length === 0; // True si está disponible (no tiene ausencias)
        } catch (error) {
            console.error('❌ Error en AusenciaTrabajador.verificarDisponibilidad:', error);
            throw error;
        }
    }

    // Eliminar ausencia
    static async eliminar(id, usuarioId) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM ausencia_trabajador WHERE id = ? AND trabajador_id = ?',
                [id, usuarioId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en AusenciaTrabajador.eliminar:', error);
            throw error;
        }
    }
}

module.exports = AusenciaTrabajador;