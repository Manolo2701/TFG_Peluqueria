const { pool } = require('../config/database');

class Carrito {
    static async agregarProducto(usuarioId, productoId, cantidad = 1) {
        try {
            const [existing] = await pool.execute(
                'SELECT * FROM carrito_item WHERE usuario_id = ? AND producto_id = ?',
                [usuarioId, productoId]
            );

            if (existing.length > 0) {
                const [result] = await pool.execute(
                    'UPDATE carrito_item SET cantidad = cantidad + ? WHERE usuario_id = ? AND producto_id = ?',
                    [cantidad, usuarioId, productoId]
                );
                return result.affectedRows > 0;
            } else {
                const [result] = await pool.execute(
                    'INSERT INTO carrito_item (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)',
                    [usuarioId, productoId, cantidad]
                );
                return result.insertId;
            }
        } catch (error) {
            console.error('Error en Carrito.agregarProducto:', error);
            throw error;
        }
    }

    static async obtenerCarrito(usuarioId) {
        try {
            const [rows] = await pool.execute(
                `SELECT ci.*, p.nombre, p.precio, p.stock, 
                (ci.cantidad * p.precio) as subtotal
         FROM carrito_item ci
         JOIN producto p ON ci.producto_id = p.id
         WHERE ci.usuario_id = ? AND p.activo = true`,
                [usuarioId]
            );
            return rows;
        } catch (error) {
            console.error('Error en Carrito.obtenerCarrito:', error);
            throw error;
        }
    }

    static async vaciarCarrito(usuarioId) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM carrito_item WHERE usuario_id = ?',
                [usuarioId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en Carrito.vaciarCarrito:', error);
            throw error;
        }
    }

    static async calcularTotal(usuarioId) {
        try {
            const [rows] = await pool.execute(
                `SELECT SUM(ci.cantidad * p.precio) as total
         FROM carrito_item ci
         JOIN producto p ON ci.producto_id = p.id
         WHERE ci.usuario_id = ? AND p.activo = true`,
                [usuarioId]
            );
            return rows[0].total || 0;
        } catch (error) {
            console.error('Error en Carrito.calcularTotal:', error);
            throw error;
        }
    }
}

module.exports = Carrito;