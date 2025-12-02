const { pool } = require('../config/database');
const Reserva = require('../models/Reserva');
const Servicio = require('../models/Servicio');
const Trabajador = require('../models/Trabajador');
const CalendarioUtils = require('../utils/calendarioUtils');
const Usuario = require('../models/Usuario');

// Función helper para obtener el ID del trabajador según el tipo de usuario
const obtenerTrabajadorId = (req) => {
  console.log(`🔍 [OBTENER_TRABAJADOR_ID] Buscando trabajadorId para usuario: ${req.usuario.id}`);
  console.log(`   trabajadorId en req.usuario: ${req.usuario.trabajadorId}`);
  console.log(`   rol: ${req.usuario.rol}`);
  console.log(`   nombre: ${req.usuario.nombre}`);

  // Para AMBOS roles (trabajador y administrador) usar trabajadorId
  if (req.usuario.trabajadorId) {
    console.log(`✅ [OBTENER_TRABAJADOR_ID] Usando trabajadorId: ${req.usuario.trabajadorId}`);
    return req.usuario.trabajadorId;
  }

  console.log('❌ [OBTENER_TRABAJADOR_ID] No se encontró trabajadorId');
  return null;
};

// Función para verificar si un trabajador puede realizar un servicio
const verificarEspecialidad = async (trabajadorId, servicioId) => {
  try {
    console.log(`🔍 [ESPECIALIDAD] Verificando trabajador ${trabajadorId} para servicio ${servicioId}`);

    const trabajador = await Trabajador.obtenerPerfil(trabajadorId);
    const servicio = await Servicio.buscarPorId(servicioId);

    if (!trabajador) {
      console.log('❌ [ESPECIALIDAD] Trabajador no encontrado');
      return false;
    }

    if (!servicio) {
      console.log('❌ [ESPECIALIDAD] Servicio no encontrado');
      return false;
    }

    console.log(`🔍 [ESPECIALIDAD] Datos REALES:`);
    console.log(`   - Trabajador: ${trabajador.nombre} - Categoría: ${trabajador.categoria}`);
    console.log(`   - Servicio: ${servicio.nombre} - Categoría: ${servicio.categoria}`);

    const puedeRealizar = CalendarioUtils.puedeRealizarServicio(trabajador, servicio);
    console.log(`🎯 [ESPECIALIDAD] Resultado: ${puedeRealizar ? '✅ PUEDE' : '❌ NO PUEDE'} - ${trabajador.nombre} para ${servicio.nombre}`);

    return puedeRealizar;
  } catch (error) {
    console.error('Error en verificarEspecialidad:', error);
    return false;
  }
};

const trabajadorController = {
  // 1. Obtener MIS reservas asignadas específicamente a mí - CON CAMPOS DE CANCELACIÓN
  obtenerMisReservas: async (req, res) => {
    try {
      console.log('🎯 [TRABAJADOR] Obteniendo reservas para trabajador');
      console.log('   Usuario autenticado:', req.usuario.id, req.usuario.nombre, req.usuario.rol);

      const trabajador_id = obtenerTrabajadorId(req);

      if (!trabajador_id) {
        return res.status(403).json({ error: 'No estás registrado como trabajador' });
      }

      console.log(`🔍 [CONTROLADOR] Buscando reservas EXCLUSIVAS para trabajador_id: ${trabajador_id}`);

      // ✅ CONSULTA ACTUALIZADA - INCLUIR EXPLÍCITAMENTE CAMPOS DE CANCELACIÓN
      const [rows] = await pool.execute(`
      SELECT 
        r.*,
        r.motivo_cancelacion,  -- ✅ INCLUIR EXPLÍCITAMENTE
        r.politica_cancelacion, -- ✅ INCLUIR EXPLÍCITAMENTE  
        r.fecha_cancelacion,    -- ✅ INCLUIR EXPLÍCITAMENTE
        r.penalizacion_aplicada, -- ✅ INCLUIR EXPLÍCITAMENTE
        u_cliente.nombre as cliente_nombre,
        u_cliente.apellidos as cliente_apellidos, 
        u_cliente.telefono as cliente_telefono,
        s.nombre as servicio_nombre,
        s.precio as servicio_precio,
        s.duracion as servicio_duracion,
        s.categoria as servicio_categoria,
        s.descripcion as servicio_descripcion,
        u_trabajador.nombre as trabajador_nombre,
        u_trabajador.apellidos as trabajador_apellidos,
        u_trabajador.email as trabajador_email,
        t.especialidades as trabajador_especialidades
      FROM reserva r
      JOIN usuario u_cliente ON r.cliente_id = u_cliente.id
      JOIN servicio s ON r.servicio_id = s.id
      LEFT JOIN trabajador t ON r.trabajador_id = t.id
      LEFT JOIN usuario u_trabajador ON t.usuario_id = u_trabajador.id
      WHERE r.trabajador_id = ?
      ORDER BY r.fecha_reserva DESC, r.hora_inicio DESC
    `, [trabajador_id]);

      console.log(`📊 [CONTROLADOR] Encontradas ${rows.length} reservas para trabajador ${trabajador_id}`);

      // ✅ LOG DETALLADO PARA VERIFICAR CAMPOS DE CANCELACIÓN
      if (rows.length > 0) {
        rows.forEach((reserva, index) => {
          if (reserva.estado === 'cancelada') {
            console.log(`🔍 [CANCELACIÓN] Reserva ${reserva.id} - Campos de cancelación:`, {
              motivo_cancelacion: reserva.motivo_cancelacion,
              politica_cancelacion: reserva.politica_cancelacion,
              fecha_cancelacion: reserva.fecha_cancelacion,
              penalizacion_aplicada: reserva.penalizacion_aplicada
            });
          }
        });
      }

      // Formatear respuesta de manera consistente
      const reservasFormateadas = rows.map(r => {
        return {
          // Datos básicos de la reserva
          id: r.id,
          cliente_id: r.cliente_id,
          servicio_id: r.servicio_id,
          trabajador_id: r.trabajador_id,
          fecha_reserva: r.fecha_reserva,
          hora_inicio: r.hora_inicio,
          duracion: r.duracion,
          estado: r.estado,
          notas: r.notas,
          precio: r.servicio_precio,

          // ✅ CAMPOS DE CANCELACIÓN EXPLÍCITOS
          motivo_cancelacion: r.motivo_cancelacion,
          politica_cancelacion: r.politica_cancelacion,
          fecha_cancelacion: r.fecha_cancelacion,
          penalizacion_aplicada: r.penalizacion_aplicada,

          // Campos planos para compatibilidad
          cliente_nombre: r.cliente_nombre,
          cliente_apellidos: r.cliente_apellidos,
          servicio_nombre: r.servicio_nombre,
          servicio_precio: r.servicio_precio,
          servicio_duracion: r.servicio_duracion,
          servicio_categoria: r.servicio_categoria,
          trabajador_nombre: r.trabajador_nombre,
          trabajador_apellidos: r.trabajador_apellidos,

          // Objetos anidados
          cliente: {
            id: r.cliente_id,
            nombre: r.cliente_nombre,
            apellidos: r.cliente_apellidos,
            telefono: r.cliente_telefono
          },
          servicio: {
            id: r.servicio_id,
            nombre: r.servicio_nombre,
            precio: r.servicio_precio,
            duracion: r.servicio_duracion,
            categoria: r.servicio_categoria,
            descripcion: r.servicio_descripcion
          },
          trabajador: {
            id: r.trabajador_id,
            nombre: r.trabajador_nombre,
            apellidos: r.trabajador_apellidos,
            email: r.trabajador_email,
            especialidades: (() => {
              try {
                if (!r.trabajador_especialidades) return [];
                if (Array.isArray(r.trabajador_especialidades)) {
                  return r.trabajador_especialidades;
                }
                if (typeof r.trabajador_especialidades === 'string') {
                  if (r.trabajador_especialidades.includes(',')) {
                    return r.trabajador_especialidades.split(',').map(esp => esp.trim());
                  }
                  try {
                    return JSON.parse(r.trabajador_especialidades);
                  } catch (jsonError) {
                    return [r.trabajador_especialidades];
                  }
                }
                return [];
              } catch (error) {
                console.error('Error procesando especialidades:', error);
                return [];
              }
            })()
          }
        };
      });

      res.json({
        total: reservasFormateadas.length,
        reservas: reservasFormateadas
      });
    } catch (error) {
      console.error('Error en obtenerMisReservas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // 2. Obtener reservas DISPONIBLES (sin trabajador asignado) - CON FILTRO DE ESPECIALIDAD
  obtenerReservasDisponibles: async (req, res) => {
    try {
      const trabajador_id = obtenerTrabajadorId(req);

      if (!trabajador_id) {
        return res.status(403).json({ error: 'No estás registrado como trabajador' });
      }

      // Obtener perfil del trabajador para saber sus especialidades
      const trabajador = await Trabajador.obtenerPerfil(trabajador_id);
      console.log(`🔍 [DISPONIBLES] Trabajador: ${trabajador.nombre}, Especialidades:`, trabajador.especialidades);

      // Buscar reservas sin trabajador asignado
      const todasReservasDisponibles = await Reserva.buscarDisponiblesPorEspecialidad(trabajador.especialidades);

      // Filtrar solo las que puede realizar por especialidad
      const reservasFiltradas = [];

      for (const reserva of todasReservasDisponibles) {
        const puedeRealizar = await verificarEspecialidad(trabajador_id, reserva.servicio_id);
        if (puedeRealizar) {
          reservasFiltradas.push(reserva);
        }
      }

      console.log(`📊 [DISPONIBLES] De ${todasReservasDisponibles.length} disponibles, ${reservasFiltradas.length} coinciden con especialidad`);

      res.json({
        total: reservasFiltradas.length,
        reservas: reservasFiltradas.map(r => ({
          id: r.id,
          fecha_reserva: r.fecha_reserva,
          hora_inicio: r.hora_inicio,
          duracion: r.duracion,
          servicio: {
            id: r.servicio_id,
            nombre: r.servicio_nombre,
            categoria: r.categoria
          },
          cliente: {
            nombre: r.cliente_nombre,
            apellidos: r.cliente_apellidos
          },
          notas: r.notas,
          especialidad_requerida: r.categoria
        }))
      });
    } catch (error) {
      console.error('Error en obtenerReservasDisponibles:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // 3. Tomar una reserva disponible - CON VERIFICACIÓN DE ESPECIALIDAD
  tomarReserva: async (req, res) => {
    try {
      const { id } = req.params;
      const trabajador_id = obtenerTrabajadorId(req);

      if (!trabajador_id) {
        return res.status(403).json({ error: 'No estás registrado como trabajador' });
      }

      console.log(`🔍 [TOMAR] Trabajador ${trabajador_id} intentando tomar reserva ${id}`);

      // Verificar que la reserva existe y está disponible
      const reserva = await Reserva.buscarPorId(id);
      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      if (reserva.trabajador_id !== null) {
        return res.status(400).json({ error: 'Esta reserva ya fue tomada por otro trabajador' });
      }

      // ✅ VERIFICACIÓN CRÍTICA: Especialidad
      const puedeRealizar = await verificarEspecialidad(trabajador_id, reserva.servicio_id);
      if (!puedeRealizar) {
        return res.status(400).json({
          error: 'No puedes tomar esta reserva - No tienes la especialidad requerida para este servicio'
        });
      }

      // Verificar disponibilidad del trabajador
      const disponible = await Reserva.verificarDisponibilidad(
        trabajador_id,
        reserva.fecha_reserva,
        reserva.hora_inicio,
        reserva.duracion
      );

      if (!disponible) {
        return res.status(400).json({
          error: 'No tienes disponibilidad en este horario'
        });
      }

      // Asignar reserva al trabajador
      const actualizado = await Reserva.asignarTrabajador(id, trabajador_id);

      if (!actualizado) {
        return res.status(500).json({ error: 'Error al tomar la reserva' });
      }

      const reservaActualizada = await Reserva.buscarPorId(id);

      res.json({
        mensaje: 'Reserva tomada exitosamente',
        reserva: reservaActualizada
      });
    } catch (error) {
      console.error('Error en tomarReserva:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // 4. Aceptar reserva - CON VERIFICACIÓN DE ESPECIALIDAD
  aceptarReserva: async (req, res) => {
    try {
      const { id } = req.params;
      const trabajador_id = obtenerTrabajadorId(req);

      if (!trabajador_id) {
        return res.status(403).json({ error: 'No estás registrado como trabajador' });
      }

      // Verificar que la reserva es del trabajador
      const reserva = await Reserva.buscarPorId(id);
      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      if (reserva.trabajador_id !== trabajador_id) {
        return res.status(403).json({ error: 'No tienes permisos para aceptar esta reserva' });
      }

      // ✅ VERIFICACIÓN CRÍTICA: Especialidad
      const puedeRealizar = await verificarEspecialidad(trabajador_id, reserva.servicio_id);
      if (!puedeRealizar) {
        return res.status(400).json({
          error: 'No tienes la especialidad requerida para este servicio'
        });
      }

      if (reserva.estado !== 'pendiente') {
        return res.status(400).json({ error: 'La reserva no está pendiente' });
      }

      // Cambiar estado a confirmada
      const actualizado = await Reserva.actualizarEstado(id, 'confirmada');

      if (!actualizado) {
        return res.status(500).json({ error: 'Error al aceptar la reserva' });
      }

      res.json({
        mensaje: 'Reserva aceptada exitosamente',
        reserva_id: id
      });
    } catch (error) {
      console.error('Error en aceptarReserva:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // 5. Rechazar reserva - CON VERIFICACIÓN DE ESPECIALIDAD
  rechazarReserva: async (req, res) => {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      const trabajador_id = obtenerTrabajadorId(req);

      if (!trabajador_id) {
        return res.status(403).json({ error: 'No estás registrado como trabajador' });
      }

      // Verificar que la reserva es del trabajador
      const reserva = await Reserva.buscarPorId(id);
      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      if (reserva.trabajador_id !== trabajador_id) {
        return res.status(403).json({ error: 'No tienes permisos para rechazar esta reserva' });
      }

      // ✅ VERIFICACIÓN CRÍTICA: Especialidad
      const puedeRealizar = await verificarEspecialidad(trabajador_id, reserva.servicio_id);
      if (!puedeRealizar) {
        return res.status(400).json({
          error: 'No tienes la especialidad requerida para este servicio'
        });
      }

      if (reserva.estado !== 'pendiente') {
        return res.status(400).json({ error: 'La reserva no está pendiente' });
      }

      // ✅ CORRECCIÓN COMPLETA: Cambiar estado a "rechazada" manteniendo el trabajador_id
      const fechaRechazo = new Date().toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      const motivoRechazo = `RECHAZADA POR TRABAJADOR - ${fechaRechazo}: ${motivo}`;
      const notasActualizadas = reserva.notas_internas
        ? `${reserva.notas_internas}\n\n---\n${motivoRechazo}`
        : motivoRechazo;

      console.log(`🔄 [RECHAZAR] Actualizando reserva ${id} a estado "rechazada"`);
      console.log(`   - Trabajador: ${trabajador_id}`);
      console.log(`   - Motivo: ${motivo}`);
      console.log(`   - Notas actualizadas: ${notasActualizadas.substring(0, 100)}...`);

      // ✅ CONSULTA CORREGIDA: Mantener trabajador_id, cambiar estado a "rechazada"
      const [result] = await pool.execute(
        'UPDATE reserva SET estado = "rechazada", notas_internas = ?, motivo_cancelacion = ? WHERE id = ?',
        [notasActualizadas, motivo, id]
      );

      const actualizado = result.affectedRows > 0;

      if (!actualizado) {
        console.error(`❌ [RECHAZAR] No se pudo actualizar la reserva ${id}`);
        return res.status(500).json({ error: 'Error al rechazar la reserva' });
      }

      console.log(`✅ [RECHAZAR] Reserva ${id} rechazada exitosamente por trabajador ${trabajador_id}`);

      res.json({
        mensaje: 'Reserva rechazada exitosamente',
        reserva_id: id,
        motivo: motivo
      });
    } catch (error) {
      console.error('❌ Error en rechazarReserva:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ✅ AGREGAR MÉTODO PARA OBTENER TRABAJADORES
  obtenerTrabajadores: async (req, res) => {
    try {
      console.log('📋 [TRABAJADOR] Obteniendo lista de trabajadores');

      const trabajadores = await Trabajador.listarTodos();

      console.log(`✅ [TRABAJADOR] Encontrados ${trabajadores.length} trabajadores`);

      res.json({
        total: trabajadores.length,
        trabajadores: trabajadores
      });
    } catch (error) {
      console.error('❌ Error en obtenerTrabajadores:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener los clientes del trabajador
  obtenerMisClientes: async (req, res) => {
    try {
      console.log('👥 [TRABAJADOR] Obteniendo clientes del trabajador');
      const trabajador_id = obtenerTrabajadorId(req);

      if (!trabajador_id) {
        return res.status(403).json({ error: 'No estás registrado como trabajador' });
      }

      // Consulta para obtener los clientes que han tenido reservas con este trabajador
      const [clientes] = await pool.execute(`
      SELECT 
        u.id,
        u.nombre,
        u.apellidos,
        u.email,
        u.telefono,
        COUNT(r.id) as total_reservas,
        MAX(r.fecha_reserva) as ultima_visita,
        GROUP_CONCAT(DISTINCT s.nombre) as servicios_utilizados
      FROM usuario u
      JOIN reserva r ON u.id = r.cliente_id
      JOIN servicio s ON r.servicio_id = s.id
      WHERE r.trabajador_id = ? AND r.estado != 'rechazada'
      GROUP BY u.id, u.nombre, u.apellidos, u.email, u.telefono
      ORDER BY total_reservas DESC, ultima_visita DESC
    `, [trabajador_id]);

      console.log(`✅ [TRABAJADOR] Encontrados ${clientes.length} clientes para el trabajador`);

      // Formatear la respuesta
      const clientesFormateados = clientes.map(cliente => ({
        id: cliente.id,
        nombre: cliente.nombre,
        apellidos: cliente.apellidos,
        email: cliente.email,
        telefono: cliente.telefono,
        totalReservas: cliente.total_reservas,
        ultimaVisita: cliente.ultima_visita,
        serviciosUtilizados: cliente.servicios_utilizados ? cliente.servicios_utilizados.split(',') : []
      }));

      res.json({
        total: clientesFormateados.length,
        clientes: clientesFormateados
      });

    } catch (error) {
      console.error('❌ Error en obtenerMisClientes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // AGREGAR este método al final del archivo, antes del module.exports
  obtenerHistorialCliente: async (req, res) => {
    try {
      console.log('📋 [TRABAJADOR] Obteniendo historial de cliente específico');
      const trabajador_id = obtenerTrabajadorId(req);
      const { clienteId } = req.params;

      if (!trabajador_id) {
        return res.status(403).json({ error: 'No estás registrado como trabajador' });
      }

      // ✅ CONSULTA CORREGIDA - sin r.precio
      const [reservas] = await pool.execute(`
            SELECT 
                r.id,
                r.fecha_reserva,
                r.hora_inicio,
                r.duracion,
                r.estado,
                r.notas,
                r.fecha_creacion,
                s.nombre as servicio_nombre,
                s.descripcion as servicio_descripcion,
                s.categoria as servicio_categoria,
                s.precio as servicio_precio, 
                u.nombre as cliente_nombre,
                u.apellidos as cliente_apellidos,
                u.telefono as cliente_telefono
            FROM reserva r
            JOIN servicio s ON r.servicio_id = s.id
            JOIN usuario u ON r.cliente_id = u.id
            WHERE r.trabajador_id = ? AND r.cliente_id = ?
            ORDER BY r.fecha_reserva DESC, r.hora_inicio DESC
        `, [trabajador_id, clienteId]);

      console.log(`✅ [TRABAJADOR] Encontradas ${reservas.length} reservas para el cliente ${clienteId}`);

      // Calcular estadísticas
      const totalReservas = reservas.length;
      const reservasConfirmadas = reservas.filter(r => r.estado === 'confirmada').length;
      const totalIngresos = reservas
        .filter(r => r.estado === 'confirmada')
        .reduce((total, r) => total + (Number(r.servicio_precio) || 0), 0);

      // ✅ Formatear la respuesta CORREGIDA
      const historialFormateado = reservas.map(reserva => ({
        id: reserva.id,
        fecha: reserva.fecha_reserva,
        horaInicio: reserva.hora_inicio,
        duracion: reserva.duracion,
        estado: reserva.estado,
        notas: reserva.notas,
        precio: Number(reserva.servicio_precio) || 0,  // ✅ CONVERTIR A NÚMERO
        fechaCreacion: reserva.fecha_creacion,
        servicio: {
          nombre: reserva.servicio_nombre,
          descripcion: reserva.servicio_descripcion,
          categoria: reserva.servicio_categoria
        }
      }));

      res.json({
        cliente: {
          id: parseInt(clienteId),
          nombre: reservas[0]?.cliente_nombre || '',
          apellidos: reservas[0]?.cliente_apellidos || '',
          telefono: reservas[0]?.cliente_telefono || ''
        },
        estadisticas: {
          totalReservas,
          reservasConfirmadas,
          reservasCanceladas: totalReservas - reservasConfirmadas,
          totalIngresos,
          promedioIngreso: reservasConfirmadas > 0 ? totalIngresos / reservasConfirmadas : 0
        },
        total: historialFormateado.length,
        historial: historialFormateado
      });

    } catch (error) {
      console.error('❌ Error en obtenerHistorialCliente:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ====================
  // MÉTODOS DE ADMINISTRADOR
  // ====================

  // Crear nuevo trabajador (usuario + perfil trabajador)
  crearTrabajador: async (req, res) => {
    try {
      console.log('👤 [ADMIN] Creando nuevo trabajador');
      const {
        // Datos de usuario
        email,
        password,
        nombre,
        apellidos,
        telefono,
        direccion,
        // Datos de trabajador
        especialidades,
        categoria,
        descripcion,
        experiencia,
        horario_laboral
      } = req.body;

      // Validaciones básicas
      if (!email || !password || !nombre || !apellidos) {
        return res.status(400).json({
          error: 'Email, password, nombre y apellidos son obligatorios'
        });
      }

      // Verificar si el email ya existe
      const usuarioExistente = await Usuario.buscarPorEmail(email);
      if (usuarioExistente) {
        return res.status(400).json({
          error: 'Ya existe un usuario con este email'
        });
      }

      // Crear usuario con rol de trabajador
      const usuarioData = {
        email,
        password, // El modelo debe hashear la password
        nombre,
        apellidos,
        telefono: telefono || null,
        direccion: direccion || null,
        rol: 'trabajador'
      };

      console.log('📝 [ADMIN] Creando usuario...');
      const usuarioId = await Usuario.crear(usuarioData);

      // Crear perfil de trabajador
      console.log('👨‍💼 [ADMIN] Creando perfil de trabajador...');
      const trabajadorData = {
        especialidades: especialidades || '[]',
        categoria: categoria || 'Peluquería',
        descripcion: descripcion || null,
        experiencia: experiencia || 0,
        horario_laboral: horario_laboral || null
      };

      await Trabajador.actualizarPerfil(usuarioId, trabajadorData);

      // Obtener el trabajador creado
      const trabajadorCreado = await Trabajador.obtenerPorUsuarioId(usuarioId);

      console.log('✅ [ADMIN] Trabajador creado exitosamente');
      res.status(201).json({
        mensaje: 'Trabajador creado exitosamente',
        trabajador: trabajadorCreado
      });

    } catch (error) {
      console.error('❌ Error en crearTrabajador:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener trabajador específico
  obtenerTrabajador: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🔍 [ADMIN] Obteniendo trabajador ID: ${id}`);

      const trabajador = await Trabajador.buscarPorId(id);

      if (!trabajador) {
        return res.status(404).json({ error: 'Trabajador no encontrado' });
      }

      res.json({
        trabajador: trabajador
      });

    } catch (error) {
      console.error('❌ Error en obtenerTrabajador:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Actualizar trabajador
  // Actualizar trabajador - MÉTODO CORREGIDO
  actualizarTrabajador: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        // Datos de usuario
        email,
        nombre,
        apellidos,
        telefono,
        direccion,
        // Datos de trabajador
        especialidades,
        categoria,
        descripcion,
        experiencia,
        horario_laboral
      } = req.body;

      console.log(`✏️ [ADMIN] Actualizando trabajador ID: ${id}`, req.body);

      // Obtener trabajador existente
      const trabajadorExistente = await Trabajador.buscarPorId(id);
      if (!trabajadorExistente) {
        return res.status(404).json({ error: 'Trabajador no encontrado' });
      }

      console.log('🔍 [ADMIN] Trabajador existente:', trabajadorExistente);

      // Validar y preparar datos de usuario
      const datosUsuario = {};
      if (email && email !== trabajadorExistente.email) {
        // Verificar si el email ya existe
        const usuarioExistente = await Usuario.buscarPorEmail(email);
        if (usuarioExistente && usuarioExistente.id !== trabajadorExistente.usuario_id) {
          return res.status(400).json({ error: 'Ya existe un usuario con este email' });
        }
        datosUsuario.email = email;
      }
      if (nombre) datosUsuario.nombre = nombre;
      if (apellidos) datosUsuario.apellidos = apellidos;
      if (telefono !== undefined) datosUsuario.telefono = telefono;
      if (direccion !== undefined) datosUsuario.direccion = direccion;

      // Actualizar datos de usuario
      if (Object.keys(datosUsuario).length > 0) {
        console.log('📝 [ADMIN] Actualizando datos de usuario...', datosUsuario);
        await Usuario.actualizar(trabajadorExistente.usuario_id, datosUsuario);
        console.log('✅ [ADMIN] Usuario actualizado correctamente');
      } else {
        console.log('ℹ️ [ADMIN] No hay datos de usuario para actualizar');
      }

      // Preparar datos de trabajador
      const datosTrabajador = {};
      if (especialidades !== undefined) {
        // Convertir array a string JSON si es necesario
        datosTrabajador.especialidades = Array.isArray(especialidades)
          ? JSON.stringify(especialidades)
          : especialidades;
        console.log('🔄 [ADMIN] Especialidades procesadas:', datosTrabajador.especialidades);
      }
      if (categoria !== undefined) datosTrabajador.categoria = categoria;
      if (descripcion !== undefined) datosTrabajador.descripcion = descripcion;
      if (experiencia !== undefined) datosTrabajador.experiencia = parseInt(experiencia) || 0;
      if (horario_laboral !== undefined) {
        // Validar que horario_laboral sea un JSON válido
        try {
          if (typeof horario_laboral === 'string' && horario_laboral.trim() !== '') {
            JSON.parse(horario_laboral); // Solo validar, no asignar
          }
          datosTrabajador.horario_laboral = horario_laboral;
        } catch (e) {
          console.error('❌ [ADMIN] Error parseando horario laboral:', e);
          return res.status(400).json({ error: 'Formato de horario laboral inválido. Debe ser JSON válido.' });
        }
      }

      // Actualizar datos de trabajador
      if (Object.keys(datosTrabajador).length > 0) {
        console.log('👨‍💼 [ADMIN] Actualizando perfil de trabajador...', datosTrabajador);
        await Trabajador.actualizarPerfil(trabajadorExistente.usuario_id, datosTrabajador);
        console.log('✅ [ADMIN] Perfil trabajador actualizado correctamente');
      } else {
        console.log('ℹ️ [ADMIN] No hay datos de trabajador para actualizar');
      }

      // Obtener trabajador actualizado
      const trabajadorActualizado = await Trabajador.buscarPorId(id);

      console.log('✅ [ADMIN] Trabajador actualizado exitosamente');
      res.json({
        mensaje: 'Trabajador actualizado exitosamente',
        trabajador: trabajadorActualizado
      });

    } catch (error) {
      console.error('❌ Error en actualizarTrabajador:', error);
      res.status(500).json({
        error: 'Error interno del servidor: ' + (error.message || 'Error desconocido')
      });
    }
  },


  // Eliminar/desactivar trabajador
  eliminarTrabajador: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🗑️ [ADMIN] Eliminando/desactivando trabajador ID: ${id}`);

      // Obtener trabajador existente
      const trabajadorExistente = await Trabajador.buscarPorId(id);
      console.log('🔍 [ADMIN] Trabajador encontrado:', trabajadorExistente);

      if (!trabajadorExistente) {
        console.log('❌ [ADMIN] Trabajador no encontrado para ID:', id);
        return res.status(404).json({ error: 'Trabajador no encontrado' });
      }

      // Desactivar el usuario (eliminación suave)
      console.log('🔒 [ADMIN] Desactivando usuario ID:', trabajadorExistente.usuario_id);
      const desactivado = await Usuario.desactivar(trabajadorExistente.usuario_id);

      if (!desactivado) {
        console.log('❌ [ADMIN] Error al desactivar usuario ID:', trabajadorExistente.usuario_id);
        return res.status(500).json({ error: 'Error al desactivar el trabajador' });
      }

      console.log('✅ [ADMIN] Trabajador desactivado exitosamente');
      res.json({
        mensaje: 'Trabajador desactivado exitosamente',
        trabajador_id: id
      });

    } catch (error) {
      console.error('❌ Error en eliminarTrabajador:', error);
      res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
    }
  }
};

module.exports = trabajadorController;