const AusenciaTrabajador = require('../models/AusenciaTrabajador');
const Trabajador = require('../models/Trabajador');
const Reserva = require('../models/Reserva');
const Servicio = require('../models/Servicio');
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

const calendarioController = {
    // Obtener disponibilidad de trabajadores para una fecha y servicio específico
    obtenerDisponibilidad: async (req, res) => {
        try {
            const { fecha, servicio_id } = req.query;

            console.log(`🔍 SOLICITUD DISPONIBILIDAD - fecha: ${fecha}, servicio_id: ${servicio_id}`);

            if (!fecha || !servicio_id) {
                return res.status(400).json({
                    error: 'La fecha y servicio_id son requeridos'
                });
            }

            // Validar que la fecha no sea en el pasado
            if (!CalendarioUtils.esFechaValidaParaReserva(fecha)) {
                return res.status(400).json({
                    error: 'No se pueden hacer reservas para fechas pasadas'
                });
            }

            // Obtener información del servicio
            const servicio = await Servicio.buscarPorId(servicio_id);
            if (!servicio) {
                console.log('❌ SERVICIO NO ENCONTRADO');
                return res.status(404).json({
                    error: 'Servicio no encontrado'
                });
            }

            console.log(`✅ Servicio: ${servicio.nombre}, Categoría: ${servicio.categoria}`);

            // Obtener todos los trabajadores activos
            const trabajadores = await Trabajador.listarTodos();
            console.log(`👥 Total trabajadores encontrados: ${trabajadores.length}`);

            const diaSemana = CalendarioUtils.obtenerDiaSemana(fecha);
            console.log(`📅 Día de la semana: ${diaSemana}`);

            const disponibilidad = [];

            for (const trabajador of trabajadores) {
                console.log(`\n--- PROCESANDO TRABAJADOR: ${trabajador.nombre} ---`);
                console.log(`ID: ${trabajador.id}, Especialidades:`, trabajador.especialidades);

                // Verificar si el trabajador puede realizar este servicio
                const esCapaz = CalendarioUtils.puedeRealizarServicio(trabajador, servicio);

                if (!esCapaz) {
                    console.log(`❌ Trabajador NO PUEDE realizar el servicio`);
                    continue;
                }

                console.log(`✅ Trabajador PUEDE realizar el servicio`);

                // Verificar si el trabajador tiene ausencia en esa fecha
                const tieneAusencia = !(await AusenciaTrabajador.verificarDisponibilidad(
                    trabajador.id,
                    fecha
                ));

                if (tieneAusencia) {
                    console.log(`❌ Trabajador tiene AUSENCIA en esta fecha`);
                    continue;
                }

                console.log(`✅ Trabajador NO tiene ausencias`);

                // Obtener reservas del trabajador para esa fecha
                const reservas = await Reserva.buscarPorTrabajadorYFecha(trabajador.id, fecha);
                console.log(`📋 Reservas existentes: ${reservas.length}`);

                // Obtener horario laboral del trabajador para ese día usando el nuevo método
                const horarioLaboral = trabajador.horario_laboral;
                console.log(`⏰ Horario laboral completo:`, horarioLaboral);

                // ✅ USAR EL NUEVO MÉTODO DE CalendarioUtils
                const horarioDia = CalendarioUtils.obtenerHorarioParaDia(horarioLaboral, diaSemana);

                // Generar slots disponibles
                const slotsDisponibles = horarioDia && !tieneAusencia ?
                    CalendarioUtils.generarSlotsDisponibles(
                        horarioDia,
                        reservas,
                        servicio.duracion
                    ) : [];

                console.log(`🕒 Slots disponibles generados: ${slotsDisponibles.length}`);

                disponibilidad.push({
                    trabajador: {
                        id: trabajador.id,
                        nombre: trabajador.nombre,
                        apellidos: trabajador.apellidos,
                        especialidades: trabajador.especialidades,
                        descripcion: trabajador.descripcion
                    },
                    servicio: {
                        id: servicio.id,
                        nombre: servicio.nombre,
                        duracion: servicio.duracion,
                        categoria: servicio.categoria
                    },
                    disponible: slotsDisponibles.length > 0,
                    slots_disponibles: slotsDisponibles,
                    horario_laboral: horarioDia,
                    ausencia: tieneAusencia,
                    reservas_existentes: reservas.map(r => ({
                        hora_inicio: r.hora_inicio,
                        duracion: r.duracion,
                        servicio: r.servicio_nombre
                    }))
                });
            }

            // Si no hay trabajadores disponibles
            if (disponibilidad.length === 0) {
                console.log(`\n❌ RESULTADO FINAL: Ningún trabajador disponible`);
                console.log(`Razón posible:
                - Ningún trabajador puede realizar el servicio
                - Todos tienen ausencias
                - No tienen horario para el día ${diaSemana}
                - Problema con el formato del horario laboral`);

                return res.status(404).json({
                    error: `No hay trabajadores disponibles para servicio de ${servicio.categoria} en la fecha seleccionada`,
                    sugerencia: 'Intente con otra fecha o contacte con el establecimiento'
                });
            }

            console.log(`\n✅ RESULTADO FINAL: ${disponibilidad.length} trabajadores disponibles`);
            res.json({
                fecha,
                servicio: {
                    id: servicio.id,
                    nombre: servicio.nombre,
                    categoria: servicio.categoria,
                    duracion: servicio.duracion
                },
                disponibilidad,
                // ✅ Añadir resumen para facilitar el frontend
                resumen: {
                    total_trabajadores: disponibilidad.length,
                    trabajadores_disponibles: disponibilidad.filter(d => d.disponible).length,
                    slots_totales: disponibilidad.reduce((total, d) => total + d.slots_disponibles.length, 0)
                }
            });

        } catch (error) {
            console.error('❌ ERROR CRÍTICO en calendarioController.obtenerDisponibilidad:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // NUEVO MÉTODO: Obtener disponibilidad rápida (versión simplificada)
    obtenerDisponibilidadRapida: async (req, res) => {
        try {
            const { fecha, id_servicio } = req.query;

            console.log(`[CALENDARIO] Consultando disponibilidad rápida para:`, { fecha, id_servicio });

            if (!fecha || !id_servicio) {
                return res.status(400).json({
                    error: 'Parámetros requeridos: fecha y id_servicio'
                });
            }

            // Obtener información del servicio
            const servicio = await Servicio.buscarPorId(id_servicio);
            if (!servicio) {
                return res.status(404).json({
                    error: 'Servicio no encontrado'
                });
            }

            // Horarios de trabajo estándar
            const horariosDisponibles = [
                '09:00', '10:00', '11:00', '12:00',
                '16:00', '17:00', '18:00', '19:00'
            ];

            // Simular disponibilidad (en un sistema real, consultarías la base de datos)
            const disponibilidad = horariosDisponibles.map(hora => ({
                hora,
                disponible: Math.random() > 0.3 // 70% de probabilidad de disponible
            }));

            const horariosDisponiblesFiltrados = disponibilidad
                .filter(h => h.disponible)
                .map(h => h.hora);

            const respuesta = {
                fecha,
                servicio: {
                    id: servicio.id,
                    nombre: servicio.nombre,
                    precio: servicio.precio,
                    duracion: servicio.duracion
                },
                horarios: horariosDisponiblesFiltrados,
                total_disponibles: horariosDisponiblesFiltrados.length,
                mensaje: horariosDisponiblesFiltrados.length > 0 ?
                    `Hay ${horariosDisponiblesFiltrados.length} horarios disponibles` :
                    'No hay horarios disponibles para esta fecha'
            };

            console.log(`[CALENDARIO] Disponibilidad encontrada: ${respuesta.total_disponibles} horarios`);

            res.json(respuesta);
        } catch (error) {
            console.error('[CALENDARIO] Error en disponibilidad rápida:', error);
            res.status(500).json({
                error: 'Error al verificar disponibilidad',
                detalles: error.message
            });
        }
    },

    // Obtener mi calendario personal (para trabajadores y admin-trabajadores)
    obtenerMiCalendario: async (req, res) => {
        try {
            const trabajadorId = obtenerTrabajadorId(req);

            if (!trabajadorId) {
                return res.status(403).json({
                    error: 'No tienes permisos para acceder a esta funcionalidad'
                });
            }

            const { mes, año } = req.query;

            // Obtener ausencias del trabajador
            const ausencias = await AusenciaTrabajador.obtenerPorTrabajador(trabajadorId);

            // Obtener perfil del trabajador para el horario
            const trabajador = await Trabajador.obtenerPerfil(trabajadorId);

            res.json({
                trabajador: {
                    nombre: trabajador.nombre,
                    apellidos: trabajador.apellidos,
                    horario_laboral: trabajador.horario_laboral
                },
                ausencias
            });

        } catch (error) {
            console.error('Error en calendarioController.obtenerMiCalendario:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Solicitar ausencia (para trabajadores y admin-trabajadores)
    solicitarAusencia: async (req, res) => {
        try {
            const trabajadorId = obtenerTrabajadorId(req);

            if (!trabajadorId) {
                return res.status(403).json({
                    error: 'No tienes permisos para esta acción'
                });
            }

            const { tipo, fecha_inicio, fecha_fin, motivo } = req.body;

            if (!tipo || !fecha_inicio || !fecha_fin) {
                return res.status(400).json({
                    error: 'Tipo, fecha_inicio y fecha_fin son requeridos'
                });
            }

            const ausenciaId = await AusenciaTrabajador.crear({
                trabajador_id: trabajadorId,
                tipo,
                fecha_inicio,
                fecha_fin,
                motivo
            });

            res.status(201).json({
                mensaje: 'Solicitud de ausencia creada exitosamente',
                ausencia_id: ausenciaId
            });

        } catch (error) {
            console.error('Error en calendarioController.solicitarAusencia:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Obtener todas las ausencias (para administradores)
    obtenerTodasAusencias: async (req, res) => {
        try {
            if (req.usuario.rol !== 'administrador') {
                return res.status(403).json({
                    error: 'No tienes permisos para esta acción'
                });
            }

            const ausencias = await AusenciaTrabajador.obtenerTodas(req.query);
            res.json({ ausencias });
        } catch (error) {
            console.error('Error en calendarioController.obtenerTodasAusencias:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Aprobar/rechazar ausencia
    gestionarAusencia: async (req, res) => {
        try {
            if (req.usuario.rol !== 'administrador') {
                return res.status(403).json({
                    error: 'No tienes permisos para esta acción'
                });
            }

            const { id } = req.params;
            const { estado } = req.body;

            if (!['aprobado', 'rechazado'].includes(estado)) {
                return res.status(400).json({
                    error: 'Estado debe ser "aprobado" o "rechazado"'
                });
            }

            const actualizado = await AusenciaTrabajador.actualizarEstado(id, estado);

            if (!actualizado) {
                return res.status(404).json({
                    error: 'Ausencia no encontrada'
                });
            }

            res.json({
                mensaje: `Ausencia ${estado} exitosamente`
            });

        } catch (error) {
            console.error('Error en calendarioController.gestionarAusencia:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    },

    // Obtener mis ausencias (para trabajadores)
    obtenerMisAusencias: async (req, res) => {
        try {
            const trabajadorId = obtenerTrabajadorId(req);

            if (!trabajadorId) {
                return res.status(403).json({
                    error: 'No tienes permisos para acceder a esta funcionalidad'
                });
            }

            const ausencias = await AusenciaTrabajador.obtenerPorTrabajador(trabajadorId);

            res.json({
                ausencias: ausencias || []
            });

        } catch (error) {
            console.error('Error en calendarioController.obtenerMisAusencias:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    }
};

module.exports = calendarioController;