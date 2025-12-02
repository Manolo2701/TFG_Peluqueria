const Carrito = require('../models/Carrito');

exports.agregarAlCarrito = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { producto_id, cantidad = 1 } = req.body;

        console.log('🛒 Agregando al carrito - Usuario:', usuarioId, 'Producto:', producto_id, 'Cantidad:', cantidad);

        // Validaciones básicas
        if (!producto_id) {
            return res.status(400).json({
                success: false,
                error: 'producto_id es requerido'
            });
        }

        if (!cantidad || cantidad <= 0) {
            return res.status(400).json({
                success: false,
                error: 'La cantidad debe ser mayor a 0'
            });
        }

        const resultado = await Carrito.agregarProducto(usuarioId, producto_id, cantidad);

        console.log('✅ Producto agregado exitosamente:', resultado);

        res.json({
            success: true,
            mensaje: 'Producto agregado al carrito',
            agregado: resultado
        });
    } catch (error) {
        console.error('❌ Error en agregarAlCarrito:', error.message);
        console.error('❌ Stack trace:', error.stack);

        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

exports.obtenerCarrito = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        console.log('🛒 Obteniendo carrito para usuario:', usuarioId);

        const carrito = await Carrito.obtenerCarrito(usuarioId);
        const total = await Carrito.calcularTotal(usuarioId);

        console.log('✅ Carrito obtenido:', carrito.length, 'productos');
        console.log('📋 Detalles del carrito:', JSON.stringify(carrito, null, 2));

        // ✅ Asegurar que cada item tenga la estructura correcta
        const carritoFormateado = carrito.map(item => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            producto: {
                id: item.producto_id,
                nombre: item.nombre,
                precio: parseFloat(item.precio),
                stock: parseInt(item.stock),
                activo: Boolean(item.activo)
            },
            subtotal: parseFloat(item.subtotal)
        }));

        res.json({
            success: true,
            total_items: carrito.length,
            total: total,
            carrito: carritoFormateado
        });
    } catch (error) {
        console.error('❌ Error en obtenerCarrito:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.vaciarCarrito = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        console.log('🛒 Vaciando carrito para usuario:', usuarioId);

        const resultado = await Carrito.vaciarCarrito(usuarioId);

        res.json({
            success: true,
            mensaje: 'Carrito vaciado',
            vaciado: resultado
        });
    } catch (error) {
        console.error('❌ Error en vaciarCarrito:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.verificarStock = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const problemas = await Carrito.verificarStockDisponible(usuarioId);

        res.json({
            success: true,
            stock_ok: problemas.length === 0,
            problemas: problemas
        });
    } catch (error) {
        console.error('❌ Error en verificarStock:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.actualizarCantidad = async (req, res) => {
    const connection = await require('../config/database').pool.getConnection();

    try {
        await connection.beginTransaction();

        const usuarioId = req.usuario.id;
        const { producto_id, cantidad } = req.body;

        console.log('🔄 Actualizando cantidad - Usuario:', usuarioId, 'Producto:', producto_id, 'Cantidad:', cantidad);

        // Validaciones básicas
        if (!producto_id || cantidad === undefined) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'producto_id y cantidad son requeridos'
            });
        }

        if (cantidad < 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'La cantidad no puede ser negativa'
            });
        }

        // Verificar producto
        const [producto] = await connection.execute(
            'SELECT id, nombre, precio, stock, activo FROM producto WHERE id = ?',
            [producto_id]
        );

        if (producto.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        const productoInfo = producto[0];

        if (!productoInfo.activo) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Producto no disponible'
            });
        }

        // Verificar stock
        if (cantidad > productoInfo.stock) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: `No hay suficiente stock. Stock disponible: ${productoInfo.stock}`
            });
        }

        // Actualizar o eliminar del carrito
        if (cantidad === 0) {
            await connection.execute(
                'DELETE FROM carrito_item WHERE usuario_id = ? AND producto_id = ?',
                [usuarioId, producto_id]
            );
        } else {
            const [existing] = await connection.execute(
                'SELECT * FROM carrito_item WHERE usuario_id = ? AND producto_id = ?',
                [usuarioId, producto_id]
            );

            if (existing.length > 0) {
                await connection.execute(
                    'UPDATE carrito_item SET cantidad = ? WHERE usuario_id = ? AND producto_id = ?',
                    [cantidad, usuarioId, producto_id]
                );
            } else {
                await connection.execute(
                    'INSERT INTO carrito_item (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)',
                    [usuarioId, producto_id, cantidad]
                );
            }
        }

        await connection.commit();

        res.json({
            success: true,
            mensaje: 'Cantidad actualizada en el carrito',
            producto: productoInfo.nombre,
            cantidad: cantidad
        });

    } catch (error) {
        await connection.rollback();
        console.error('❌ Error en actualizarCantidad:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        connection.release();
    }
};