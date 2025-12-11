const { pool } = require('../config/database');

class Producto {
    // Obtener productos con opción de incluir inactivos
    static async listarTodos(incluirInactivos = false) {
        try {
            let query = 'SELECT * FROM producto';

            if (!incluirInactivos) {
                query += ' WHERE activo = true';
            }

            query += ' ORDER BY nombre';

            const [rows] = await pool.execute(query);

            console.log(`✅ Productos encontrados: ${rows.length} (incluirInactivos: ${incluirInactivos})`);
            return rows;
        } catch (error) {
            console.error('Error en Producto.listarTodos:', error);
            throw error;
        }
    }

    // Buscar por ID con opción de incluir inactivos
    static async buscarPorId(id, incluirInactivos = false) {
        try {
            let query = 'SELECT * FROM producto WHERE id = ?';

            if (!incluirInactivos) {
                query += ' AND activo = true';
            }

            const [rows] = await pool.execute(query, [id]);
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

    // Crear producto
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

    // Actualizar producto
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

    // Eliminar producto (borrado lógico)
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