const Producto = require('../models/Producto');

exports.obtenerProductos = async (req, res) => {
    try {
        console.log('🛍️ Obteniendo todos los productos');
        const productos = await Producto.listarTodos();

        res.json({
            total: productos.length,
            productos
        });
    } catch (error) {
        console.error('❌ Error en obtenerProductos:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const producto = await Producto.buscarPorId(id);

        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(producto);
    } catch (error) {
        console.error('❌ Error en obtenerProducto:', error.message);
        res.status(500).json({ error: error.message });
    }
};