const { pool } = require('../config/database');

exports.procesarVenta = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const usuarioId = req.usuario.id;
        console.log('🛒 Procesando venta para usuario:', usuarioId);

        // Obtener carrito y verificar stock
        const [carritoItems] = await connection.execute(
            `SELECT ci.*, p.nombre, p.precio, p.stock, p.activo,
                    (ci.cantidad * p.precio) as subtotal
             FROM carrito_item ci
             JOIN producto p ON ci.producto_id = p.id
             WHERE ci.usuario_id = ?`,
            [usuarioId]
        );

        if (carritoItems.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Carrito vacío' });
        }

        // Verificar stock REAL
        const problemasStock = [];
        for (const item of carritoItems) {
            if (item.cantidad > item.stock) {
                problemasStock.push({
                    producto: item.nombre,
                    solicitado: item.cantidad,
                    disponible: item.stock
                });
            }
        }

        if (problemasStock.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                error: 'Stock insuficiente',
                detalles: problemasStock
            });
        }

        // Calcular total
        const total = carritoItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);

        // CREAR VENTA
        const [ventaResult] = await connection.execute(
            'INSERT INTO venta (cliente_id, total, estado, metodo_pago, fecha_venta) VALUES (?, ?, "completada", "transferencia", NOW())',
            [usuarioId, total]
        );

        const ventaId = ventaResult.insertId;
        console.log('✅ Venta creada con ID:', ventaId);

        // CREAR DETALLES Y ACTUALIZAR STOCK
        for (const item of carritoItems) {
            await connection.execute(
                'INSERT INTO venta_detalle (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
                [ventaId, item.producto_id, item.cantidad, item.precio, item.subtotal]
            );

            // RESTAR STOCK REAL
            await connection.execute(
                'UPDATE producto SET stock = stock - ? WHERE id = ?',
                [item.cantidad, item.producto_id]
            );

            console.log(`✅ Stock actualizado: producto ${item.producto_id}, -${item.cantidad} unidades`);
        }

        // VACIAR CARRITO
        await connection.execute(
            'DELETE FROM carrito_item WHERE usuario_id = ?',
            [usuarioId]
        );

        await connection.commit();

        res.json({
            success: true,
            mensaje: '✅ Venta procesada exitosamente',
            venta_id: ventaId,
            total: total,
            productos: carritoItems.length
        });

    } catch (error) {
        await connection.rollback();
        console.error('❌ Error en procesarVenta:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        connection.release();
    }
};

exports.obtenerMisVentas = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const usuarioId = req.usuario.id;

        const [ventas] = await connection.execute(
            `SELECT v.*, 
                    COUNT(vd.id) as total_productos
             FROM venta v
             LEFT JOIN venta_detalle vd ON v.id = vd.venta_id
             WHERE v.cliente_id = ?
             GROUP BY v.id
             ORDER BY v.fecha_venta DESC`,
            [usuarioId]
        );

        res.json({
            success: true,
            total: ventas.length,
            ventas
        });

    } catch (error) {
        console.error('❌ Error en obtenerMisVentas:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        connection.release();
    }
};

exports.obtenerVentaPorId = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const ventaId = req.params.id;
        const usuarioId = req.usuario.id;

        console.log(`[VENTA] Obteniendo venta ID: ${ventaId} para usuario: ${usuarioId}`);

        // Obtener información básica de la venta
        const [ventas] = await connection.execute(
            `SELECT v.*, u.nombre as cliente_nombre, u.email as cliente_email
             FROM venta v
             JOIN usuario u ON v.cliente_id = u.id
             WHERE v.id = ? AND v.cliente_id = ?`,
            [ventaId, usuarioId]
        );

        if (ventas.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Venta no encontrada'
            });
        }

        const venta = ventas[0];

        // Obtener detalles de la venta
        const [detalles] = await connection.execute(
            `SELECT vd.*, p.nombre as producto_nombre, p.descripcion as producto_descripcion
             FROM venta_detalle vd
             LEFT JOIN producto p ON vd.producto_id = p.id
             WHERE vd.venta_id = ?`,
            [ventaId]
        );

        venta.detalles = detalles;

        res.json({
            success: true,
            venta
        });

    } catch (error) {
        console.error('❌ Error en obtenerVentaPorId:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener la venta: ' + error.message
        });
    } finally {
        connection.release();
    }
};

exports.obtenerVentaPorTransaccion = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const transaccionId = req.params.transaccionId;
        const usuarioId = req.usuario.id;

        console.log(`[VENTA] Obteniendo venta por transacción: ${transaccionId} para usuario: ${usuarioId}`);

        // Obtener información básica de la venta
        const [ventas] = await connection.execute(
            `SELECT v.*, u.nombre as cliente_nombre, u.email as cliente_email
             FROM venta v
             JOIN usuario u ON v.cliente_id = u.id
             WHERE v.transaccion_id = ? AND v.cliente_id = ?`,
            [transaccionId, usuarioId]
        );

        if (ventas.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Venta no encontrada'
            });
        }

        const venta = ventas[0];

        // Obtener detalles de la venta
        const [detalles] = await connection.execute(
            `SELECT vd.*, p.nombre as producto_nombre, p.descripcion as producto_descripcion
             FROM venta_detalle vd
             LEFT JOIN producto p ON vd.producto_id = p.id
             WHERE vd.venta_id = ?`,
            [venta.id]
        );

        venta.detalles = detalles;

        res.json({
            success: true,
            venta
        });

    } catch (error) {
        console.error('❌ Error en obtenerVentaPorTransaccion:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener la venta: ' + error.message
        });
    } finally {
        connection.release();
    }
};