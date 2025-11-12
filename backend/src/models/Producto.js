const { pool } = require('../config/database');

class Producto {
    static async listarTodos() {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM producto WHERE activo = true ORDER BY nombre'
            );
            return rows;
        } catch (error) {
            console.error('Error en Producto.listarTodos:', error);
            throw error;
        }
    }

    static async buscarPorId(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM producto WHERE id = ? AND activo = true',
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('Error en Producto.buscarPorId:', error);
            throw error;
        }
    }

    static async actualizarStock(id, nuevoStock) {
        try {
            const [result] = await pool.execute(
                'UPDATE producto SET stock = ? WHERE id = ?',
                [nuevoStock, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en Producto.actualizarStock:', error);
            throw error;
        }
    }
}

module.exports = Producto;