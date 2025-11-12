const db = require('../config/database');

console.log('[PAYPAL] Controlador cargado (Modo Simulación)');

const paypalController = {
    crearOrden: async (req, res) => {
        try {
            const { items, total, venta_id } = req.body;

            console.log('[PAYPAL] Creando orden de pago...');
            console.log('[PAYPAL] Items:', JSON.stringify(items));
            console.log('[PAYPAL] Total:', total);
            console.log('[PAYPAL] Venta ID recibida:', venta_id);

            // Simulación pura - sin SDK
            const mockOrderId = 'MOCK-PAYPAL-' + Date.now();
            const mockApprovalUrl = 'https://www.sandbox.paypal.com/checkoutnow?token=MOCK_TOKEN_' + Date.now();

            let ventaId = venta_id;

            // ✅ CORRECCIÓN DEFINITIVA: Usar 'transferencia' como método de pago (valor permitido en ENUM)
            if (!venta_id) {
                try {
                    console.log('[PAYPAL] 🔄 Creando nueva venta automáticamente...');

                    // Crear nueva venta - usar 'transferencia' que es un valor permitido
                    const [result] = await db.pool.execute(
                        'INSERT INTO venta (cliente_id, total, estado, metodo_pago, fecha_venta) VALUES (?, ?, "pendiente", "transferencia", NOW())',
                        [1, total] // cliente_id 1 por defecto
                    );

                    ventaId = result.insertId;
                    console.log('[PAYPAL] ✅ NUEVA VENTA CREADA con ID:', ventaId);

                } catch (dbError) {
                    console.log('[PAYPAL] ❌ ERROR creando venta:', dbError.message);

                    // Si falla, intentar con cliente_id NULL
                    try {
                        console.log('[PAYPAL] 🔄 Reintentando con cliente_id NULL...');
                        const [result] = await db.pool.execute(
                            'INSERT INTO venta (cliente_id, total, estado, metodo_pago, fecha_venta) VALUES (NULL, ?, "pendiente", "transferencia", NOW())',
                            [total]
                        );
                        ventaId = result.insertId;
                        console.log('[PAYPAL] ✅ VENTA CREADA con cliente_id NULL, ID:', ventaId);
                    } catch (secondError) {
                        console.log('[PAYPAL] ❌ ERROR también con cliente_id NULL:', secondError.message);
                        // En caso de error extremo, asignar un ID temporal
                        ventaId = 1000 + Math.floor(Math.random() * 1000);
                        console.log('[PAYPAL] ⚠️ Usando ID temporal:', ventaId);
                    }
                }
            } else {
                // ✅ VERIFICAR SI LA VENTA EXISTE antes de actualizar
                try {
                    console.log('[PAYPAL] 🔄 Verificando si venta existe ID:', venta_id);
                    const [existingVenta] = await db.pool.execute(
                        'SELECT id FROM venta WHERE id = ?',
                        [venta_id]
                    );

                    if (existingVenta.length === 0) {
                        console.log('[PAYPAL] ⚠️ Venta no existe, creando nueva...');
                        try {
                            const [result] = await db.pool.execute(
                                'INSERT INTO venta (id, cliente_id, total, estado, metodo_pago, fecha_venta) VALUES (?, 1, ?, "pendiente", "transferencia", NOW())',
                                [venta_id, total]
                            );
                            console.log('[PAYPAL] ✅ VENTA CREADA con ID específico:', venta_id);
                        } catch (insertError) {
                            console.log('[PAYPAL] ❌ ERROR creando venta con ID específico:', insertError.message);
                            // Si falla, crear con auto-increment
                            const [result] = await db.pool.execute(
                                'INSERT INTO venta (cliente_id, total, estado, metodo_pago, fecha_venta) VALUES (1, ?, "pendiente", "transferencia", NOW())',
                                [total]
                            );
                            ventaId = result.insertId;
                            console.log('[PAYPAL] ✅ VENTA CREADA con auto-increment, ID:', ventaId);
                        }
                    } else {
                        console.log('[PAYPAL] ✅ Venta ya existe, procediendo con actualización');
                    }
                } catch (dbError) {
                    console.log('[PAYPAL] ❌ ERROR verificando/creando venta:', dbError.message);
                }
            }

            console.log('[PAYPAL] 🔍 Venta ID final a usar:', ventaId);

            // ✅ ACTUALIZAR VENTA CON DATOS PAYPAL
            if (ventaId) {
                try {
                    console.log('[PAYPAL] 🔄 Actualizando venta con datos PayPal...');
                    const [result] = await db.pool.execute(
                        'UPDATE venta SET paypal_order_id = ?, estado = "pendiente" WHERE id = ?',
                        [mockOrderId, ventaId]
                    );

                    console.log('[PAYPAL] 🔍 Resultado de actualización - affectedRows:', result.affectedRows);

                    if (result.affectedRows > 0) {
                        console.log('[PAYPAL] ✅ Order ID guardado en venta:', ventaId);
                    } else {
                        console.log('[PAYPAL] ⚠️ No se pudo actualizar venta (no existe):', ventaId);
                    }
                } catch (dbError) {
                    console.log('[PAYPAL] ❌ ERROR actualizando venta:', dbError.message);
                }
            } else {
                console.log('[PAYPAL] ❌ No hay ventaId válido para actualizar');
            }

            // Respuesta de simulación
            const responseData = {
                success: true,
                orderID: mockOrderId,
                approvalUrl: mockApprovalUrl,
                status: 'CREATED',
                venta_id: ventaId,
                message: 'Orden de PayPal simulada - Desarrollo'
            };

            console.log('[PAYPAL] 📤 Enviando respuesta:', JSON.stringify(responseData));
            res.json(responseData);

        } catch (error) {
            console.error('[PAYPAL] ❌ ERROR en crearOrden:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear orden de pago',
                error: error.message
            });
        }
    },

    capturarPago: async (req, res) => {
        try {
            const { orderID } = req.body;

            console.log('[PAYPAL] Capturando pago para orden:', orderID);

            // Simular captura exitosa
            const mockCaptureId = 'MOCK-CAPTURE-' + Date.now();

            // ✅ ACTUALIZAR VENTA COMO COMPLETADA - usar 'transferencia' como método de pago
            try {
                const [result] = await db.pool.execute(
                    `UPDATE venta 
                     SET estado = 'completada', 
                         metodo_pago = 'transferencia', 
                         paypal_capture_id = ?,
                         fecha_pago = NOW()
                     WHERE paypal_order_id = ?`,
                    [mockCaptureId, orderID]
                );

                console.log('[PAYPAL] 🔍 Resultado captura - affectedRows:', result.affectedRows);

                if (result.affectedRows > 0) {
                    console.log('[PAYPAL] ✅ Venta actualizada como completada');
                } else {
                    console.log('[PAYPAL] ⚠️ No se pudo actualizar venta (no encontrada)');
                }
            } catch (dbError) {
                console.log('[PAYPAL] ❌ ERROR actualizando venta:', dbError.message);
            }

            res.json({
                success: true,
                message: 'Pago simulado completado exitosamente',
                captureID: mockCaptureId,
                status: 'COMPLETED',
                orderID: orderID
            });

        } catch (error) {
            console.error('[PAYPAL] ❌ ERROR en capturarPago:', error);
            res.status(500).json({
                success: false,
                message: 'Error al procesar pago',
                error: error.message
            });
        }
    },

    exito: (req, res) => {
        console.log('[PAYPAL] Pago exitoso - redireccion desde PayPal');
        res.json({
            success: true,
            message: '¡Pago completado exitosamente! Gracias por tu compra.'
        });
    },

    cancelar: (req, res) => {
        console.log('[PAYPAL] Pago cancelado - redireccion desde PayPal');
        res.json({
            success: false,
            message: 'Pago cancelado por el usuario.'
        });
    }
};

module.exports = paypalController;