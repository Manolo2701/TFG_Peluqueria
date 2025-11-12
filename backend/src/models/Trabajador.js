const { pool } = require('../config/database');

class Trabajador {
  static async obtenerPerfil(usuarioId) {
    try {
      const [rows] = await pool.execute(`
            SELECT u.id, u.nombre, u.apellidos, u.email, u.telefono,
                   t.id as trabajador_id, t.especialidades, t.categoria, t.descripcion, t.experiencia, t.horario_laboral
            FROM usuario u
            LEFT JOIN trabajador t ON u.id = t.usuario_id
            WHERE u.id = ? AND (u.rol = 'trabajador' OR u.rol = 'administrador') AND u.activo = true
        `, [usuarioId]);
      return rows[0];
    } catch (error) {
      console.error('Error obteniendo perfil de trabajador:', error);
      throw error;
    }
  }

  static async listarTodos() {
    try {
      const [rows] = await pool.execute(`
        SELECT t.id, u.id as usuario_id, u.nombre, u.apellidos, u.email, u.telefono,
               t.especialidades, t.categoria, t.descripcion, t.experiencia, t.horario_laboral
        FROM usuario u
        LEFT JOIN trabajador t ON u.id = t.usuario_id
        WHERE (u.rol = 'trabajador' OR u.rol = 'administrador') AND u.activo = true
        ORDER BY u.nombre, u.apellidos
      `);
      return rows;
    } catch (error) {
      console.error('Error listando trabajadores:', error);
      throw error;
    }
  }

  static async buscarPorEspecialidad(especialidad) {
    try {
      const [rows] = await pool.execute(`
        SELECT u.id, u.nombre, u.apellidos, u.email, u.telefono,
               t.especialidades, t.categoria, t.descripcion, t.experiencia, t.horario_laboral
        FROM usuario u
        LEFT JOIN trabajador t ON u.id = t.usuario_id
        WHERE u.rol = 'trabajador' AND u.activo = true
        AND (JSON_SEARCH(t.especialidades, 'one', ?) IS NOT NULL 
             OR t.especialidades LIKE ?)
        ORDER BY u.nombre, u.apellidos
      `, [`%${especialidad}%`, `%${especialidad}%`]);
      return rows;
    } catch (error) {
      console.error('Error buscando trabajadores por especialidad:', error);
      throw error;
    }
  }

  static async actualizarPerfil(usuarioId, datosTrabajador) {
    try {
      const { especialidades, categoria, descripcion, experiencia, horario_laboral } = datosTrabajador;

      const [existing] = await pool.execute(
        'SELECT * FROM trabajador WHERE usuario_id = ?',
        [usuarioId]
      );

      if (existing.length > 0) {
        const [result] = await pool.execute(
          `UPDATE trabajador 
           SET especialidades = ?, categoria = ?, descripcion = ?, experiencia = ?, horario_laboral = ?
           WHERE usuario_id = ?`,
          [especialidades, categoria, descripcion, experiencia, horario_laboral, usuarioId]
        );
        return result.affectedRows > 0;
      } else {
        const [result] = await pool.execute(
          `INSERT INTO trabajador (usuario_id, especialidades, categoria, descripcion, experiencia, horario_laboral)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [usuarioId, especialidades, categoria, descripcion, experiencia, horario_laboral]
        );
        return result.insertId;
      }
    } catch (error) {
      console.error('Error actualizando perfil de trabajador:', error);
      throw error;
    }
  }

  static async obtenerHorario(usuarioId) {
    try {
      const [rows] = await pool.execute(
        'SELECT horario_laboral FROM trabajador WHERE usuario_id = ?',
        [usuarioId]
      );
      return rows[0] ? rows[0].horario_laboral : null;
    } catch (error) {
      console.error('Error obteniendo horario de trabajador:', error);
      throw error;
    }
  }

  static async buscarPorUsuarioId(usuarioId) {
    try {
      console.log(`🔍 [TRABAJADOR] Buscando trabajador por usuario_id: ${usuarioId}`);
      const [rows] = await pool.execute(
        'SELECT t.*, u.nombre, u.apellidos FROM trabajador t JOIN usuario u ON t.usuario_id = u.id WHERE t.usuario_id = ?',
        [usuarioId]
      );
      console.log(`📊 [TRABAJADOR] Resultado de búsqueda: ${rows.length} trabajadores encontrados`);
      if (rows.length > 0) {
        console.log(`✅ [TRABAJADOR] Trabajador encontrado: ${rows[0].nombre} (ID: ${rows[0].id})`);
      }
      return rows[0];
    } catch (error) {
      console.error('Error buscando trabajador por usuario_id:', error);
      throw error;
    }
  }

  // ✅ NUEVO MÉTODO: Buscar por ID de trabajador (no de usuario)
  static async buscarPorId(trabajadorId) {
    try {
      const [rows] = await pool.execute(`
      SELECT t.*, u.nombre, u.apellidos, u.email, u.telefono
      FROM trabajador t
      JOIN usuario u ON t.usuario_id = u.id
      WHERE t.id = ? AND u.activo = true
    `, [trabajadorId]);
      return rows[0];
    } catch (error) {
      console.error('Error buscando trabajador por ID:', error);
      throw error;
    }
  }
}

module.exports = Trabajador;