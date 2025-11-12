const { pool } = require('../config/database');

class Usuario {
  static async buscarPorEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM usuario WHERE email = ? AND activo = true',
        [email]
      );
      return rows[0];
    } catch (error) {
      console.error('Error buscando usuario por email:', error.message);
      throw error;
    }
  }

  static async buscarPorId(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, email, nombre, apellidos, telefono, direccion, rol, fecha_registro FROM usuario WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error('Error buscando usuario por ID:', error.message);
      throw error;
    }
  }

  static async crear(usuarioData) {
    try {
      const { email, password, nombre, apellidos, telefono, direccion, rol } = usuarioData;

      if (!email || !password || !nombre || !apellidos) {
        throw new Error('Faltan campos requeridos: email, password, nombre o apellidos');
      }

      const [result] = await pool.execute(
        `INSERT INTO usuario (email, password, nombre, apellidos, telefono, direccion, rol)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [email, password, nombre, apellidos, telefono, direccion, rol || 'cliente']
      );

      return result.insertId;
    } catch (error) {
      console.error('Error en modelo Usuario.crear:', error.message);
      throw error;
    }
  }

  static async listarTodos() {
    try {
      const [rows] = await pool.execute(
        'SELECT id, email, nombre, apellidos, telefono, direccion, rol, fecha_registro FROM usuario WHERE activo = true'
      );
      return rows;
    } catch (error) {
      console.error('Error listando usuarios:', error);
      throw error;
    }
  }

  static async actualizar(id, datosActualizados) {
    try {
      const campos = [];
      const valores = [];

      for (const [campo, valor] of Object.entries(datosActualizados)) {
        if (valor !== undefined && valor !== null) {
          campos.push(`${campo} = ?`);
          valores.push(valor);
        }
      }

      if (campos.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      valores.push(id);

      const [result] = await pool.execute(
        `UPDATE usuario SET ${campos.join(', ')} WHERE id = ?`,
        valores
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error en actualizar usuario:', error.message);
      throw error;
    }
  }

  static async desactivar(id) {
    try {
      const [result] = await pool.execute(
        'UPDATE usuario SET activo = false WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error desactivando usuario:', error.message);
      throw error;
    }
  }
}

module.exports = Usuario;