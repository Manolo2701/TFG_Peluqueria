const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

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

      // ✅ HASHEAR PASSWORD
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const [result] = await pool.execute(
        `INSERT INTO usuario (email, password, nombre, apellidos, telefono, direccion, rol)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [email, hashedPassword, nombre, apellidos, telefono, direccion, rol || 'cliente']
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
        'SELECT id, email, nombre, apellidos, telefono, direccion, rol, fecha_creacion AS fecha_registro FROM usuario WHERE activo = true'
      );
      return rows;
    } catch (error) {
      console.error('Error listando usuarios:', error);
      throw error;
    }
  }

  static async buscarPorId(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, email, nombre, apellidos, telefono, direccion, rol, fecha_creacion AS fecha_registro FROM usuario WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error('Error buscando usuario por ID:', error);
      throw error;
    }
  }
  
  static async actualizar(id, datosActualizados) {
    try {
      console.log(`✏️ [MODELO USUARIO] Actualizando usuario ID: ${id}`, datosActualizados);

      const campos = [];
      const valores = [];

      // Construir dinámicamente la consulta
      if (datosActualizados.email !== undefined) {
        campos.push('email = ?');
        valores.push(datosActualizados.email);
      }
      if (datosActualizados.nombre !== undefined) {
        campos.push('nombre = ?');
        valores.push(datosActualizados.nombre);
      }
      if (datosActualizados.apellidos !== undefined) {
        campos.push('apellidos = ?');
        valores.push(datosActualizados.apellidos);
      }
      if (datosActualizados.telefono !== undefined) {
        campos.push('telefono = ?');
        valores.push(datosActualizados.telefono);
      }
      if (datosActualizados.direccion !== undefined) {
        campos.push('direccion = ?');
        valores.push(datosActualizados.direccion);
      }

      if (campos.length === 0) {
        console.log('ℹ️ [MODELO USUARIO] No hay campos para actualizar');
        return true;
      }

      valores.push(id);

      const query = `UPDATE usuario SET ${campos.join(', ')} WHERE id = ?`;
      console.log(`📝 [MODELO USUARIO] Query: ${query}`, valores);

      const [result] = await pool.execute(query, valores);
      const actualizado = result.affectedRows > 0;

      console.log(`✅ [MODELO USUARIO] Usuario actualizado: ${actualizado}`);
      return actualizado;

    } catch (error) {
      console.error('❌ Error actualizando usuario:', error.message);
      throw error;
    }
  }

  static async desactivar(id) {
    try {
      console.log(`🔒 [MODELO USUARIO] Desactivando usuario ID: ${id}`);

      const [result] = await pool.execute(
        'UPDATE usuario SET activo = false WHERE id = ?',
        [id]
      );

      console.log(`📊 [MODELO USUARIO] Resultado desactivar: ${result.affectedRows} filas afectadas`);

      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ Error desactivando usuario:', error.message);
      throw error;
    }
  }
}

module.exports = Usuario;