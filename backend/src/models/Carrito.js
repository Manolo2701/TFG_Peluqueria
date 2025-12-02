const { pool } = require('../config/database');

class Carrito {
    static async agregarProducto(usuarioId, productoId, cantidad = 1) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            console.log('🔍 Verificando producto:', productoId);

            // Primero verificar que el producto existe y está activo
            const [producto] = await connection.execute(
                'SELECT id, nombre, stock, activo FROM producto WHERE id = ?',
                [productoId]
            );

            if (producto.length === 0) {
                throw new Error('Producto no encontrado');
            }

            const productoInfo = producto[0];
            console.log('📦 Producto encontrado:', productoInfo);

            if (!productoInfo.activo) {
                throw new Error('Producto no disponible');
            }

            // Verificar stock disponible
            const [existing] = await connection.execute(
                'SELECT * FROM carrito_item WHERE usuario_id = ? AND producto_id = ?',
                [usuarioId, productoId]
            );

            let cantidadTotalEnCarrito = cantidad;
            if (existing.length > 0) {
                cantidadTotalEnCarrito += existing[0].cantidad;
            }

            console.log('📊 Stock disponible:', productoInfo.stock, 'Cantidad solicitada:', cantidadTotalEnCarrito);

            if (productoInfo.stock < cantidadTotalEnCarrito) {
                throw new Error(`No hay suficiente stock disponible. Stock: ${productoInfo.stock}, Solicitado: ${cantidadTotalEnCarrito}`);
            }

            if (existing.length > 0) {
                console.log('🔄 Actualizando cantidad existente en carrito');
                const [result] = await connection.execute(
                    'UPDATE carrito_item SET cantidad = cantidad + ? WHERE usuario_id = ? AND producto_id = ?',
                    [cantidad, usuarioId, productoId]
                );
                await connection.commit();
                return result.affectedRows > 0;
            } else {
                console.log('➕ Insertando nuevo producto en carrito');
                const [result] = await connection.execute(
                    'INSERT INTO carrito_item (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)',
                    [usuarioId, productoId, cantidad]
                );
                await connection.commit();
                return result.insertId;
            }
        } catch (error) {
            await connection.rollback();
            console.error('❌ Error en Carrito.agregarProducto:', error.message);
            throw error;
        } finally {
            connection.release();
        }
    }

    static async obtenerCarrito(usuarioId) {
        try {
            const [rows] = await pool.execute(
                `SELECT 
                ci.id,
                ci.usuario_id,
                ci.producto_id,
                ci.cantidad,
                p.id as producto_id,
                p.nombre,
                p.precio,
                p.stock,
                p.activo,
                (ci.cantidad * p.precio) as subtotal
             FROM carrito_item ci
             JOIN producto p ON ci.producto_id = p.id
             WHERE ci.usuario_id = ?`,
                [usuarioId]
            );

            console.log('📦 Carrito obtenido de BD:', rows);
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

    static async verificarStockDisponible(usuarioId) {
        try {
            const [items] = await pool.execute(
                `SELECT ci.producto_id, ci.cantidad, p.stock, p.nombre
                 FROM carrito_item ci
                 JOIN producto p ON ci.producto_id = p.id
                 WHERE ci.usuario_id = ?`,
                [usuarioId]
            );

            const problemas = [];
            for (const item of items) {
                if (item.cantidad > item.stock) {
                    problemas.push({
                        producto: item.nombre,
                        solicitado: item.cantidad,
                        disponible: item.stock
                    });
                }
            }

            return problemas;
        } catch (error) {
            console.error('Error en Carrito.verificarStockDisponible:', error);
            throw error;
        }
    }
}

module.exports = Carrito;