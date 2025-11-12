const Servicio = require('../models/Servicio');

// Obtener todos los servicios
exports.obtenerServicios = async (req, res) => {
  try {
    console.log('🔍 Obteniendo todos los servicios');
    const servicios = await Servicio.listarTodos();
    res.json({
      total: servicios.length,
      servicios
    });
  } catch (error) {
    console.error('❌ Error en obtenerServicios:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Crear nuevo servicio (solo admin)
exports.crearServicio = async (req, res) => {
  try {
    console.log('📝 Iniciando creación de servicio');
    console.log('Datos recibidos:', req.body);
    
    // TEMPORAL: Comentar la verificación de admin para diagnóstico
    // if (req.usuario.rol !== 'administrador') {
    //   return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    // }

    const servicioId = await Servicio.crear(req.body);
    console.log('✅ Servicio creado con ID:', servicioId);
    
    const nuevoServicio = await Servicio.buscarPorId(servicioId);
    console.log('✅ Servicio recuperado:', nuevoServicio);
    
    res.status(201).json({
      mensaje: 'Servicio creado exitosamente',
      servicio: nuevoServicio
    });
  } catch (error) {
    console.error('❌ Error en crearServicio:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
};

// Obtener servicios por categoría
exports.obtenerServiciosPorCategoria = async (req, res) => {
  try {
    const { categoria } = req.params;
    const servicios = await Servicio.buscarPorCategoria(categoria);
    
    res.json({
      categoria,
      total: servicios.length,
      servicios
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener servicio por ID
exports.obtenerServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const servicio = await Servicio.buscarPorId(id);
    
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    
    res.json(servicio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};