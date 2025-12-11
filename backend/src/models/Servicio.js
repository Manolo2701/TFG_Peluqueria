const { pool } = require('../config/database');

class Servicio {
  // Crear nuevo servicio
  static async crear(servicioData) {
    try {
      const { nombre, descripcion, duracion, precio, categoria, activo = true } = servicioData;

      console.log('📝 Creando servicio con datos:', servicioData);

      const [result] = await pool.execute(
        `INSERT INTO servicio (nombre, descripcion, duracion, precio, categoria, activo)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [nombre, descripcion, duracion, precio, categoria, activo]
      );

      console.log('✅ Servicio insertado con ID:', result.insertId);
      return result.insertId;
    } catch (error) {
      console.error('❌ Error en Servicio.crear:', error.message);
      throw error;
    }
  }

  // Obtener servicios con opción de incluir inactivos
  static async listarTodos(incluirInactivos = false) {
    try {
      let query = 'SELECT * FROM servicio';

      if (!incluirInactivos) {
        query += ' WHERE activo = true';
      }

      query += ' ORDER BY categoria, nombre';

      const [rows] = await pool.execute(query);

      console.log(`✅ Servicios encontrados: ${rows.length} (incluirInactivos: ${incluirInactivos})`);
      return rows;
    } catch (error) {
      console.error('Error listando servicios:', error);
      throw error;
    }
  }

  // Obtener servicio por ID (para administración - incluye inactivos)
  static async buscarPorId(id, incluirInactivos = false) {
    try {
      let query = 'SELECT * FROM servicio WHERE id = ?';

      if (!incluirInactivos) {
        query += ' AND activo = true';
      }

      const [rows] = await pool.execute(query, [id]);
      return rows[0];
    } catch (error) {
      console.error('Error buscando servicio por ID:', error);
      throw error;
    }
  }

  // Obtener servicios por categoría con opción de incluir inactivos
  static async buscarPorCategoria(categoria, incluirInactivos = false) {
    try {
      let query = 'SELECT * FROM servicio WHERE categoria = ?';

      if (!incluirInactivos) {
        query += ' AND activo = true';
      }

      query += ' ORDER BY nombre';

      const [rows] = await pool.execute(query, [categoria]);
      return rows;
    } catch (error) {
      console.error('Error buscando servicios por categoría:', error);
      throw error;
    }
  }

  // Actualizar servicio
  static async actualizar(id, servicioData) {
    try {
      const { nombre, descripcion, duracion, precio, categoria, activo } = servicioData;

      const [result] = await pool.execute(
        `UPDATE servicio 
         SET nombre = ?, descripcion = ?, duracion = ?, precio = ?, categoria = ?, activo = ?
         WHERE id = ?`,
        [nombre, descripcion, duracion, precio, categoria, activo, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error actualizando servicio:', error);
      throw error;
    }
  }

  // Eliminar servicio (borrado lógico)
  static async eliminar(id) {
    try {
      const [result] = await pool.execute(
        'UPDATE servicio SET activo = false WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error eliminando servicio:', error);
      throw error;
    }
  }
}

module.exports = Servicio;