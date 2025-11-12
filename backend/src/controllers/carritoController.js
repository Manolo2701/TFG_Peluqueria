const Carrito = require('../models/Carrito');

exports.agregarAlCarrito = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { producto_id, cantidad = 1 } = req.body;

        console.log('🛒 Agregando al carrito:', { usuarioId, producto_id, cantidad });

        const resultado = await Carrito.agregarProducto(usuarioId, producto_id, cantidad);

        res.json({
            mensaje: 'Producto agregado al carrito',
            agregado: resultado
        });
    } catch (error) {
        console.error('❌ Error en agregarAlCarrito:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerCarrito = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const carrito = await Carrito.obtenerCarrito(usuarioId);

        const total = await Carrito.calcularTotal(usuarioId);

        res.json({
            total_items: carrito.length,
            total: total,
            carrito
        });
    } catch (error) {
        console.error('❌ Error en obtenerCarrito:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.vaciarCarrito = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const resultado = await Carrito.vaciarCarrito(usuarioId);

        res.json({
            mensaje: 'Carrito vaciado',
            vaciado: resultado
        });
    } catch (error) {
        console.error('❌ Error en vaciarCarrito:', error.message);
        res.status(500).json({ error: error.message });
    }
};