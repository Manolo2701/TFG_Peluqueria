const { pool } = require('../config/database');

class AusenciaTrabajador {
    // Crear una nueva ausencia
    static async crear(ausenciaData) {
        try {
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
            return result.insertId;
        } catch (error) {
            console.error('Error en AusenciaTrabajador.crear:', error);
            throw error;
        }
    }

    // Obtener ausencias por trabajador
    static async obtenerPorTrabajador(trabajadorId) {
        try {
            const [rows] = await pool.execute(
                `SELECT * FROM ausencia_trabajador 
                 WHERE trabajador_id = ? 
                 ORDER BY fecha_inicio DESC`,
                [trabajadorId]
            );
            return rows;
        } catch (error) {
            console.error('Error en AusenciaTrabajador.obtenerPorTrabajador:', error);
            throw error;
        }
    }

    // Obtener todas las ausencias (para admin)
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

    // Verificar si un trabajador tiene ausencia en una fecha específica
    static async verificarDisponibilidad(trabajadorId, fecha) {
        try {
            const [rows] = await pool.execute(
                `SELECT * FROM ausencia_trabajador 
                 WHERE trabajador_id = ? 
                 AND estado = 'aprobado'
                 AND ? BETWEEN fecha_inicio AND fecha_fin`,
                [trabajadorId, fecha]
            );
            return rows.length === 0; // True si está disponible
        } catch (error) {
            console.error('Error en AusenciaTrabajador.verificarDisponibilidad:', error);
            throw error;
        }
    }

    // Eliminar ausencia
    static async eliminar(id, trabajadorId) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM ausencia_trabajador WHERE id = ? AND trabajador_id = ?',
                [id, trabajadorId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en AusenciaTrabajador.eliminar:', error);
            throw error;
        }
    }
}

module.exports = AusenciaTrabajador;