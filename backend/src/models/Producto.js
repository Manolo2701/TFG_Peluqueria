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

    // ✅ MÉTODO NUEVO: Crear producto
    static async crear(productoData) {
        try {
            const { nombre, precio, stock, activo = true } = productoData;

            const [result] = await pool.execute(
                `INSERT INTO producto (nombre, precio, stock, activo)
                 VALUES (?, ?, ?, ?)`,
                [nombre, precio, stock, activo]
            );

            return result.insertId;
        } catch (error) {
            console.error('Error en Producto.crear:', error);
            throw error;
        }
    }

    // ✅ MÉTODO NUEVO: Actualizar producto
    static async actualizar(id, productoData) {
        try {
            const { nombre, precio, stock, activo } = productoData;

            const [result] = await pool.execute(
                `UPDATE producto 
                 SET nombre = ?, precio = ?, stock = ?, activo = ?
                 WHERE id = ?`,
                [nombre, precio, stock, activo, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en Producto.actualizar:', error);
            throw error;
        }
    }

    // ✅ MÉTODO NUEVO: Eliminar producto (borrado lógico)
    static async eliminar(id) {
        try {
            const [result] = await pool.execute(
                'UPDATE producto SET activo = false WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en Producto.eliminar:', error);
            throw error;
        }
    }
}

module.exports = Producto;