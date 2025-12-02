const { pool } = require('../config/database');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');

exports.obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      mensaje: 'Perfil obtenido exitosamente',
      usuario: usuario
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar perfil del usuario logueado
exports.actualizarPerfil = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const {
      nombre,
      apellidos,
      email,
      telefono,
      direccion,
      currentPassword,
      newPassword
    } = req.body;

    console.log(`✏️ [CONTROLADOR] Actualizando perfil usuario ID: ${usuarioId}`, req.body);

    // Obtener usuario actual
    const usuario = await Usuario.buscarPorId(usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar si el email ya existe (si se está cambiando)
    if (email && email !== usuario.email) {
      const emailExiste = await Usuario.buscarPorEmail(email);
      if (emailExiste) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }
    }

    // Si se quiere cambiar la contraseña, verificar la actual
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          error: 'Debes proporcionar tu contraseña actual para cambiarla'
        });
      }

      // Necesitamos obtener el usuario completo con password para verificar
      const [usuarioCompleto] = await pool.execute(
        'SELECT * FROM usuario WHERE id = ?',
        [usuarioId]
      );

      const passwordValido = await bcrypt.compare(currentPassword, usuarioCompleto[0].password);
      if (!passwordValido) {
        return res.status(400).json({
          error: 'La contraseña actual es incorrecta'
        });
      }

      // Encriptar nueva contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar contraseña
      await pool.execute(
        'UPDATE usuario SET password = ? WHERE id = ?',
        [hashedPassword, usuarioId]
      );
    }

    // Actualizar el resto de campos
    const datosActualizados = {};
    if (nombre !== undefined) datosActualizados.nombre = nombre;
    if (apellidos !== undefined) datosActualizados.apellidos = apellidos;
    if (email !== undefined) datosActualizados.email = email;
    if (telefono !== undefined) datosActualizados.telefono = telefono;
    if (direccion !== undefined) datosActualizados.direccion = direccion;

    // Usar el método actualizar del modelo
    const actualizado = await Usuario.actualizar(usuarioId, datosActualizados);

    if (!actualizado) {
      return res.status(400).json({ error: 'No se pudo actualizar el perfil' });
    }

    // Obtener el usuario actualizado
    const usuarioActualizado = await Usuario.buscarPorId(usuarioId);

    console.log(`✅ [CONTROLADOR] Perfil actualizado exitosamente`);

    res.json({
      mensaje: 'Perfil actualizado exitosamente',
      usuario: usuarioActualizado
    });

  } catch (error) {
    console.error('❌ [CONTROLADOR] Error actualizando perfil:', error);
    res.status(500).json({
      error: 'Error al actualizar el perfil',
      detalle: error.message
    });
  }
};

// Obtener todos los usuarios (solo admin)
exports.obtenerUsuarios = async (req, res) => {
  try {
    if (req.usuario.rol !== 'administrador') {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }

    const usuarios = await Usuario.listarTodos();

    res.json({
      total: usuarios.length,
      usuarios
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ NUEVO: Obtener solo clientes (solo admin)
exports.obtenerClientes = async (req, res) => {
  try {
    // Verificar que sea administrador
    if (req.usuario.rol !== 'administrador') {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }

    console.log('🔍 [CONTROLADOR] Obteniendo lista de clientes...');

    // Obtener solo usuarios con rol 'cliente'
    const [rows] = await pool.execute(
      `SELECT 
        id, 
        email, 
        nombre, 
        apellidos, 
        telefono, 
        direccion, 
        rol, 
        fecha_creacion AS fecha_registro  
      FROM usuario 
      WHERE rol = 'cliente' AND activo = true
      ORDER BY fecha_creacion DESC`
    );

    console.log(`✅ [CONTROLADOR] Encontrados ${rows.length} clientes`);

    res.json({
      total: rows.length,
      clientes: rows
    });
  } catch (error) {
    console.error('❌ [CONTROLADOR] Error obteniendo clientes:', error);
    res.status(500).json({
      error: 'Error al obtener la lista de clientes',
      detalle: error.message
    });
  }
};

// Obtener usuario por ID
exports.obtenerUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Si no es admin y quiere ver otro perfil, denegar
    if (req.usuario.id !== parseInt(id) && req.usuario.rol !== 'administrador') {
      return res.status(403).json({
        error: 'No tienes permisos para ver este perfil'
      });
    }

    const usuario = await Usuario.buscarPorId(id);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};