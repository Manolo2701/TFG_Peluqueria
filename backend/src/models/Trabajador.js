const { pool } = require('../config/database');

class Trabajador {
  static async obtenerPerfil(trabajadorId) {
    try {
      console.log(`🔍 [TRABAJADOR] Obteniendo perfil para trabajadorId: ${trabajadorId}`);

      const [rows] = await pool.execute(`
      SELECT u.id as usuario_id, u.nombre, u.apellidos, u.email, u.telefono, u.rol,
             t.id as trabajador_id, t.especialidades, t.categoria, t.descripcion, t.experiencia, t.horario_laboral
      FROM usuario u
      JOIN trabajador t ON u.id = t.usuario_id
      WHERE t.id = ? AND u.activo = true
    `, [trabajadorId]);

      console.log(`📊 [TRABAJADOR] Resultado:`, rows[0]);
      return rows[0];
    } catch (error) {
      console.error('Error obteniendo perfil de trabajador:', error);
      throw error;
    }
  }

  static async obtenerPorUsuarioId(usuarioId) {
    try {
      console.log(`🔍 [TRABAJADOR] Obteniendo trabajador por usuario_id: ${usuarioId}`);

      const [rows] = await pool.execute(`
      SELECT u.id as usuario_id, u.nombre, u.apellidos, u.email, u.telefono, u.rol,
             t.id as trabajador_id, t.especialidades, t.categoria, t.descripcion, t.experiencia, t.horario_laboral
      FROM usuario u
      JOIN trabajador t ON u.id = t.usuario_id
      WHERE u.id = ? AND u.activo = true
    `, [usuarioId]);

      console.log(`📊 [TRABAJADOR] Resultado:`, rows[0]);
      return rows[0];
    } catch (error) {
      console.error('Error obteniendo trabajador por usuario_id:', error);
      throw error;
    }
  }

  static async listarTodos() {
    try {
      console.log(`🔍 [TRABAJADOR] Listando todos los trabajadores activos`);

      const [rows] = await pool.execute(`
      SELECT 
          t.id, 
          u.id as usuario_id,
          u.nombre, u.apellidos, u.email, u.telefono, u.rol,
          t.especialidades, t.categoria, t.descripcion, t.experiencia, t.horario_laboral
      FROM usuario u
      LEFT JOIN trabajador t ON u.id = t.usuario_id
      WHERE (u.rol = 'trabajador' OR u.rol = 'administrador') 
        AND u.activo = true
        AND t.id IS NOT NULL
      ORDER BY u.nombre, u.apellidos
    `);

      console.log(`👥 [TRABAJADOR] Trabajadores con perfil: ${rows.length}`);
      return rows;
    } catch (error) {
      console.error('Error listando trabajadores:', error);
      throw error;
    }
  }

  static async buscarPorEspecialidad(especialidad) {
    try {
      const [rows] = await pool.execute(`
      SELECT u.id as usuario_id, u.nombre, u.apellidos, u.email, u.telefono, u.rol,
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
      console.log(`✏️ [MODELO TRABAJADOR] Actualizando perfil para usuario_id: ${usuarioId}`, datosTrabajador);

      const { especialidades, categoria, descripcion, experiencia, horario_laboral } = datosTrabajador;

      const [existing] = await pool.execute(
        'SELECT * FROM trabajador WHERE usuario_id = ?',
        [usuarioId]
      );

      let horarioLaboralValue = horario_laboral;
      if (horario_laboral === '' || horario_laboral === null || horario_laboral === undefined) {
        horarioLaboralValue = null;
        console.log('🔄 [MODELO TRABAJADOR] Horario laboral vacío, estableciendo a NULL');
      }

      if (existing.length > 0) {
        console.log('📝 [MODELO TRABAJADOR] Actualizando trabajador existente');
        const [result] = await pool.execute(
          `UPDATE trabajador 
         SET especialidades = COALESCE(?, especialidades), 
             categoria = COALESCE(?, categoria), 
             descripcion = COALESCE(?, descripcion), 
             experiencia = COALESCE(?, experiencia), 
             horario_laboral = ?
         WHERE usuario_id = ?`,
          [especialidades, categoria, descripcion, experiencia, horarioLaboralValue, usuarioId]
        );
        console.log(`✅ [MODELO TRABAJADOR] Trabajador actualizado: ${result.affectedRows} filas afectadas`);
        return result.affectedRows > 0;
      } else {
        console.log('📝 [MODELO TRABAJADOR] Creando nuevo perfil de trabajador');
        const [result] = await pool.execute(
          `INSERT INTO trabajador (usuario_id, especialidades, categoria, descripcion, experiencia, horario_laboral)
         VALUES (?, ?, ?, ?, ?, ?)`,
          [usuarioId, especialidades, categoria, descripcion, experiencia, horarioLaboralValue]
        );
        console.log(`✅ [MODELO TRABAJADOR] Trabajador creado: ID ${result.insertId}`);
        return result.insertId;
      }
    } catch (error) {
      console.error('❌ Error actualizando perfil de trabajador:', error);
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
        'SELECT t.*, u.nombre, u.apellidos, u.rol FROM trabajador t JOIN usuario u ON t.usuario_id = u.id WHERE t.usuario_id = ?',
        [usuarioId]
      );
      console.log(`📊 [TRABAJADOR] Resultado de búsqueda: ${rows.length} trabajadores encontrados`);
      if (rows.length > 0) {
        console.log(`✅ [TRABAJADOR] Trabajador encontrado: ${rows[0].nombre} (ID: ${rows[0].id}, Rol: ${rows[0].rol})`);
      }
      return rows[0];
    } catch (error) {
      console.error('Error buscando trabajador por usuario_id:', error);
      throw error;
    }
  }

  static async buscarPorId(trabajadorId) {
    try {
      console.log(`🔍 [MODELO TRABAJADOR] Buscando trabajador por ID: ${trabajadorId}`);

      const [rows] = await pool.execute(`
      SELECT 
        t.*, 
        u.id as usuario_id,
        u.nombre, 
        u.apellidos, 
        u.email, 
        u.telefono,
        u.direccion,
        u.rol,
        u.activo
      FROM trabajador t
      JOIN usuario u ON t.usuario_id = u.id
      WHERE t.id = ?
    `, [trabajadorId]);

      console.log(`📊 [MODELO TRABAJADOR] Resultado para ID ${trabajadorId}:`, rows[0] ? 'Encontrado' : 'No encontrado');

      if (rows[0]) {
        console.log(`📊 [MODELO TRABAJADOR] Rol del trabajador: ${rows[0].rol}`);
      }

      return rows[0];
    } catch (error) {
      console.error('❌ Error buscando trabajador por ID:', error);
      throw error;
    }
  }
}

module.exports = Trabajador;