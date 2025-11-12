const Reserva = require('../models/Reserva');
const Servicio = require('../models/Servicio');
const Trabajador = require('../models/Trabajador');
const CalendarioUtils = require('../utils/calendarioUtils');

// Crear nueva reserva - SISTEMA HÍBRIDO MEJORADO
// Crear nueva reserva - VERSIÓN SIMPLIFICADA (siempre requiere trabajador_id)
exports.crearReserva = async (req, res) => {
  try {
    console.log('🎯 INICIANDO CREACIÓN DE RESERVA - FLUJO SIMPLIFICADO');
    console.log('Datos recibidos:', req.body);

    const { servicio_id, fecha_reserva, hora_inicio, notas, trabajador_id } = req.body;
    const cliente_id = req.usuario.id;

    // ✅ VALIDACIÓN: Ahora trabajador_id es obligatorio
    if (!trabajador_id) {
      return res.status(400).json({
        error: 'Debes seleccionar un profesional para la reserva'
      });
    }

    console.log('🔍 IDs importantes:');
    console.log('   - Cliente ID:', cliente_id);
    console.log('   - Servicio ID:', servicio_id);
    console.log('   - Trabajador ID:', trabajador_id);

    // 1. Obtener información del servicio
    const servicio = await Servicio.buscarPorId(servicio_id);
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    console.log('📋 Servicio encontrado:', servicio.nombre);

    // 2. VERIFICAR TRABAJADOR (ahora obligatorio)
    console.log('🔍 Verificando trabajador con ID:', trabajador_id);

    const trabajador = await Trabajador.buscarPorId(trabajador_id);

    if (!trabajador) {
      console.log('❌ Trabajador no encontrado con ID:', trabajador_id);
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    console.log('✅ Trabajador encontrado:', trabajador.nombre, trabajador.apellidos);

    // 3. Verificar especialidad (simplificada)
    const categoriaServicio = servicio.categoria.toLowerCase();
    const categoriaTrabajador = trabajador.categoria.toLowerCase();

    console.log(`🔍 Verificando categorías: Servicio=${categoriaServicio}, Trabajador=${categoriaTrabajador}`);

    // ✅ LÓGICA SIMPLIFICADA: Verificar que las categorías coincidan
    const categoriasCompatibles =
      categoriaTrabajador === 'ambas' ||
      categoriaServicio.includes(categoriaTrabajador) ||
      categoriaTrabajador.includes(categoriaServicio);

    if (!categoriasCompatibles) {
      return res.status(400).json({
        error: `El trabajador ${trabajador.nombre} no está especializado en servicios de ${servicio.categoria}`
      });
    }

    console.log('✅ Categorías compatibles');

    // 4. VERIFICAR DISPONIBILIDAD REAL
    console.log('⏰ Verificando disponibilidad...');
    const disponible = await Reserva.verificarDisponibilidad(
      trabajador_id,
      fecha_reserva,
      hora_inicio,
      servicio.duracion
    );

    if (!disponible) {
      return res.status(400).json({
        error: 'El trabajador seleccionado no tiene disponibilidad en ese horario'
      });
    }

    console.log('✅ Trabajador disponible en el horario seleccionado');

    // 5. CREAR LA RESERVA
    const reservaData = {
      cliente_id,
      servicio_id,
      trabajador_id: trabajador_id, // ← Usamos el trabajador_id proporcionado
      fecha_reserva,
      hora_inicio,
      duracion: servicio.duracion,
      estado: 'pendiente', // ← Siempre pendiente hasta confirmación
      notas: notas || `Reserva para ${servicio.nombre}`
    };

    console.log('💾 Guardando reserva con datos:', reservaData);
    const reservaId = await Reserva.crear(reservaData);
    console.log('✅ Reserva creada con ID:', reservaId);

    const nuevaReserva = await Reserva.buscarPorId(reservaId);
    console.log('📋 Reserva final creada:', nuevaReserva);

    res.status(201).json({
      mensaje: 'Reserva creada exitosamente',
      reserva: nuevaReserva
    });

  } catch (error) {
    console.error('❌ ERROR en crearReserva:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ✅ NUEVO ENDPOINT: Obtener trabajadores disponibles para un servicio específico
exports.obtenerTrabajadoresParaServicio = async (req, res) => {
  try {
    const { servicio_id } = req.params;

    console.log('🔍 Buscando trabajadores para servicio ID:', servicio_id);

    // Obtener información del servicio
    const servicio = await Servicio.buscarPorId(servicio_id);
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    console.log('📋 Servicio encontrado:', servicio.nombre, '- Categoría:', servicio.categoria);

    // Obtener todos los trabajadores activos
    const todosTrabajadores = await Trabajador.listarTodos();
    console.log('👥 Total de trabajadores:', todosTrabajadores.length);

    // Filtrar trabajadores por categoría del servicio - CORREGIDO
    const trabajadoresFiltrados = todosTrabajadores.filter(trabajador => {
      console.log(`🔍 Validando trabajador: ${trabajador.nombre}`);
      // ✅ Asegurarnos de que el servicio se pase correctamente
      const puedeRealizar = CalendarioUtils.puedeRealizarServicio(trabajador, servicio);
      console.log(`   Resultado para ${trabajador.nombre}: ${puedeRealizar}`);
      return puedeRealizar;
    });

    console.log(`✅ Trabajadores especializados en ${servicio.categoria}:`, trabajadoresFiltrados.length);

    res.json({
      servicio: {
        id: servicio.id,
        nombre: servicio.nombre,
        categoria: servicio.categoria,
        duracion: servicio.duracion
      },
      trabajadores: trabajadoresFiltrados.map(t => ({
        id: t.id,
        nombre: t.nombre,
        apellidos: t.apellidos,
        especialidades: t.especialidades,
        descripcion: t.descripcion,
        experiencia: t.experiencia
      })),
      total: trabajadoresFiltrados.length
    });
  } catch (error) {
    console.error('❌ Error en obtenerTrabajadoresParaServicio:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Obtener todas las reservas (admin)
exports.obtenerReservas = async (req, res) => {
  try {
    if (req.usuario.rol !== 'administrador') {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }

    const reservas = await Reserva.listarTodas();
    res.json({
      total: reservas.length,
      reservas
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener reservas del cliente actual
exports.obtenerMisReservas = async (req, res) => {
  try {
    const cliente_id = req.usuario.id;
    const reservas = await Reserva.buscarPorCliente(cliente_id);

    res.json({
      total: reservas.length,
      reservas
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener reserva por ID
exports.obtenerReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const reserva = await Reserva.buscarPorId(id);

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Verificar permisos: cliente ve solo sus reservas, admin ve todas
    if (req.usuario.rol !== 'administrador' && reserva.cliente_id !== req.usuario.id) {
      return res.status(403).json({ error: 'No tienes permisos para ver esta reserva' });
    }

    res.json(reserva);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener trabajadores disponibles para un servicio, fecha y hora específicos
exports.obtenerTrabajadoresDisponibles = async (req, res) => {
  try {
    console.log('🎯 ENDPOINT LLAMADO: /api/reservas/trabajadores-disponibles');
    const { servicio_id, fecha, hora } = req.query;

    if (!servicio_id || !fecha || !hora) {
      return res.status(400).json({
        error: 'servicio_id, fecha y hora son requeridos'
      });
    }

    console.log(`🔍 Buscando trabajadores disponibles para servicio ${servicio_id} en ${fecha} a las ${hora}`);

    // 1. Obtener servicio
    const servicio = await Servicio.buscarPorId(servicio_id);
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    console.log(`📋 Servicio: ${servicio.nombre}, Categoría: ${servicio.categoria}`);

    // 2. Obtener todos los trabajadores
    const todosTrabajadores = await Trabajador.listarTodos();
    console.log(`👥 Total de trabajadores en BD: ${todosTrabajadores.length}`);

    todosTrabajadores.forEach(t => {
      console.log(`   - ${t.nombre} ${t.apellidos}: ${t.especialidades}`);
    });

    // 3. Filtrar por categoría
    const trabajadoresCapaces = CalendarioUtils.filtrarTrabajadoresPorCategoria(
      todosTrabajadores,
      servicio.categoria
    );

    console.log(`🎯 Trabajadores capaces de ${servicio.categoria}: ${trabajadoresCapaces.length}`);
    trabajadoresCapaces.forEach(t => {
      console.log(`   ✅ ${t.nombre} ${t.apellidos}`);
    });

    // 4. Verificar disponibilidad
    const trabajadoresDisponibles = [];

    for (const trabajador of trabajadoresCapaces) {
      console.log(`⏰ Verificando disponibilidad de ${trabajador.nombre}...`);

      const disponible = await Reserva.verificarDisponibilidad(
        trabajador.id,
        fecha,
        hora,
        servicio.duracion
      );

      console.log(`   ${trabajador.nombre} disponible: ${disponible}`);

      if (disponible) {
        // ✅ Parsear especialidades si es necesario
        let especialidadesArray = trabajador.especialidades;
        if (typeof especialidadesArray === 'string') {
          try {
            especialidadesArray = JSON.parse(especialidadesArray);
          } catch (e) {
            console.warn(`   ❌ Error parseando especialidades de ${trabajador.nombre}:`, especialidadesArray);
            especialidadesArray = [especialidadesArray];
          }
        }

        trabajadoresDisponibles.push({
          id: trabajador.id,
          nombre: trabajador.nombre,
          apellidos: trabajador.apellidos,
          especialidades: especialidadesArray,
          descripcion: trabajador.descripcion,
          disponible: true
        });
      }
    }

    console.log(`🎉 Trabajadores disponibles finales: ${trabajadoresDisponibles.length}`);

    trabajadoresDisponibles.forEach(t => {
      console.log(`   🎯 ${t.nombre} ${t.apellidos} - ${t.especialidades}`);
    });

    res.json({
      servicio: {
        id: servicio.id,
        nombre: servicio.nombre,
        categoria: servicio.categoria,
        duracion: servicio.duracion,
        precio: servicio.precio
      },
      fecha,
      hora,
      trabajadores: trabajadoresDisponibles,
      total: trabajadoresDisponibles.length
    });

  } catch (error) {
    console.error('❌ Error en obtenerTrabajadoresDisponibles:', error);
    res.status(500).json({ error: error.message });
  }
};