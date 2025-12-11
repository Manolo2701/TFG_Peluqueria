const { pool } = require('../config/database');

const paypalController = {
    crearOrden: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { items, total } = req.body;
            const usuarioId = req.usuario.id;

            console.log('[PAYPAL] Creando orden para usuario:', usuarioId);

            // Validaciones
            if (!items || !Array.isArray(items) || items.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    error: 'El carrito está vacío'
                });
            }

            if (!total || total <= 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    error: 'Total inválido'
                });
            }

            // Verificar stock
            const problemasStock = [];
            for (const item of items) {
                const [producto] = await connection.execute(
                    'SELECT stock, nombre FROM producto WHERE id = ?',
                    [item.producto_id]
                );

                if (producto.length === 0) {
                    problemasStock.push(`Producto ID ${item.producto_id} no encontrado`);
                } else if (producto[0].stock < item.cantidad) {
                    problemasStock.push(`Stock insuficiente para ${producto[0].nombre}: disponible ${producto[0].stock}, solicitado ${item.cantidad}`);
                }
            }

            if (problemasStock.length > 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    error: 'Problemas de stock',
                    detalles: problemasStock
                });
            }

            // GENERAR ID DE TRANSACCIÓN ÚNICO
            const transaccionId = 'PED-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            const mockOrderId = 'MOCK-PAYPAL-' + Date.now();

            console.log(`[PAYPAL] Transacción ID: ${transaccionId}`);

            // CREAR VENTA CON TRANSACCIÓN ID
            const [ventaResult] = await connection.execute(
                'INSERT INTO venta (cliente_id, total, estado, metodo_pago, transaccion_id, fecha_venta) VALUES (?, ?, "completada", "paypal", ?, NOW())',
                [usuarioId, total, transaccionId]
            );

            const ventaId = ventaResult.insertId;
            console.log('[PAYPAL] ✅ Venta creada con ID:', ventaId, 'Transacción:', transaccionId);

            // Crear detalles y actualizar stock
            for (const item of items) {
                await connection.execute(
                    'INSERT INTO venta_detalle (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
                    [ventaId, item.producto_id, item.cantidad, item.precio, item.precio * item.cantidad]
                );

                await connection.execute(
                    'UPDATE producto SET stock = stock - ? WHERE id = ?',
                    [item.cantidad, item.producto_id]
                );

                console.log(`[PAYPAL] ✅ Stock actualizado: producto ${item.producto_id}, -${item.cantidad} unidades`);
            }

            // Vaciar carrito
            await connection.execute(
                'DELETE FROM carrito_item WHERE usuario_id = ?',
                [usuarioId]
            );

            console.log('[PAYPAL] ✅ Carrito vaciado para usuario:', usuarioId);

            await connection.commit();

            // Redirigir directamente al recibo
            const mockApprovalUrl = `http://localhost/confirmacion-compra?venta_id=${ventaId}&orden=${transaccionId}`;

            res.json({
                success: true,
                orderID: mockOrderId,
                transaccionId: transaccionId,
                venta_id: ventaId,
                approvalUrl: mockApprovalUrl,
                status: 'COMPLETED',
                message: '✅ Compra procesada exitosamente',
                detalles: {
                    numeroPedido: transaccionId,
                    total: total,
                    items: items.length,
                    fecha: new Date().toISOString()
                },
                paypalReal: false // Indicar que es simulación
            });

        } catch (error) {
            await connection.rollback();
            console.error('[PAYPAL] ❌ ERROR en crearOrden:', error);

            res.status(500).json({
                success: false,
                error: 'Error al procesar la compra: ' + error.message
            });
        } finally {
            connection.release();
        }
    },

    capturarPago: async (req, res) => {
        console.log('[PAYPAL] capturarPago llamado pero no necesario en simulación');
        res.json({
            success: true,
            message: 'Pago ya procesado en crearOrden',
            status: 'COMPLETED',
            paypalReal: false
        });
    },

    exito: async (req, res) => {
        try {
            const { token } = req.query;
            console.log('[PAYPAL] Redirigiendo desde éxito - token:', token);
            // Redirigir al recibo
            res.redirect('http://localhost:4200/confirmacion-compra?orden=' + (token || ''));
        } catch (error) {
            console.error('[PAYPAL] ❌ ERROR en exito:', error);
            res.redirect('http://localhost:4200/confirmacion-compra?pago=error');
        }
    },

    cancelar: async (req, res) => {
        try {
            console.log('[PAYPAL] Pago cancelado');
            res.redirect('http://localhost:4200/carrito?pago=cancelado');
        } catch (error) {
            console.error('[PAYPAL] ❌ ERROR en cancelar:', error);
            res.redirect('http://localhost:4200/carrito?pago=error');
        }
    }
};

module.exports = paypalController;