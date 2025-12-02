const AusenciaTrabajador = require('../models/AusenciaTrabajador');
const Trabajador = require('../models/Trabajador');
const Reserva = require('../models/Reserva');
const Servicio = require('../models/Servicio');
const CalendarioUtils = require('../utils/calendarioUtils');
const { pool } = require('../config/database');

// Función helper para obtener el ID del trabajador según el tipo de usuario
const obtenerTrabajadorId = async (req) => {
    try {
        console.log(`🔍 [OBTENER_TRABAJADOR_ID] Buscando trabajadorId para usuario: ${req.usuario.id}`);
        console.log(`   Rol: ${req.usuario.rol}, Nombre: ${req.usuario.nombre}`);

        // ✅ CORRECCIÓN: Verificar si ya tenemos el ID y devolverlo DIRECTAMENTE
        if (req.usuario.trabajadorId && typeof req.usuario.trabajadorId === 'number') {
            console.log(`✅ [OBTENER_TRABAJADOR_ID] Usando trabajadorId existente: ${req.usuario.trabajadorId}`);
            return req.usuario.trabajadorId;
        }

        console.log('🔍 [OBTENER_TRABAJADOR_ID] Buscando trabajadorId en base de datos...');

        const trabajador = await Trabajador.obtenerPorUsuarioId(req.usuario.id);
        console.log(`📋 [OBTENER_TRABAJADOR_ID] Resultado de búsqueda:`, trabajador);

        if (trabajador && trabajador.trabajador_id) {
            const trabajadorIdNum = Number(trabajador.trabajador_id);
            console.log(`✅ [OBTENER_TRABAJADOR_ID] Encontrado trabajadorId: ${trabajadorIdNum} (tipo: ${typeof trabajadorIdNum})`);
            req.usuario.trabajadorId = trabajadorIdNum;
            return trabajadorIdNum;
        }

        console.log('❌ [OBTENER_TRABAJADOR_ID] No se encontró trabajadorId para el usuario');
        return null;

    } catch (error) {
        console.error('❌ Error en obtenerTrabajadorId:', error);
        return null;
    }
};

const calendarioController = {
    // Obtener disponibilidad de trabajadores para una fecha y servicio específico
    obtenerDisponibilidad: async (req, res) => {
        try {
            const { fecha, servicio_id } = req.query;

            console.log(`\n🎯 ==========================================`);
            console.log(`🎯 SOLICITUD DISPONIBILIDAD INICIADA`);
            console.log(`🎯 Fecha: ${fecha}, Servicio ID: ${servicio_id}`);
            console.log(`🎯 ==========================================`);

            if (!fecha || !servicio_id) {
                console.log(`❌ FALTAN PARÁMETROS: fecha: ${fecha}, servicio_id: ${servicio_id}`);
                return res.status(400).json({
                    error: 'La fecha y servicio_id son requeridos'
                });
            }

            // Validar que la fecha no sea en el pasado
            if (!CalendarioUtils.esFechaValidaParaReserva(fecha)) {
                console.log(`❌ FECHA NO VÁLIDA: ${fecha} es una fecha pasada`);
                return res.status(400).json({
                    error: 'No se pueden hacer reservas para fechas pasadas'
                });
            }

            // Obtener información del servicio
            const servicio = await Servicio.buscarPorId(servicio_id);
            if (!servicio) {
                console.log(`❌ SERVICIO NO ENCONTRADO: ${servicio_id}`);
                return res.status(404).json({
                    error: 'Servicio no encontrado'
                });
            }

            console.log(`✅ Servicio encontrado: ${servicio.nombre}, Categoría: ${servicio.categoria}`);

            // Obtener todos los trabajadores activos
            console.log(`🔍 Buscando todos los trabajadores activos...`);
            const trabajadores = await Trabajador.listarTodos();
            console.log(`👥 Total trabajadores encontrados: ${trabajadores.length}`);

            // 🆕 LOG DETALLADO: Mostrar todos los trabajadores
            trabajadores.forEach((t, index) => {
                console.log(`   ${index + 1}. ${t.nombre} ${t.apellidos} - ID: ${t.id}, Usuario_ID: ${t.usuario_id}`);
            });

            const diaSemana = CalendarioUtils.obtenerDiaSemana(fecha);
            console.log(`📅 Día de la semana para ${fecha}: ${diaSemana}`);

            const disponibilidad = [];
            let trabajadoresConAusencia = 0;
            let trabajadoresSinCapacidad = 0;
            let trabajadoresSinHorario = 0;
            let trabajadoresConHorarioInvalido = 0;

            for (const trabajador of trabajadores) {
                console.log(`\n--- 🔄 PROCESANDO TRABAJADOR: ${trabajador.nombre} ${trabajador.apellidos} ---`);

                // ✅ VERIFICACIÓN CRÍTICA: Asegurar que tenemos usuario_id
                if (!trabajador.usuario_id) {
                    console.log(`❌ ERROR CRÍTICO: trabajador ${trabajador.nombre} NO tiene usuario_id`);
                    console.log(`📋 Datos completos del trabajador:`, trabajador);
                    continue;
                }

                console.log(`📋 Datos trabajador: ID: ${trabajador.id}, Usuario_ID: ${trabajador.usuario_id}, Nombre: ${trabajador.nombre}`);

                // 🆕 LOG ESPECIAL PARA ANA RODRÍGUEZ
                if (trabajador.nombre === 'Ana' && trabajador.apellidos.includes('Rodriguez')) {
                    console.log(`🎯 🎯 🎯 TRABAJADOR ESPECIAL: ANA RODRÍGUEZ DETECTADA 🎯 🎯 🎯`);
                    console.log(`🎯 ID: ${trabajador.id}, Usuario_ID: ${trabajador.usuario_id}`);
                }

                // Verificar si el trabajador puede realizar este servicio
                const esCapaz = CalendarioUtils.puedeRealizarServicio(trabajador, servicio);

                if (!esCapaz) {
                    console.log(`❌ Trabajador NO PUEDE realizar el servicio ${servicio.nombre}`);
                    trabajadoresSinCapacidad++;
                    continue;
                }

                console.log(`✅ Trabajador PUEDE realizar el servicio`);

                // ✅ VERIFICACIÓN CORREGIDA: Usar trabajador.usuario_id para buscar en ausencia_trabajador
                console.log(`🔍 VERIFICANDO AUSENCIA para usuario_id: ${trabajador.usuario_id}, fecha: ${fecha}`);

                try {
                    // 🆕 LOG DETALLADO: Mostrar la consulta SQL que se ejecutará
                    console.log(`📝 CONSULTA SQL: SELECT * FROM ausencia_trabajador WHERE trabajador_id = ${trabajador.usuario_id} AND estado = 'aprobado' AND '${fecha}' BETWEEN fecha_inicio AND fecha_fin`);

                    const [ausencias] = await pool.execute(
                        `SELECT * FROM ausencia_trabajador 
                         WHERE trabajador_id = ? 
                         AND estado = 'aprobado'
                         AND ? BETWEEN fecha_inicio AND fecha_fin`,
                        [trabajador.usuario_id, fecha]
                    );

                    console.log(`📊 RESULTADO AUSENCIAS: ${ausencias.length} ausencias encontradas`);

                    // 🆕 LOG DETALLADO: Mostrar todas las ausencias encontradas
                    if (ausencias.length > 0) {
                        console.log(`📋 DETALLES DE AUSENCIAS ENCONTRADAS:`);
                        ausencias.forEach((ausencia, index) => {
                            console.log(`   ${index + 1}. ID: ${ausencia.id}, Tipo: ${ausencia.tipo}, Fecha Inicio: ${ausencia.fecha_inicio}, Fecha Fin: ${ausencia.fecha_fin}, Estado: ${ausencia.estado}`);
                        });
                    }

                    // 🆕 LOG ESPECIAL PARA ANA RODRÍGUEZ
                    if (trabajador.nombre === 'Ana' && trabajador.apellidos.includes('Rodriguez')) {
                        console.log(`🎯 🎯 🎯 AUSENCIAS DE ANA RODRÍGUEZ:`);
                        if (ausencias.length === 0) {
                            console.log(`🎯 NO SE ENCONTRARON AUSENCIAS PARA ANA RODRÍGUEZ EN LA FECHA ${fecha}`);
                        } else {
                            console.log(`🎯 ANA RODRÍGUEZ TIENE ${ausencias.length} AUSENCIAS EN ESTA FECHA:`);
                            ausencias.forEach(ausencia => {
                                console.log(`🎯   - ${ausencia.tipo}: ${ausencia.fecha_inicio} a ${ausencia.fecha_fin} (${ausencia.estado})`);
                            });
                        }
                    }

                    if (ausencias.length > 0) {
                        console.log(`🚫 AUSENCIA DETECTADA para ${trabajador.nombre}:`, {
                            id: ausencias[0].id,
                            tipo: ausencias[0].tipo,
                            fecha_inicio: ausencias[0].fecha_inicio,
                            fecha_fin: ausencias[0].fecha_fin,
                            estado: ausencias[0].estado
                        });
                        console.log(`❌ Trabajador ${trabajador.nombre} EXCLUIDO por ausencia aprobada`);
                        trabajadoresConAusencia++;
                        continue; // ✅ SALIR DEL BUCLE - trabajador NO disponible
                    }

                    console.log(`✅ Trabajador NO tiene ausencias aprobadas`);
                } catch (error) {
                    console.error(`❌ ERROR verificando ausencia para ${trabajador.nombre}:`, error);
                    continue;
                }

                // Obtener reservas del trabajador para esa fecha
                console.log(`🔍 Buscando reservas para trabajador_id: ${trabajador.id}, fecha: ${fecha}`);
                const reservas = await Reserva.buscarPorTrabajadorYFecha(trabajador.id, fecha);
                console.log(`📋 Reservas existentes: ${reservas.length}`);

                // Obtener horario laboral del trabajador para ese día
                const horarioLaboral = trabajador.horario_laboral;
                console.log(`⏰ Horario laboral COMPLETO:`, JSON.stringify(horarioLaboral, null, 2));

                const horarioDia = CalendarioUtils.obtenerHorarioParaDia(horarioLaboral, diaSemana);
                console.log(`📅 Horario para ${diaSemana}:`, horarioDia);

                // ✅ VALIDACIÓN ROBUSTA MEJORADA - DETECCIÓN DE DÍAS SIN TRABAJO
                if (!horarioDia) {
                    console.log(`❌ NO HAY HORARIO DEFINIDO para ${trabajador.nombre} el ${diaSemana} - NO TRABAJA ESTE DÍA`);
                    trabajadoresSinHorario++;
                    continue;
                }

                // ✅ VERIFICAR ESTRUCTURA COMPATIBLE (hora_inicio/hora_fin O inicio/fin)
                const horaInicio = horarioDia.hora_inicio || horarioDia.inicio;
                const horaFin = horarioDia.hora_fin || horarioDia.fin;

                // ✅ NUEVA VALIDACIÓN: Verificar si el horario está vacío o es nulo
                if (!horaInicio || !horaFin || horaInicio.trim() === '' || horaFin.trim() === '' || horaInicio === 'null' || horaFin === 'null') {
                    console.log(`❌ HORARIO VACÍO O INVÁLIDO para ${trabajador.nombre}:`, horarioDia);
                    console.log(`   hora_inicio: "${horaInicio}", hora_fin: "${horaFin}"`);
                    console.log(`   El trabajador NO TRABAJA este día`);
                    trabajadoresConHorarioInvalido++;
                    continue;
                }

                // ✅ VALIDAR FORMATO DE HORAS
                const horaInicioValida = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(horaInicio);
                const horaFinValida = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(horaFin);

                if (!horaInicioValida || !horaFinValida) {
                    console.log(`❌ FORMATO DE HORA INVÁLIDO para ${trabajador.nombre}:`);
                    console.log(`   hora_inicio: "${horaInicio}" → ${horaInicioValida ? '✅' : '❌'}`);
                    console.log(`   hora_fin: "${horaFin}" → ${horaFinValida ? '✅' : '❌'}`);
                    trabajadoresConHorarioInvalido++;
                    continue;
                }

                console.log(`✅ Horario válido: ${horaInicio} - ${horaFin}`);

                // Generar slots disponibles - ✅ AHORA ES COMPATIBLE
                const slotsDisponibles = CalendarioUtils.generarSlotsDisponibles(
                    horarioDia,
                    reservas,
                    servicio.duracion
                );

                console.log(`🕒 Slots disponibles generados: ${slotsDisponibles.length}`);

                // ✅ NUEVA VALIDACIÓN: Si no hay slots disponibles, marcar como no disponible
                const tieneDisponibilidad = slotsDisponibles.length > 0;

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
                    disponible: tieneDisponibilidad,
                    slots_disponibles: slotsDisponibles,
                    horario_laboral: {
                        hora_inicio: horaInicio,
                        hora_fin: horaFin
                    },
                    ausencia: false,
                    reservas_existentes: reservas.map(r => ({
                        hora_inicio: r.hora_inicio,
                        duracion: r.duracion,
                        servicio: r.servicio_nombre
                    })),
                    // ✅ NUEVO: Información de diagnóstico
                    diagnostico: {
                        tiene_horario: true,
                        horario_valido: true,
                        slots_generados: slotsDisponibles.length,
                        razon_no_disponible: tieneDisponibilidad ? null : 'No hay slots disponibles en el horario'
                    }
                });
            }

            // 🆕 RESUMEN DETALLADO
            console.log(`\n📊 ==========================================`);
            console.log(`📊 RESUMEN DE PROCESAMIENTO`);
            console.log(`📊 ==========================================`);
            console.log(`📊 Total trabajadores procesados: ${trabajadores.length}`);
            console.log(`📊 Trabajadores sin capacidad: ${trabajadoresSinCapacidad}`);
            console.log(`📊 Trabajadores con ausencia: ${trabajadoresConAusencia}`);
            console.log(`📊 Trabajadores sin horario (no trabajan): ${trabajadoresSinHorario}`);
            console.log(`📊 Trabajadores con horario inválido: ${trabajadoresConHorarioInvalido}`);
            console.log(`📊 Trabajadores disponibles: ${disponibilidad.filter(d => d.disponible).length}`);
            console.log(`📊 Trabajadores con horario pero sin slots: ${disponibilidad.filter(d => !d.disponible).length}`);
            console.log(`📊 Fecha consultada: ${fecha}`);
            console.log(`📊 Día de la semana: ${diaSemana}`);
            console.log(`📊 ==========================================`);

            // Si no hay trabajadores disponibles
            if (disponibilidad.length === 0 || disponibilidad.filter(d => d.disponible).length === 0) {
                console.log(`\n❌ RESULTADO FINAL: Ningún trabajador disponible`);
                console.log(`Razón posible:
                - Ningún trabajador puede realizar el servicio: ${trabajadoresSinCapacidad}
                - Todos tienen ausencias: ${trabajadoresConAusencia}
                - No trabajan el día ${diaSemana}: ${trabajadoresSinHorario}
                - Tienen horario inválido: ${trabajadoresConHorarioInvalido}
                - No tienen slots disponibles en sus horarios`);

                return res.status(404).json({
                    error: `No hay trabajadores disponibles para servicio de ${servicio.categoria} en la fecha seleccionada`,
                    sugerencia: 'Intente con otra fecha o contacte con el establecimiento',
                    detalles: {
                        total_trabajadores: trabajadores.length,
                        sin_capacidad: trabajadoresSinCapacidad,
                        con_ausencia: trabajadoresConAusencia,
                        sin_horario: trabajadoresSinHorario,
                        horario_invalido: trabajadoresConHorarioInvalido,
                        fecha: fecha,
                        dia_semana: diaSemana
                    }
                });
            }

            console.log(`\n✅ RESULTADO FINAL: ${disponibilidad.filter(d => d.disponible).length} trabajadores disponibles`);
            console.log(`📊 Trabajadores disponibles:`, disponibilidad.filter(d => d.disponible).map(d => d.trabajador.nombre));

            res.json({
                fecha,
                servicio: {
                    id: servicio.id,
                    nombre: servicio.nombre,
                    categoria: servicio.categoria,
                    duracion: servicio.duracion
                },
                disponibilidad,
                resumen: {
                    total_trabajadores: trabajadores.length,
                    trabajadores_disponibles: disponibilidad.filter(d => d.disponible).length,
                    trabajadores_con_horario_sin_slots: disponibilidad.filter(d => !d.disponible).length,
                    trabajadores_con_ausencia: trabajadoresConAusencia,
                    trabajadores_sin_capacidad: trabajadoresSinCapacidad,
                    trabajadores_sin_horario: trabajadoresSinHorario,
                    trabajadores_horario_invalido: trabajadoresConHorarioInvalido,
                    slots_totales: disponibilidad.reduce((total, d) => total + d.slots_disponibles.length, 0)
                }
            });

        } catch (error) {
            console.error('❌ ERROR CRÍTICO en calendarioController.obtenerDisponibilidad:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                detalle: error.message
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
            const trabajadorId = await obtenerTrabajadorId(req);

            if (!trabajadorId) {
                return res.status(403).json({
                    error: 'No tienes permisos para acceder a esta funcionalidad'
                });
            }

            const { mes, año } = req.query;

            // Obtener ausencias del trabajador
            const ausencias = await AusenciaTrabajador.obtenerPorTrabajador(req.usuario.id);

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

    solicitarAusencia: async (req, res) => {
        try {
            // ✅ CORRECCIÓN: Usar req.usuario.id directamente
            const usuarioId = req.usuario.id;

            console.log(`🔍 [SOLICITAR_AUSENCIA] usuarioId obtenido: ${usuarioId}, tipo: ${typeof usuarioId}`);

            if (!usuarioId) {
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

            // ✅ Añadir log para verificar los datos antes de crear
            console.log(`📝 [SOLICITAR_AUSENCIA] Creando ausencia con datos:`, {
                trabajador_id: usuarioId,
                tipo,
                fecha_inicio,
                fecha_fin,
                motivo
            });

            const ausenciaId = await AusenciaTrabajador.crear({
                trabajador_id: usuarioId, // ✅ CORRECCIÓN: usar usuarioId (usuario.id)
                tipo,
                fecha_inicio,
                fecha_fin,
                motivo
            });

            console.log(`✅ [SOLICITAR_AUSENCIA] Ausencia creada con ID: ${ausenciaId}`);

            res.status(201).json({
                mensaje: 'Solicitud de ausencia creada exitosamente',
                ausencia_id: ausenciaId
            });

        } catch (error) {
            console.error('❌ Error en calendarioController.solicitarAusencia:', error);
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

            // CORRECCIÓN: Cambiar "aprobada" → "aprobado", "rechazada" → "rechazado"
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
            // ✅ CORRECCIÓN: Usar req.usuario.id directamente
            const usuarioId = req.usuario.id;

            console.log(`🔍 [OBTENER_MIS_AUSENCIAS] usuarioId obtenido: ${usuarioId}, tipo: ${typeof usuarioId}`);

            if (!usuarioId) {
                return res.status(403).json({
                    error: 'No tienes permisos para acceder a esta funcionalidad'
                });
            }

            console.log(`🔍 [OBTENER_MIS_AUSENCIAS] Buscando ausencias para usuarioId: ${usuarioId}`);

            const ausencias = await AusenciaTrabajador.obtenerPorTrabajador(usuarioId);

            console.log(`✅ [OBTENER_MIS_AUSENCIAS] Ausencias encontradas: ${ausencias ? ausencias.length : 0}`);

            res.json({
                ausencias: ausencias || []
            });

        } catch (error) {
            console.error('❌ Error en calendarioController.obtenerMisAusencias:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    }
};

module.exports = calendarioController;