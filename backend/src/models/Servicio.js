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

  // Obtener todos los servicios activos
  static async listarTodos() {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM servicio WHERE activo = true ORDER BY categoria, nombre'
      );
      return rows;
    } catch (error) {
      console.error('Error listando servicios:', error);
      throw error;
    }
  }

  // Obtener servicio por ID
  static async buscarPorId(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM servicio WHERE id = ? AND activo = true',
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error('Error buscando servicio por ID:', error);
      throw error;
    }
  }

  // Obtener servicios por categoría
  static async buscarPorCategoria(categoria) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM servicio WHERE categoria = ? AND activo = true ORDER BY nombre',
        [categoria]
      );
      return rows;
    } catch (error) {
      console.error('Error buscando servicios por categoría:', error);
      throw error;
    }
  }

  // ✅ MÉTODO NUEVO: Actualizar servicio
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

  // ✅ MÉTODO NUEVO: Eliminar servicio (borrado lógico)
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