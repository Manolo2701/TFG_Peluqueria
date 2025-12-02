const { pool } = require('../config/database');

class Venta {
    static async crear(ventaData) {
        const connection = await pool.getConnection();
        try {
            console.log('💰 Creando venta simplificada:', ventaData);
            await connection.beginTransaction();

            const [result] = await connection.execute(
                'INSERT INTO venta (cliente_id, total, metodo_pago, estado, fecha_venta) VALUES (?, ?, ?, "completada", NOW())',
                [ventaData.cliente_id, ventaData.total, ventaData.metodo_pago]
            );

            const ventaId = result.insertId;
            console.log('✅ Venta creada con ID:', ventaId);

            for (const detalle of ventaData.detalles) {
                await connection.execute(
                    'INSERT INTO venta_detalle (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
                    [ventaId, detalle.producto_id, detalle.cantidad, detalle.precio_unitario, detalle.subtotal]
                );

                await connection.execute(
                    'UPDATE producto SET stock = stock - ? WHERE id = ?',
                    [detalle.cantidad, detalle.producto_id]
                );
            }

            await connection.commit();
            return ventaId;
        } catch (error) {
            await connection.rollback();
            console.error('❌ Error en Venta.crear:', error.message);
            throw error;
        } finally {
            connection.release();
        }
    }

    static async obtenerPorCliente(clienteId) {
        try {
            const [rows] = await pool.execute(
                `SELECT v.*, 
                        COUNT(vd.id) as total_items,
                        v.fecha_venta as fecha
                 FROM venta v
                 LEFT JOIN venta_detalle vd ON v.id = vd.venta_id
                 WHERE v.cliente_id = ?
                 GROUP BY v.id
                 ORDER BY v.fecha_venta DESC`,
                [clienteId]
            );
            return rows;
        } catch (error) {
            console.error('Error en Venta.obtenerPorCliente:', error);
            throw error;
        }
    }
}

module.exports = Venta;