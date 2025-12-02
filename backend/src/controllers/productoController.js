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

// ✅ MÉTODO NUEVO: Crear producto
exports.crearProducto = async (req, res) => {
    try {
        console.log('📝 Iniciando creación de producto');
        console.log('Datos recibidos:', req.body);

        const productoId = await Producto.crear(req.body);
        console.log('✅ Producto creado con ID:', productoId);

        const nuevoProducto = await Producto.buscarPorId(productoId);
        console.log('✅ Producto recuperado:', nuevoProducto);

        res.status(201).json({
            mensaje: 'Producto creado exitosamente',
            producto: nuevoProducto
        });
    } catch (error) {
        console.error('❌ Error en crearProducto:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: error.message });
    }
};

// ✅ MÉTODO NUEVO: Actualizar producto
exports.actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const datosActualizados = req.body;

        console.log('📝 Actualizando producto ID:', id);
        console.log('Datos recibidos:', datosActualizados);

        // Verificar que el producto existe
        const productoExistente = await Producto.buscarPorId(id);
        if (!productoExistente) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Actualizar el producto
        await Producto.actualizar(id, datosActualizados);

        // Obtener el producto actualizado
        const productoActualizado = await Producto.buscarPorId(id);

        res.json({
            mensaje: 'Producto actualizado exitosamente',
            producto: productoActualizado
        });
    } catch (error) {
        console.error('❌ Error en actualizarProducto:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// ✅ MÉTODO NUEVO: Eliminar producto
exports.eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;

        console.log('🗑️ Eliminando producto ID:', id);

        // Verificar que el producto existe
        const productoExistente = await Producto.buscarPorId(id);
        if (!productoExistente) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Eliminar (borrado lógico - actualizar campo activo a 0)
        await Producto.eliminar(id);

        res.json({ mensaje: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error('❌ Error en eliminarProducto:', error.message);
        res.status(500).json({ error: error.message });
    }
};