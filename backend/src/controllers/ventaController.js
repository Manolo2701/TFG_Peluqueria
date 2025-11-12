const Venta = require('../models/Venta');
const Carrito = require('../models/Carrito');

exports.procesarVenta = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        console.log('🛒 Procesando venta para usuario:', usuarioId);

        const carrito = await Carrito.obtenerCarrito(usuarioId);

        if (carrito.length === 0) {
            return res.status(400).json({ error: 'Carrito vacío' });
        }

        const total = await Carrito.calcularTotal(usuarioId);

        const ventaData = {
            cliente_id: usuarioId,
            total: total,
            metodo_pago: 'efectivo',
            detalles: carrito.map(item => ({
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario: item.precio,
                subtotal: item.subtotal
            }))
        };

        const ventaId = await Venta.crear(ventaData);

        await Carrito.vaciarCarrito(usuarioId);

        res.json({
            mensaje: '✅ Venta procesada exitosamente (modo demostración)',
            venta_id: ventaId,
            total: total,
            productos: carrito.length
        });

    } catch (error) {
        console.error('❌ Error en procesarVenta:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerMisVentas = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const ventas = await Venta.obtenerPorCliente(usuarioId);

        res.json({
            total: ventas.length,
            ventas
        });
    } catch (error) {
        console.error('❌ Error en obtenerMisVentas:', error.message);
        res.status(500).json({ error: error.message });
    }
};