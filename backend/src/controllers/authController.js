const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registrar = async (req, res) => {
  try {
    const {
      email,
      password,
      nombre,
      apellidos,
      telefono,
      direccion,
      rol = 'cliente',
      preguntaSeguridad,  
      respuestaSeguridad    
    } = req.body;

    console.log('========== REGISTRO DEBUG ==========');
    console.log('📧 Email:', email);
    console.log('🔑 Password (texto):', password);
    console.log('❓ Pregunta seguridad:', preguntaSeguridad);
    console.log('💬 Respuesta seguridad:', respuestaSeguridad);

    if (!email || !password || !nombre || !apellidos) {
      return res.status(400).json({
        mensaje: 'Email, contraseña, nombre y apellidos son obligatorios'
      });
    }

    // Validar pregunta y respuesta si se proporcionan
    if (preguntaSeguridad && !respuestaSeguridad) {
      return res.status(400).json({
        mensaje: 'Si proporcionas una pregunta de seguridad, debes proporcionar una respuesta'
      });
    }

    const usuarioExistente = await Usuario.buscarPorEmail(email);
    if (usuarioExistente) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }

    // Hash de la respuesta de seguridad
    let respuestaSeguridadHash = null;
    if (respuestaSeguridad) {
      const saltRounds = 12;
      const hashedRespuesta = await bcrypt.hash(respuestaSeguridad, saltRounds);
      respuestaSeguridadHash = hashedRespuesta.startsWith('$2b$')
        ? '$2a$' + hashedRespuesta.substring(4)
        : hashedRespuesta;
    }

    const datosUsuario = {
      email,
      password,
      nombre,
      apellidos,
      telefono: telefono || null,
      direccion: direccion || null,
      rol,
      preguntaSeguridad: preguntaSeguridad || null,
      respuestaSeguridadHash: respuestaSeguridadHash
    };

    const idUsuario = await Usuario.crear(datosUsuario);

    return res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      id: idUsuario
    });

  } catch (error) {
    console.error('Error en registro:', error.message);
    return res.status(500).json({
      mensaje: 'Error interno del servidor'
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('========== LOGIN DEBUG ==========');
    console.log('📧 Email recibido:', email);
    console.log('🔑 Password recibida:', `"${password}"`);
    console.log('📏 Longitud password:', password.length);
    console.log('🔢 Bytes password:', Buffer.from(password).toString('hex'));

    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Email y contraseña son obligatorios' });
    }

    const usuario = await Usuario.buscarPorEmail(email);
    if (!usuario) {
      console.log('❌ Usuario no encontrado en DB');
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    console.log('✅ Usuario encontrado en DB');
    console.log('🔐 Hash almacenado completo:', usuario.password);
    console.log('📏 Longitud hash almacenado:', usuario.password.length);
    console.log('🔡 Tipo hash:', usuario.password.substring(0, 7));

    // Verificar longitud del hash
    if (usuario.password.length !== 60) {
      console.error(`❌ HASH CORRUPTO: Longitud ${usuario.password.length} (debe ser 60)`);
      console.error(`❌ Hash: ${usuario.password}`);
      return res.status(500).json({
        mensaje: 'Error en la base de datos - hash corrupto',
        debug: { hashLength: usuario.password.length }
      });
    }

    console.log('🔄 Ejecutando bcrypt.compare...');
    const esValida = await bcrypt.compare(password, usuario.password);
    console.log('✅ Resultado bcrypt.compare:', esValida);

    // Si falla y es $2b$, convertir
    if (!esValida && usuario.password.startsWith('$2b$')) {
      console.log('🔄 Probando conversión $2b$ → $2a$');
      const hashConvertido = '$2a$' + usuario.password.substring(4);
      const esValidaConvertida = await bcrypt.compare(password, hashConvertido);
      console.log('🔄 Resultado con conversión:', esValidaConvertida);
      if (esValidaConvertida) {
        console.log('✅ Login exitoso con conversión');
        esValida = true;

        // Actualizar en BD
        try {
          await Usuario.actualizarPassword(usuario.id, hashConvertido);
          console.log('✅ Hash actualizado en BD');
        } catch (updateError) {
          console.log('⚠️ No se pudo actualizar hash:', updateError.message);
        }
      }
    }

    if (!esValida) {
      console.log('❌ Login fallido - Credenciales inválidas');

      // Debug adicional
      console.log('🔍 DEBUG EXTRA:');
      console.log('   Hash almacenado primeros 60 chars:', usuario.password);
      console.log('   Hash almacenado en hex:', Buffer.from(usuario.password).toString('hex'));

      // Generar un hash de prueba
      const testHash = await bcrypt.hash(password, 12);
      console.log('   Hash de prueba generado:', testHash);
      console.log('   Longitud hash de prueba:', testHash.length);

      return res.status(401).json({
        mensaje: 'Credenciales inválidas',
        debug: {
          hashLength: usuario.password.length,
          hashType: usuario.password.substring(0, 7),
          expectedLength: 60
        }
      });
    }

    console.log('✅ Login exitoso');

    const payload = {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    return res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('🔥 Error en login:', error);
    console.error('🔥 Stack:', error.stack);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Obtener pregunta de seguridad
const obtenerPreguntaSeguridad = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ mensaje: 'El email es obligatorio' });
    }

    const pregunta = await Usuario.obtenerPreguntaSeguridad(email);

    if (!pregunta) {
      return res.status(404).json({
        mensaje: 'No se encontró una pregunta de seguridad para este usuario'
      });
    }

    res.json({
      preguntaSeguridad: pregunta
    });
  } catch (error) {
    console.error('Error obteniendo pregunta de seguridad:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Verificar respuesta de seguridad
const verificarRespuestaSeguridad = async (req, res) => {
  try {
    const { email, respuestaSeguridad } = req.body;

    if (!email || !respuestaSeguridad) {
      return res.status(400).json({
        mensaje: 'Email y respuesta son obligatorios'
      });
    }

    const esValida = await Usuario.verificarRespuestaSeguridad(email, respuestaSeguridad);

    if (!esValida) {
      return res.status(400).json({
        mensaje: 'Respuesta incorrecta'
      });
    }

    // Generar token de recuperación
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hora

    await Usuario.guardarTokenRecuperacion(email, resetToken, resetTokenExpires);

    res.json({
      mensaje: 'Respuesta verificada correctamente',
      resetToken
    });
  } catch (error) {
    console.error('Error verificando respuesta de seguridad:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Resetear contraseña con token
const resetearPassword = async (req, res) => {
  try {
    const { resetToken, nuevaPassword } = req.body;

    if (!resetToken || !nuevaPassword) {
      return res.status(400).json({
        mensaje: 'Token y nueva contraseña son obligatorios'
      });
    }

    const actualizado = await Usuario.actualizarPasswordPorToken(resetToken, nuevaPassword);

    if (!actualizado) {
      return res.status(400).json({
        mensaje: 'Token inválido o expirado'
      });
    }

    res.json({
      mensaje: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    console.error('Error reseteando contraseña:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  registrar,
  login,
  obtenerPreguntaSeguridad,
  verificarRespuestaSeguridad,
  resetearPassword
};