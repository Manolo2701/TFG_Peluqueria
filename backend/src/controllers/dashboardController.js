const { pool } = require('../config/database');
const Trabajador = require('../models/Trabajador');

exports.getEstadisticas = async (req, res) => {
  try {
    const usuario = req.usuario;

    console.log('[DASHBOARD] Usuario:', usuario.id, 'Rol:', usuario.rol);

    let estadisticas = {
      tipo: usuario.rol === 'cliente' ? 'cliente' : 'negocio',
      rol: usuario.rol
    };

    // Consultas directas a la base de datos
    if (usuario.rol === 'administrador' || usuario.rol === 'trabajador') {
      // Para admin/trabajador
      const [reservasHoy] = await pool.execute(
        "SELECT COUNT(*) as total FROM reserva WHERE fecha_reserva = CURDATE()"
      );

      const [reservasConfirmadas] = await pool.execute(
        "SELECT COUNT(*) as total FROM reserva WHERE fecha_reserva = CURDATE() AND estado = 'confirmada'"
      );

      const [reservasPendientes] = await pool.execute(
        "SELECT COUNT(*) as total FROM reserva WHERE fecha_reserva = CURDATE() AND estado = 'pendiente'"
      );

      const [ventasHoy] = await pool.execute(
        "SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as ingresos FROM venta WHERE DATE(fecha_venta) = CURDATE() AND estado = 'completada'"
      );

      // Servicios populares (top 5)
      const [serviciosPopulares] = await pool.execute(`
        SELECT s.nombre, COUNT(r.id) as total_reservas
        FROM servicio s 
        LEFT JOIN reserva r ON s.id = r.servicio_id 
        WHERE s.activo = true
        GROUP BY s.id, s.nombre 
        ORDER BY total_reservas DESC 
        LIMIT 5
      `);

      estadisticas.totalReservasHoy = reservasHoy[0].total;
      estadisticas.reservasConfirmadas = reservasConfirmadas[0].total;
      estadisticas.reservasPendientes = reservasPendientes[0].total;
      estadisticas.totalVentasHoy = ventasHoy[0].total;
      estadisticas.ingresosHoy = parseFloat(ventasHoy[0].ingresos);
      estadisticas.serviciosPopulares = serviciosPopulares;

    } else {
      // Para cliente
      const [misReservasTotal] = await pool.execute(
        "SELECT COUNT(*) as total FROM reserva WHERE cliente_id = ?",
        [usuario.id]
      );

      const [misReservasHoy] = await pool.execute(
        "SELECT COUNT(*) as total FROM reserva WHERE cliente_id = ? AND fecha_reserva = CURDATE()",
        [usuario.id]
      );

      const [misReservasConfirmadas] = await pool.execute(
        "SELECT COUNT(*) as total FROM reserva WHERE cliente_id = ? AND estado = 'confirmada'",
        [usuario.id]
      );

      const [misReservasPendientes] = await pool.execute(
        "SELECT COUNT(*) as total FROM reserva WHERE cliente_id = ? AND estado = 'pendiente'",
        [usuario.id]
      );

      // Próximas reservas (máximo 5)
      const [proximasReservas] = await pool.execute(`
        SELECT r.*, s.nombre as servicio_nombre, s.precio as servicio_precio
        FROM reserva r
        LEFT JOIN servicio s ON r.servicio_id = s.id
        WHERE r.cliente_id = ? AND r.fecha_reserva >= CURDATE()
        ORDER BY r.fecha_reserva ASC, r.hora_inicio ASC
        LIMIT 5
      `, [usuario.id]);

      estadisticas.misReservasHoy = misReservasHoy[0].total;
      estadisticas.totalReservas = misReservasTotal[0].total;
      estadisticas.reservasConfirmadas = misReservasConfirmadas[0].total;
      estadisticas.reservasPendientes = misReservasPendientes[0].total;
      estadisticas.proximasReservas = proximasReservas;
    }

    console.log('[DASHBOARD] Estadísticas generadas correctamente');
    console.log('   Ingresos hoy:', estadisticas.ingresosHoy);
    console.log('   Ventas hoy:', estadisticas.totalVentasHoy);

    res.json({
      success: true,
      data: estadisticas
    });

  } catch (error) {
    console.error('[DASHBOARD] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error en el dashboard',
      error: error.message
    });
  }
};

// Estadísticas específicas para trabajador
exports.getEstadisticasTrabajador = async (req, res) => {
  try {
    const usuario = req.usuario;

    const trabajador = await Trabajador.buscarPorUsuarioId(usuario.id);

    if (!trabajador) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró perfil de trabajador para este usuario'
      });
    }

    const trabajadorId = trabajador.id;

    let estadisticas = {
      tipo: 'trabajador',
      rol: 'trabajador'
    };

    // Estadísticas de reservas
    const [misReservasHoy] = await pool.execute(
      `SELECT COUNT(*) as total FROM reserva 
       WHERE trabajador_id = ? AND fecha_reserva = CURDATE()`,
      [trabajadorId]
    );

    const [misReservasConfirmadas] = await pool.execute(
      `SELECT COUNT(*) as total FROM reserva 
       WHERE trabajador_id = ? AND fecha_reserva = CURDATE() AND estado = 'confirmada'`,
      [trabajadorId]
    );

    const [misReservasPendientes] = await pool.execute(
      `SELECT COUNT(*) as total FROM reserva 
       WHERE trabajador_id = ? AND fecha_reserva = CURDATE() AND estado = 'pendiente'`,
      [trabajadorId]
    );

    // Servicios más solicitados
    const [misServiciosPopulares] = await pool.execute(`
      SELECT s.nombre, COUNT(r.id) as total_reservas
      FROM servicio s 
      JOIN reserva r ON s.id = r.servicio_id 
      WHERE r.trabajador_id = ? 
      GROUP BY s.id, s.nombre 
      ORDER BY total_reservas DESC 
      LIMIT 5
    `, [trabajadorId]);

    // Próximas reservas
    const [misProximasReservas] = await pool.execute(`
      SELECT r.*, s.nombre as servicio_nombre, s.precio as servicio_precio,
             u.nombre as cliente_nombre, u.apellidos as cliente_apellidos
      FROM reserva r
      LEFT JOIN servicio s ON r.servicio_id = s.id
      LEFT JOIN usuario u ON r.cliente_id = u.id
      WHERE r.trabajador_id = ? AND r.fecha_reserva >= CURDATE()
      ORDER BY r.fecha_reserva ASC, r.hora_inicio ASC
      LIMIT 5
    `, [trabajadorId]);

    // Asignar solo los datos necesarios
    estadisticas.totalReservasHoy = misReservasHoy[0]?.total || 0;
    estadisticas.reservasConfirmadas = misReservasConfirmadas[0]?.total || 0;
    estadisticas.reservasPendientes = misReservasPendientes[0]?.total || 0;
    estadisticas.serviciosPopulares = misServiciosPopulares || [];
    estadisticas.proximasReservas = misProximasReservas || [];

    res.json({
      success: true,
      data: estadisticas
    });

  } catch (error) {
    console.error('[DASHBOARD-TRABAJADOR] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error en el dashboard de trabajador',
      error: error.message
    });
  }
};

exports.getEstadisticasAvanzadas = async (req, res) => {
  try {
    const usuario = req.usuario;

    if (usuario.rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a estas estadísticas'
      });
    }

    res.json({
      success: true,
      data: {
        mensaje: 'Estadísticas avanzadas - funcionalidad en desarrollo',
        periodo: 'Próximamente'
      }
    });

  } catch (error) {
    console.error('[DASHBOARD] Error en estadísticas avanzadas:', error);
    res.status(500).json({
      success: false,
      message: 'Error en estadísticas avanzadas',
      error: error.message
    });
  }
};