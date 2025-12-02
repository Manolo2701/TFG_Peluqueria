const Reserva = require('../models/Reserva');
const Servicio = require('../models/Servicio');
const Trabajador = require('../models/Trabajador');
const CalendarioUtils = require('../utils/calendarioUtils');

// Crear nueva reserva - SISTEMA HÍBRIDO MEJORADO
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

    console.log('📋 Servicio encontrado:', {
      nombre: servicio.nombre,
      duracion: servicio.duracion, // ✅ Verificar este valor
      categoria: servicio.categoria
    });

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

    console.log('🎯 [DEBUG] Parámetros para verificarDisponibilidad:');
    console.log('   - trabajador_id:', trabajador_id);
    console.log('   - fecha_reserva:', fecha_reserva);
    console.log('   - hora_inicio:', hora_inicio);
    console.log('   - duracion:', servicio.duracion);

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

    // 4.5 ✅ NUEVA VERIFICACIÓN: EVITAR DOBLE RESERVA DEL MISMO CLIENTE
    console.log('🔍 [ANTI-DOBLE-RESERVA] Verificando que el cliente no tenga reservas solapadas...');

    const disponibilidadCliente = await Reserva.verificarDisponibilidadCliente(
      cliente_id,
      fecha_reserva,
      hora_inicio,
      servicio.duracion
    );

    if (!disponibilidadCliente.disponible) {
      console.log('❌ CLIENTE YA TIENE RESERVA EN ESE HORARIO:', disponibilidadCliente.conflictos);

      const serviciosConflictivos = disponibilidadCliente.conflictos.map(c =>
        c.servicio_nombre || 'servicio'
      ).join(', ');

      return res.status(400).json({
        error: 'Ya tienes una reserva en ese horario',
        detalles: {
          conflictos: disponibilidadCliente.conflictos.length,
          servicios: serviciosConflictivos,
          mensaje: `No puedes reservar porque ya tienes ${disponibilidadCliente.conflictos.length} reserva(s) en ese horario: ${serviciosConflictivos}`
        }
      });
    }

    console.log('✅ Cliente NO tiene reservas solapadas');

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

    // ✅ NUEVA VERIFICACIÓN: EVITAR DOBLE RESERVA DEL MISMO CLIENTE
    console.log('🔍 [ANTI-DOBLE-RESERVA] Verificando que el cliente no tenga reservas solapadas...');

    const disponibilidadCliente = await Reserva.verificarDisponibilidadCliente(
      req.usuario.id, // cliente_id del usuario autenticado
      fecha,
      hora,
      servicio.duracion
    );

    // BUSCA ESTA SECCIÓN (alrededor de la línea 284):
    if (!disponibilidadCliente.disponible) {
      console.log('❌ CLIENTE YA TIENE RESERVA EN ESE HORARIO:', disponibilidadCliente.conflictos);

      const serviciosConflictivos = disponibilidadCliente.conflictos.map(c =>
        c.servicio_nombre || 'servicio'
      ).join(', ');

      // ✅ CAMBIA ESTO: de 400 a 409
      return res.status(409).json({
        error: 'Ya tienes una reserva en ese horario',
        detalles: {
          conflictos: disponibilidadCliente.conflictos.length,
          servicios: serviciosConflictivos,
          mensaje: `No puedes reservar porque ya tienes ${disponibilidadCliente.conflictos.length} reserva(s) en ese horario: ${serviciosConflictivos}`
        },
        servicio: {
          id: servicio.id,
          nombre: servicio.nombre,
          categoria: servicio.categoria,
          duracion: servicio.duracion,
          precio: servicio.precio
        },
        fecha,
        hora,
        trabajadores: [],
        total: 0,
        // ✅ AÑADE este campo para identificar el tipo de situación
        codigo: 'CONFLICTO_HORARIO_CLIENTE'
      });
    }

    console.log('✅ Cliente NO tiene reservas solapadas - procediendo a buscar trabajadores...');

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

    // ✅ NUEVO: Obtener día de la semana para verificación de horario
    const diaSemana = CalendarioUtils.obtenerDiaSemana(fecha);
    console.log(`📅 Día de la semana para ${fecha}: ${diaSemana}`);

    // 4. Verificar disponibilidad (reservas + ausencias + horario laboral)
    const trabajadoresDisponibles = [];

    for (const trabajador of trabajadoresCapaces) {
      console.log(`\n--- 🔄 PROCESANDO TRABAJADOR: ${trabajador.nombre} ${trabajador.apellidos} ---`);

      // ✅ VERIFICACIÓN CRÍTICA: Comprobar ausencias primero
      console.log(`🔍 VERIFICANDO AUSENCIA para usuario_id: ${trabajador.usuario_id}, fecha: ${fecha}`);

      try {
        const { pool } = require('../config/database');
        const [ausencias] = await pool.execute(
          `SELECT * FROM ausencia_trabajador 
           WHERE trabajador_id = ? 
           AND estado = 'aprobado'
           AND ? BETWEEN fecha_inicio AND fecha_fin`,
          [trabajador.usuario_id, fecha]
        );

        console.log(`📊 AUSENCIAS ENCONTRADAS: ${ausencias.length}`);

        if (ausencias.length > 0) {
          console.log(`🚫 AUSENCIA DETECTADA:`, {
            id: ausencias[0].id,
            tipo: ausencias[0].tipo,
            fecha_inicio: ausencias[0].fecha_inicio,
            fecha_fin: ausencias[0].fecha_fin,
            estado: ausencias[0].estado
          });
          console.log(`❌ Trabajador ${trabajador.nombre} EXCLUIDO por ausencia aprobada`);
          continue; // Saltar este trabajador - NO disponible por ausencia
        }

        console.log(`✅ Trabajador NO tiene ausencias aprobadas`);
      } catch (error) {
        console.error(`❌ ERROR verificando ausencia para ${trabajador.nombre}:`, error);
        continue;
      }

      // ✅ NUEVA VERIFICACIÓN: HORARIO LABORAL DEL TRABAJADOR
      console.log(`⏰ Verificando horario laboral para ${trabajador.nombre} el ${diaSemana}...`);

      const horarioLaboral = trabajador.horario_laboral;
      console.log(`📋 Horario laboral completo:`, horarioLaboral);

      const horarioDia = CalendarioUtils.obtenerHorarioParaDia(horarioLaboral, diaSemana);
      console.log(`📅 Horario para ${diaSemana}:`, horarioDia);

      // ✅ VALIDACIÓN ROBUSTA DEL HORARIO
      if (!horarioDia) {
        console.log(`❌ NO HAY HORARIO DEFINIDO para ${trabajador.nombre} el ${diaSemana} - NO TRABAJA ESTE DÍA`);
        continue;
      }

      // ✅ VERIFICAR ESTRUCTURA COMPATIBLE
      const horaInicio = horarioDia.hora_inicio || horarioDia.inicio;
      const horaFin = horarioDia.hora_fin || horarioDia.fin;

      // ✅ VALIDAR SI EL HORARIO ESTÁ VACÍO O ES INVÁLIDO
      if (!horaInicio || !horaFin || horaInicio.trim() === '' || horaFin.trim() === '' || horaInicio === 'null' || horaFin === 'null') {
        console.log(`❌ HORARIO VACÍO O INVÁLIDO para ${trabajador.nombre}:`, horarioDia);
        console.log(`   hora_inicio: "${horaInicio}", hora_fin: "${horaFin}"`);
        console.log(`   El trabajador NO TRABAJA este día`);
        continue;
      }

      // ✅ VALIDAR FORMATO DE HORAS
      const horaInicioValida = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(horaInicio);
      const horaFinValida = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(horaFin);

      if (!horaInicioValida || !horaFinValida) {
        console.log(`❌ FORMATO DE HORA INVÁLIDO para ${trabajador.nombre}:`);
        console.log(`   hora_inicio: "${horaInicio}" → ${horaInicioValida ? '✅' : '❌'}`);
        console.log(`   hora_fin: "${horaFin}" → ${horaFinValida ? '✅' : '❌'}`);
        continue;
      }

      console.log(`✅ Horario válido: ${horaInicio} - ${horaFin}`);

      // ✅ VERIFICAR SI LA HORA DE RESERVA ESTÁ DENTRO DEL HORARIO LABORAL
      const [horaReserva, minutoReserva] = hora.split(':').map(Number);
      const [horaInicioNum, minutoInicioNum] = horaInicio.split(':').map(Number);
      const [horaFinNum, minutoFinNum] = horaFin.split(':').map(Number);

      const minutosReserva = horaReserva * 60 + minutoReserva;
      const minutosInicio = horaInicioNum * 60 + minutoInicioNum;
      const minutosFin = horaFinNum * 60 + minutoFinNum;

      const duracionMinutos = servicio.duracion;
      const minutosFinReserva = minutosReserva + duracionMinutos;

      console.log(`⏰ Verificando horario: ${hora} (${minutosReserva}min) + ${duracionMinutos}min = ${minutosFinReserva}min`);
      console.log(`   Horario trabajador: ${minutosInicio}min - ${minutosFin}min`);

      // Verificar que la reserva empiece y termine dentro del horario laboral
      if (minutosReserva < minutosInicio || minutosFinReserva > minutosFin) {
        console.log(`❌ La reserva NO está dentro del horario laboral de ${trabajador.nombre}`);
        console.log(`   Reserva: ${hora} - ${this.minutosAHora(minutosFinReserva)}`);
        console.log(`   Horario: ${horaInicio} - ${horaFin}`);
        continue;
      }

      console.log(`✅ La reserva SÍ está dentro del horario laboral`);

      // ✅ Verificar disponibilidad de horario (reservas existentes) - SOLO si pasa todas las validaciones anteriores
      const disponible = await Reserva.verificarDisponibilidad(
        trabajador.id,
        fecha,
        hora,
        servicio.duracion
      );

      console.log(`   ${trabajador.nombre} disponible por reservas: ${disponible}`);

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
          disponible: true,
          // ✅ NUEVO: Incluir información del horario para debug
          horario_laboral: {
            dia: diaSemana,
            hora_inicio: horaInicio,
            hora_fin: horaFin
          }
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

// Método auxiliar para convertir minutos a hora (añadir si no existe en CalendarioUtils)
// Si no existe en CalendarioUtils, podemos agregarlo aquí temporalmente
exports.minutosAHora = function (minutos) {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};