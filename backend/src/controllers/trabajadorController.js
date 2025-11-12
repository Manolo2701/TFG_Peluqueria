const { pool } = require('../config/database');
const Reserva = require('../models/Reserva');
const Servicio = require('../models/Servicio');
const Trabajador = require('../models/Trabajador');
const CalendarioUtils = require('../utils/calendarioUtils');

// Función helper para obtener el ID del trabajador según el tipo de usuario
const obtenerTrabajadorId = (req) => {
  console.log(`🔍 [OBTENER_TRABAJADOR_ID] Buscando trabajadorId para usuario: ${req.usuario.id}`);
  console.log(`   trabajadorId en req.usuario: ${req.usuario.trabajadorId}`);
  console.log(`   rol: ${req.usuario.rol}`);

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

    const puedeRealizar = CalendarioUtils.puedeRealizarServicio(trabajador, servicio);
    console.log(`🎯 [ESPECIALIDAD] Resultado: ${puedeRealizar ? '✅ PUEDE' : '❌ NO PUEDE'} - ${trabajador.nombre} para ${servicio.nombre}`);

    return puedeRealizar;
  } catch (error) {
    console.error('Error en verificarEspecialidad:', error);
    return false;
  }
};

const trabajadorController = {
  // 1. Obtener MIS reservas asignadas específicamente a mí
  obtenerMisReservas: async (req, res) => {
    try {
      console.log('🎯 [TRABAJADOR] Obteniendo reservas para trabajador');
      console.log('   Usuario autenticado:', req.usuario.id, req.usuario.nombre, req.usuario.rol);

      const trabajador_id = obtenerTrabajadorId(req);

      if (!trabajador_id) {
        return res.status(403).json({ error: 'No estás registrado como trabajador' });
      }

      console.log(`🔍 [CONTROLADOR] Buscando reservas EXCLUSIVAS para trabajador_id: ${trabajador_id}`);
      console.log(`📊 [CONTROLADOR] Tipo de trabajador_id: ${typeof trabajador_id}, Valor: ${trabajador_id}`);

      // CONSULTA MEJORADA - Traer TODOS los datos necesarios
      const [rows] = await pool.execute(`
      SELECT 
        r.*,
        u_cliente.nombre as cliente_nombre,
        u_cliente.apellidos as cliente_apellidos, 
        u_cliente.telefono as cliente_telefono,
        s.nombre as servicio_nombre,
        s.precio as servicio_precio,  -- ✅ INCLUIR PRECIO
        s.duracion as servicio_duracion,
        s.categoria as servicio_categoria,
        s.descripcion as servicio_descripcion,
        u_trabajador.nombre as trabajador_nombre,  -- ✅ INCLUIR NOMBRE TRABAJADOR
        u_trabajador.apellidos as trabajador_apellidos,  -- ✅ INCLUIR APELLIDOS TRABAJADOR
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
          precio: r.servicio_precio,  // ✅ PRECIO DIRECTAMENTE ACCESIBLE

          // Campos planos para compatibilidad (formato calendario general)
          cliente_nombre: r.cliente_nombre,
          cliente_apellidos: r.cliente_apellidos,
          servicio_nombre: r.servicio_nombre,
          servicio_precio: r.servicio_precio,  // ✅ PRECIO EN CAMPO PLANO
          servicio_duracion: r.servicio_duracion,
          servicio_categoria: r.servicio_categoria,
          trabajador_nombre: r.trabajador_nombre,  // ✅ NOMBRE EN CAMPO PLANO
          trabajador_apellidos: r.trabajador_apellidos,  // ✅ APELLIDOS EN CAMPO PLANO

          // Objetos anidados (formato trabajadores)
          cliente: {
            id: r.cliente_id,
            nombre: r.cliente_nombre,
            apellidos: r.cliente_apellidos,
            telefono: r.cliente_telefono
          },
          servicio: {
            id: r.servicio_id,
            nombre: r.servicio_nombre,
            precio: r.servicio_precio,  // ✅ PRECIO EN OBJETO ANIDADO
            duracion: r.servicio_duracion,
            categoria: r.servicio_categoria,
            descripcion: r.servicio_descripcion
          },
          trabajador: {
            id: r.trabajador_id,
            nombre: r.trabajador_nombre,  // ✅ NOMBRE EN OBJETO ANIDADO
            apellidos: r.trabajador_apellidos,  // ✅ APELLIDOS EN OBJETO ANIDADO
            email: r.trabajador_email,
            especialidades: (() => {
              try {
                if (!r.trabajador_especialidades) return [];

                // Si ya es un array, devolverlo directamente
                if (Array.isArray(r.trabajador_especialidades)) {
                  return r.trabajador_especialidades;
                }

                // Si es string, intentar parsear JSON
                if (typeof r.trabajador_especialidades === 'string') {
                  // Si parece una lista separada por comas, convertir a array
                  if (r.trabajador_especialidades.includes(',')) {
                    return r.trabajador_especialidades.split(',').map(esp => esp.trim());
                  }
                  // Intentar parsear como JSON
                  try {
                    return JSON.parse(r.trabajador_especialidades);
                  } catch (jsonError) {
                    // Si falla el parseo JSON, devolver como array simple
                    return [r.trabajador_especialidades];
                  }
                }

                return [];
              } catch (error) {
                console.error('Error en obtenerMisReservas:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
              }
            })
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

      // Si es una reserva específica, cancelar completamente
      // Si es una reserva tomada, liberarla para otros trabajadores
      let resultado;
      if (reserva.notas && reserva.notas.includes('selección específica')) {
        // Reserva específica - cancelar definitivamente
        resultado = await Reserva.actualizarEstado(id, 'cancelada');
      } else {
        // Reserva tomada - liberar para otros
        resultado = await Reserva.liberarReserva(id);
      }

      if (!resultado) {
        return res.status(500).json({ error: 'Error al rechazar la reserva' });
      }

      res.json({
        mensaje: 'Reserva rechazada exitosamente',
        reserva_id: id,
        liberada: !(reserva.notas && reserva.notas.includes('selección específica'))
      });
    } catch (error) {
      console.error('Error en rechazarReserva:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = trabajadorController;