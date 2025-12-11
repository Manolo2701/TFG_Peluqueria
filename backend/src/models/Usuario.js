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
        'SELECT id, email, nombre, apellidos, telefono, direccion, rol, fecha_creacion AS fecha_registro FROM usuario WHERE id = ?',
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
      const {
        email,
        password,
        nombre,
        apellidos,
        telefono,
        direccion,
        rol,
        preguntaSeguridad,
        respuestaSeguridadHash
      } = usuarioData;

      if (!email || !password || !nombre || !apellidos) {
        throw new Error('Faltan campos requeridos: email, password, nombre o apellidos');
      }

      // HASHEAR PASSWORD CON VERIFICACIÓN
      console.log('🔐 [MODELO] Generando hash para:', email);
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 🔥 VERIFICAR que el hash sea válido (60 caracteres)
      if (hashedPassword.length !== 60) {
        console.error('❌ [MODELO] Hash inválido, longitud:', hashedPassword.length);
        throw new Error('Error generando hash de contraseña');
      }

      // 🔥 FORZAR $2a$ SIEMPRE
      let finalHash = hashedPassword;
      if (hashedPassword.startsWith('$2b$')) {
        console.log('🔄 [MODELO] Convirtiendo $2b$ → $2a$');
        finalHash = '$2a$' + hashedPassword.substring(4);
      }

      console.log('✅ [MODELO] Hash generado correctamente (60 chars):',
        finalHash.substring(0, 30) + '...');

      const [result] = await pool.execute(
        `INSERT INTO usuario (
          email, password, nombre, apellidos, telefono, 
          direccion, rol, pregunta_seguridad, respuesta_seguridad_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          email, finalHash, nombre, apellidos, telefono,
          direccion, rol || 'cliente', preguntaSeguridad, respuestaSeguridadHash
        ]
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

  static async actualizar(id, datos) {
    try {
      console.log(`✏️ [MODELO USUARIO] Actualizando usuario ID: ${id}`, datos);

      // Construir la parte SET de la query dinámicamente
      const campos = [];
      const valores = [];

      // Lista de campos permitidos para actualizar
      const camposPermitidos = ['nombre', 'apellidos', 'email', 'telefono', 'direccion', 'password'];

      for (const [campo, valor] of Object.entries(datos)) {
        if (camposPermitidos.includes(campo) && valor !== undefined) {
          campos.push(`${campo} = ?`);
          valores.push(valor);
        }
      }

      if (campos.length === 0) {
        console.log('ℹ️ [MODELO USUARIO] No hay campos para actualizar');
        return false;
      }

      valores.push(id);

      const query = `UPDATE usuario SET ${campos.join(', ')} WHERE id = ?`;
      console.log(`📝 [MODELO USUARIO] Query: ${query}`, valores);

      const [result] = await pool.execute(query, valores);
      console.log(`✅ [MODELO USUARIO] Usuario actualizado: ${result.affectedRows > 0}`);

      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ Error actualizando usuario:', error);
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

  static async actualizarPassword(id, nuevaPassword) {
    const [result] = await pool.execute(
      'UPDATE usuario SET password = ?, fecha_actualizacion = NOW() WHERE id = ?',
      [nuevaPassword, id]
    );
    return result.affectedRows > 0;
  }

  // 🔐 Métodos para recuperación de contraseña
  static async obtenerPreguntaSeguridad(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT pregunta_seguridad FROM usuario WHERE email = ? AND activo = true',
        [email]
      );
      return rows[0] ? rows[0].pregunta_seguridad : null;
    } catch (error) {
      console.error('Error obteniendo pregunta de seguridad:', error.message);
      throw error;
    }
  }

  static async verificarRespuestaSeguridad(email, respuestaSeguridad) {
    try {
      const [rows] = await pool.execute(
        'SELECT respuesta_seguridad_hash FROM usuario WHERE email = ? AND activo = true',
        [email]
      );

      if (!rows[0] || !rows[0].respuesta_seguridad_hash) {
        return false;
      }

      const esValida = await bcrypt.compare(respuestaSeguridad, rows[0].respuesta_seguridad_hash);
      return esValida;
    } catch (error) {
      console.error('Error verificando respuesta de seguridad:', error.message);
      throw error;
    }
  }

  static async guardarTokenRecuperacion(email, token, expiracion) {
    try {
      const [result] = await pool.execute(
        'UPDATE usuario SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
        [token, expiracion, email]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error guardando token de recuperación:', error.message);
      throw error;
    }
  }

  static async buscarPorToken(token) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM usuario WHERE reset_token = ? AND reset_token_expires > NOW() AND activo = true',
        [token]
      );
      return rows[0];
    } catch (error) {
      console.error('Error buscando usuario por token:', error.message);
      throw error;
    }
  }

  static async actualizarPasswordPorToken(token, nuevaPassword) {
    try {
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(nuevaPassword, saltRounds);
      let finalHash = hashedPassword;

      if (hashedPassword.startsWith('$2b$')) {
        finalHash = '$2a$' + hashedPassword.substring(4);
      }

      const [result] = await pool.execute(
        'UPDATE usuario SET password = ?, reset_token = NULL, reset_token_expires = NULL, fecha_actualizacion = NOW() WHERE reset_token = ?',
        [finalHash, token]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error actualizando contraseña por token:', error.message);
      throw error;
    }
  }
}

module.exports = Usuario;