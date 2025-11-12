const { pool } = require('../config/database');

class Venta {
    static async crear(ventaData) {
        try {
            console.log('💰 Creando venta simplificada:', ventaData);

            const [result] = await pool.execute(
                'INSERT INTO venta (cliente_id, total, metodo_pago) VALUES (?, ?, ?)',
                [ventaData.cliente_id, ventaData.total, ventaData.metodo_pago]
            );

            const ventaId = result.insertId;
            console.log('✅ Venta creada con ID:', ventaId);

            for (const detalle of ventaData.detalles) {
                await pool.execute(
                    'INSERT INTO venta_detalle (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
                    [ventaId, detalle.producto_id, detalle.cantidad, detalle.precio_unitario, detalle.subtotal]
                );

                await pool.execute(
                    'UPDATE producto SET stock = stock - ? WHERE id = ?',
                    [detalle.cantidad, detalle.producto_id]
                );
            }

            return ventaId;
        } catch (error) {
            console.error('❌ Error en Venta.crear:', error.message);
            throw error;
        }
    }

    static async obtenerPorCliente(clienteId) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM venta WHERE cliente_id = ? ORDER BY fecha_venta DESC',
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