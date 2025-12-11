const { pool } = require('../config/database');
const Reserva = require('../models/Reserva');
const Servicio = require('../models/Servicio');
const Trabajador = require('../models/Trabajador');
const CalendarioUtils = require('../utils/calendarioUtils');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');

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

// Función para obtener categorías válidas desde configuracion_negocio
const obtenerCategoriasValidas = async () => {
  try {
    console.log('🔍 [CATEGORIAS] Obteniendo categorías válidas desde BD');

    // Obtener las categorías desde configuracion_negocio
    const [rows] = await pool.execute(`
      SELECT categorias_especialidades 
      FROM configuracion_negocio 
      WHERE id = 1
    `);

    if (!rows[0] || !rows[0].categorias_especialidades) {
      console.log('⚠️ [CATEGORIAS] No se encontraron categorías en BD, usando valores por defecto');
      return ['Peluquería', 'Estética'];
    }

    let categoriasData;
    try {
      if (typeof rows[0].categorias_especialidades === 'string') {
        categoriasData = JSON.parse(rows[0].categorias_especialidades);
      } else {
        categoriasData = rows[0].categorias_especialidades;
      }

      const categorias = Object.keys(categoriasData);
      console.log(`✅ [CATEGORIAS] Categorías cargadas desde BD: ${categorias.join(', ')}`);
      return categorias;
    } catch (parseError) {
      console.error('❌ [CATEGORIAS] Error parseando categorias_especialidades:', parseError);
      return ['Peluquería', 'Estética'];
    }
  } catch (error) {
    console.error('❌ [CATEGORIAS] Error obteniendo categorías:', error);
    return ['Peluquería', 'Estética'];
  }
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
  // 1. Obtener mis reservas (trabajador)
  obtenerMisReservas: async (req, res) => {
    try {
      console.log('🎯 [TRABAJADOR] Obteniendo reservas para trabajador');
      console.log('   Usuario autenticado:', req.usuario.id, req.usuario.nombre, req.usuario.rol);

      const trabajador_id = obtenerTrabajadorId(req);

      if (!trabajador_id) {
        return res.status(403).json({ error: 'No estás registrado como trabajador' });
      }

      console.log(`🔍 [CONTROLADOR] Buscando reservas EXCLUSIVAS para trabajador_id: ${trabajador_id}`);

      // Campos de cancelación
      const [rows] = await pool.execute(`
      SELECT 
        r.*,
        r.motivo_cancelacion, 
        r.politica_cancelacion, -- Para futuro
        r.fecha_cancelacion,    
        r.penalizacion_aplicada, -- Para futuro
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

          // Campos cancelación
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

  // 2. Obtener reservas DISPONIBLES (sin trabajador asignado) --- SIN USAE
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

  // 3. Tomar una reserva disponible - CON VERIFICACIÓN DE ESPECIALIDAD --- SIN APLICAR
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

      // Especialidad
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

  // 4. Aceptar reserva 
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

      // Especialidad
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

  // 5. Rechazar reserva
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

      // Especialidad
      const puedeRealizar = await verificarEspecialidad(trabajador_id, reserva.servicio_id);
      if (!puedeRealizar) {
        return res.status(400).json({
          error: 'No tienes la especialidad requerida para este servicio'
        });
      }

      if (reserva.estado !== 'pendiente') {
        return res.status(400).json({ error: 'La reserva no está pendiente' });
      }

      // Cambiar estado a "rechazada"
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

  // MÉTODO PARA OBTENER TRABAJADORES
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

      const [clientes] = await pool.execute(`
      SELECT 
        u.id,
        u.nombre,
        u.apellidos,
        u.email,
        u.telefono,
        -- Contar SOLO reservas activas (no canceladas ni rechazadas)
        (
          SELECT COUNT(*) 
          FROM reserva r2 
          WHERE r2.cliente_id = u.id 
            AND r2.trabajador_id = ? 
            AND r2.estado NOT IN ('cancelada', 'rechazada')
        ) as total_reservas,
        -- Última visita de reservas activas
        (
          SELECT MAX(fecha_reserva)
          FROM reserva r3
          WHERE r3.cliente_id = u.id 
            AND r3.trabajador_id = ? 
            AND r3.estado NOT IN ('cancelada', 'rechazada')
        ) as ultima_visita,
        -- Servicios de reservas activas (sin duplicados)
        (
          SELECT GROUP_CONCAT(DISTINCT s2.nombre)
          FROM reserva r4
          JOIN servicio s2 ON r4.servicio_id = s2.id
          WHERE r4.cliente_id = u.id 
            AND r4.trabajador_id = ? 
            AND r4.estado NOT IN ('cancelada', 'rechazada')
        ) as servicios_utilizados
      FROM usuario u
      WHERE EXISTS (
        SELECT 1 
        FROM reserva r5 
        WHERE r5.cliente_id = u.id 
          AND r5.trabajador_id = ? 
          -- Incluir cliente si tiene AL MENOS UNA reserva con este trabajador
      )
      ORDER BY total_reservas DESC, ultima_visita DESC
    `, [trabajador_id, trabajador_id, trabajador_id, trabajador_id]);

      console.log(`✅ [TRABAJADOR] Encontrados ${clientes.length} clientes para el trabajador`);

      // DEPURACIÓN DETALLADA
      console.log('🔍 [DEBUG] Estados de reserva en la BD:');
      const [estados] = await pool.execute(`
      SELECT DISTINCT estado, COUNT(*) as cantidad
      FROM reserva
      WHERE trabajador_id = ?
      GROUP BY estado
    `, [trabajador_id]);

      estados.forEach(e => {
        console.log(`   - ${e.estado}: ${e.cantidad} reservas`);
      });

      // Mostrar datos de los primeros clientes
      if (clientes.length > 0) {
        console.log('🔍 [DEBUG] Datos de clientes desde BD:');
        for (let i = 0; i < Math.min(5, clientes.length); i++) {
          const cliente = clientes[i];
          console.log(`  ${i + 1}. ${cliente.nombre} ${cliente.apellidos}:`);
          console.log(`     - total_reservas (desde subconsulta): ${cliente.total_reservas}`);
          console.log(`     - telefono: ${cliente.telefono}`);
          console.log(`     - servicios: ${cliente.servicios_utilizados}`);

          // Verificar reservas reales de este cliente
          const [reservasCliente] = await pool.execute(`
          SELECT id, estado, fecha_reserva, servicio_id
          FROM reserva 
          WHERE cliente_id = ? AND trabajador_id = ?
          ORDER BY fecha_reserva DESC
        `, [cliente.id, trabajador_id]);

          console.log(`     - Reservas totales (todas): ${reservasCliente.length}`);
          console.log(`     - Desglose de estados:`);
          reservasCliente.forEach(r => {
            console.log(`       * Reserva ${r.id}: ${r.estado} (${r.fecha_reserva})`);
          });
        }
      }

      // Formatear la respuesta
      const clientesFormateados = clientes.map(cliente => ({
        id: cliente.id,
        nombre: cliente.nombre,
        apellidos: cliente.apellidos,
        email: cliente.email,
        telefono: cliente.telefono,
        totalReservas: Number(cliente.total_reservas) || 0,
        ultimaVisita: cliente.ultima_visita,
        serviciosUtilizados: cliente.servicios_utilizados
          ? cliente.servicios_utilizados.split(',').filter(s => s.trim() !== '')
          : []
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

  obtenerHistorialCliente: async (req, res) => {
    try {
      console.log('📋 [TRABAJADOR] Obteniendo historial de cliente específico');
      const trabajador_id = obtenerTrabajadorId(req);
      const { clienteId } = req.params;

      if (!trabajador_id) {
        return res.status(403).json({ error: 'No estás registrado como trabajador' });
      }

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

      // Calcular estadísticas CORREGIDAS
      const totalReservas = reservas.length;
      const reservasConfirmadas = reservas.filter(r => r.estado === 'confirmada').length;
      const reservasPendientes = reservas.filter(r => r.estado === 'pendiente').length;
      const reservasCanceladas = reservas.filter(r => r.estado === 'cancelada').length;
      const reservasRechazadas = reservas.filter(r => r.estado === 'rechazada').length;
      const reservasCompletadas = reservas.filter(r => r.estado === 'completada').length;

      // Total ingresos de reservas confirmadas y completadas
      const totalIngresos = reservas
        .filter(r => r.estado === 'confirmada' || r.estado === 'completada')
        .reduce((total, r) => total + (Number(r.servicio_precio) || 0), 0);

      // Formatear la respuesta
      const historialFormateado = reservas.map(reserva => ({
        id: reserva.id,
        fecha: reserva.fecha_reserva,
        horaInicio: reserva.hora_inicio,
        duracion: reserva.duracion,
        estado: reserva.estado,
        notas: reserva.notas,
        precio: Number(reserva.servicio_precio) || 0,
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
          reservasPendientes,
          reservasCanceladas,
          reservasRechazadas,
          reservasCompletadas,
          totalIngresos,
          promedioIngreso: (reservasConfirmadas + reservasCompletadas) > 0
            ? totalIngresos / (reservasConfirmadas + reservasCompletadas)
            : 0
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

      // Validar categoría
      if (categoria) {
        const categoriasPermitidas = await obtenerCategoriasValidas();
        if (!categoriasPermitidas.includes(categoria)) {
          return res.status(400).json({
            error: `Categoría inválida. Categorías permitidas: ${categoriasPermitidas.join(', ')}`
          });
        }
      }

      // Crear usuario con rol de trabajador
      const usuarioData = {
        email,
        password,
        nombre,
        apellidos,
        telefono: telefono || null,
        direccion: direccion || null,
        rol: 'trabajador',
        preguntaSeguridad: null,
        respuestaSeguridadHash: null
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
        horario_laboral,
        // Nueva contraseña
        newPassword
      } = req.body;

      console.log(`✏️ [ADMIN] Actualizando trabajador ID: ${id}`);
      console.log('📋 [ADMIN] Datos recibidos:', {
        email, nombre, apellidos, telefono, direccion,
        especialidades, categoria, experiencia, newPassword
      });

      // 1. Obtener trabajador existente
      const trabajadorExistente = await Trabajador.buscarPorId(id);
      if (!trabajadorExistente) {
        return res.status(404).json({ error: 'Trabajador no encontrado' });
      }

      console.log('✅ [ADMIN] Trabajador encontrado:', {
        id: trabajadorExistente.id,
        usuario_id: trabajadorExistente.usuario_id,
        rol: trabajadorExistente.rol,
        nombre: trabajadorExistente.nombre,
        email: trabajadorExistente.email
      });

      // 2. Obtener el usuario completo para verificar su rol
      const [usuarios] = await pool.execute(
        'SELECT * FROM usuario WHERE id = ?',
        [trabajadorExistente.usuario_id]
      );

      if (usuarios.length === 0) {
        return res.status(404).json({ error: 'Usuario asociado no encontrado' });
      }

      const usuarioDB = usuarios[0];
      const esAdministrador = usuarioDB.rol === 'administrador';
      console.log(esAdministrador);

      console.log(`🔍 [ADMIN] Rol del usuario en BD: ${usuarioDB.rol}, esAdministrador: ${esAdministrador}`);

      // 3. Si es administrador, NO permitir cambiar NADA de usuario (ni datos personales NI contraseña)
      if (esAdministrador) {
        console.log('⚠️ [ADMIN] Trabajador es administrador - SOLO datos profesionales');

        // Verificar si se intenta cambiar datos de usuario (incluyendo contraseña)
        const datosUsuarioProhibidos = email || nombre || apellidos || telefono || direccion || newPassword;

        if (datosUsuarioProhibidos) {
          console.log('❌ [ADMIN] Intento de modificar datos personales/contraseña de administrador');
          console.log('📋 [ADMIN] Datos prohibidos detectados:', {
            email, nombre, apellidos, telefono, direccion, newPassword
          });
          return res.status(403).json({
            error: 'No se pueden modificar los datos personales ni la contraseña de un administrador. Solo puede editar información profesional.'
          });
        }

        console.log('✅ [ADMIN] No hay datos de usuario para actualizar (administrador)');
      }

      // 4. Preparar datos de usuario (solo si NO es administrador)
      const datosUsuario = {};
      if (!esAdministrador) {
        console.log('✅ [ADMIN] Trabajador NO es administrador - permitiendo cambios');

        // 4.1. Validar email
        if (email && email !== trabajadorExistente.email) {
          // Verificar que el email tenga el dominio correcto
          if (!email.endsWith('@selene.com')) {
            return res.status(400).json({
              error: 'El email debe terminar en @selene.com'
            });
          }

          const usuarioExistente = await Usuario.buscarPorEmail(email);
          if (usuarioExistente && usuarioExistente.id !== trabajadorExistente.usuario_id) {
            return res.status(400).json({ error: 'Ya existe un usuario con este email' });
          }
          datosUsuario.email = email;
          console.log('📧 [ADMIN] Email actualizado:', email);
        }

        // 4.2. Validar y asignar nombre
        if (nombre) {
          if (nombre.length < 2) {
            return res.status(400).json({
              error: 'El nombre debe tener al menos 2 caracteres'
            });
          }
          datosUsuario.nombre = nombre;
          console.log('👤 [ADMIN] Nombre actualizado:', nombre);
        }

        // 4.3. Validar y asignar apellidos
        if (apellidos) {
          if (apellidos.length < 2) {
            return res.status(400).json({
              error: 'Los apellidos deben tener al menos 2 caracteres'
            });
          }
          datosUsuario.apellidos = apellidos;
          console.log('👥 [ADMIN] Apellidos actualizados:', apellidos);
        }

        // 4.4. Validar y asignar teléfono
        if (telefono !== undefined) {
          if (telefono && telefono.trim() !== '') {
            const cleaned = telefono.replace(/\s+/g, '').replace(/-/g, '');
            const phonePattern = /^(\+34|0034|34)?[6789]\d{8}$/;
            if (!phonePattern.test(cleaned)) {
              return res.status(400).json({
                error: 'Número de teléfono inválido. Formatos aceptados: XXX XX XX XX, XXX XXX XXX o XXXXXXXXX'
              });
            }
          }
          datosUsuario.telefono = telefono;
          console.log('📞 [ADMIN] Teléfono actualizado:', telefono);
        }

        // 4.5. Asignar dirección
        if (direccion !== undefined) {
          datosUsuario.direccion = direccion;
          console.log('🏠 [ADMIN] Dirección actualizada:', direccion);
        }

        // 4.6. Cambiar contraseña si se proporciona
        if (newPassword) {
          console.log('🔑 [ADMIN] Cambiando contraseña del trabajador');

          // Validar nueva contraseña
          const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
          if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
              error: 'La contraseña debe tener al menos 6 caracteres y contener al menos una letra y un número'
            });
          }

          // Cambiar contraseña del trabajador
          const passwordHash = await bcrypt.hash(newPassword, 10);
          datosUsuario.password = passwordHash;
          console.log('✅ [ADMIN] Contraseña actualizada (hash generado)');
        }
      }

      // 5. Actualizar datos de usuario (solo si hay cambios y NO es administrador)
      if (Object.keys(datosUsuario).length > 0 && !esAdministrador) {
        console.log('📝 [ADMIN] Actualizando datos de usuario en BD:', datosUsuario);
        const actualizado = await Usuario.actualizar(trabajadorExistente.usuario_id, datosUsuario);
        if (actualizado) {
          console.log('✅ [ADMIN] Usuario actualizado correctamente en BD');
        } else {
          console.error('❌ [ADMIN] Error al actualizar usuario en BD');
          return res.status(500).json({ error: 'Error al actualizar datos del usuario' });
        }
      } else {
        console.log('ℹ️ [ADMIN] No hay datos de usuario para actualizar');
      }

      // 6. Preparar datos de trabajador (siempre se pueden actualizar, incluso para administradores)
      const datosTrabajador = {};
      let hayCambiosTrabajador = false;

      // 6.1. Especialidades
      if (especialidades !== undefined) {
        let especialidadesArray;

        if (Array.isArray(especialidades)) {
          especialidadesArray = especialidades;
        } else if (typeof especialidades === 'string') {
          try {
            especialidadesArray = JSON.parse(especialidades);
          } catch (e) {
            especialidadesArray = [especialidades];
          }
        } else {
          return res.status(400).json({ error: 'Formato de especialidades inválido' });
        }

        // Validar que hay al menos una especialidad
        if (!Array.isArray(especialidadesArray) || especialidadesArray.length === 0) {
          return res.status(400).json({ error: 'Debe seleccionar al menos una especialidad' });
        }

        datosTrabajador.especialidades = JSON.stringify(especialidadesArray);
        hayCambiosTrabajador = true;
        console.log('🔄 [ADMIN] Especialidades actualizadas:', especialidadesArray);
      }

      // 6.2. Categoría
      if (categoria !== undefined) {
        // Obtener categorías válidas desde la BD
        const categoriasPermitidas = await obtenerCategoriasValidas();

        console.log(`🔍 [ADMIN] Validando categoría "${categoria}" contra:`, categoriasPermitidas);

        if (!categoriasPermitidas.includes(categoria)) {
          return res.status(400).json({
            error: `Categoría inválida. Categorías permitidas: ${categoriasPermitidas.join(', ')}`
          });
        }

        datosTrabajador.categoria = categoria;
        hayCambiosTrabajador = true;
        console.log('📂 [ADMIN] Categoría actualizada:', categoria);
      }

      // 6.3. Descripción
      if (descripcion !== undefined) {
        datosTrabajador.descripcion = descripcion;
        hayCambiosTrabajador = true;
        console.log('📝 [ADMIN] Descripción actualizada');
      }

      // 6.4. Experiencia
      if (experiencia !== undefined) {
        const expNum = parseInt(experiencia);
        if (isNaN(expNum) || expNum < 0 || expNum > 50) {
          return res.status(400).json({ error: 'La experiencia debe ser un número entre 0 y 50' });
        }
        datosTrabajador.experiencia = expNum;
        hayCambiosTrabajador = true;
        console.log('📊 [ADMIN] Experiencia actualizada:', expNum);
      }

      // 6.5. Horario laboral
      if (horario_laboral !== undefined) {
        try {
          if (typeof horario_laboral === 'string' && horario_laboral.trim() !== '') {
            JSON.parse(horario_laboral);
          }
          datosTrabajador.horario_laboral = horario_laboral;
          hayCambiosTrabajador = true;
          console.log('⏰ [ADMIN] Horario laboral actualizado');
        } catch (e) {
          return res.status(400).json({
            error: 'Formato de horario laboral inválido. Debe ser JSON válido.'
          });
        }
      }

      // 7. Actualizar datos de trabajador (si hay cambios)
      if (hayCambiosTrabajador) {
        console.log('👨‍💼 [ADMIN] Actualizando perfil de trabajador en BD:', datosTrabajador);
        const perfilActualizado = await Trabajador.actualizarPerfil(trabajadorExistente.usuario_id, datosTrabajador);
        if (perfilActualizado) {
          console.log('✅ [ADMIN] Perfil trabajador actualizado correctamente en BD');
        } else {
          console.error('❌ [ADMIN] Error al actualizar perfil de trabajador en BD');
          return res.status(500).json({ error: 'Error al actualizar datos del trabajador' });
        }
      } else {
        console.log('ℹ️ [ADMIN] No hay datos de trabajador para actualizar');
      }

      // 8. Obtener trabajador actualizado
      const trabajadorActualizado = await Trabajador.buscarPorId(id);

      if (!trabajadorActualizado) {
        return res.status(500).json({ error: 'Error al obtener trabajador actualizado' });
      }

      console.log('✅ [ADMIN] Trabajador actualizado exitosamente');
      console.log('📋 [ADMIN] Trabajador resultante:', {
        id: trabajadorActualizado.id,
        nombre: trabajadorActualizado.nombre,
        email: trabajadorActualizado.email,
        rol: trabajadorActualizado.rol,
        especialidades: trabajadorActualizado.especialidades,
        categoria: trabajadorActualizado.categoria
      });

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
  },

  verificarPerfilTrabajador: async (req, res) => {
    try {
      const { usuarioId } = req.params;
      console.log(`🔍 [CONTROLADOR] Verificando perfil de trabajador para usuario: ${usuarioId}`);

      const trabajador = await Trabajador.obtenerPorUsuarioId(usuarioId);
      const tienePerfil = !!trabajador;

      console.log(`✅ [CONTROLADOR] Usuario ${usuarioId} ${tienePerfil ? 'TIENE' : 'NO TIENE'} perfil de trabajador`);

      res.json({
        tienePerfil: tienePerfil,
        trabajador: trabajador || null
      });
    } catch (error) {
      console.error('❌ Error en verificarPerfilTrabajador:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = trabajadorController;