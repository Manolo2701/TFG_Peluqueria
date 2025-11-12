const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registrar = async (req, res) => {
  try {
    const { email, password, nombre, apellidos, telefono, direccion, rol = 'cliente' } = req.body;

    if (!email || !password || !nombre || !apellidos) {
      return res.status(400).json({
        mensaje: 'Email, contraseña, nombre y apellidos son obligatorios'
      });
    }

    const usuarioExistente = await Usuario.buscarPorEmail(email);
    if (usuarioExistente) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const datosUsuario = {
      email,
      password: hashPassword,
      nombre,
      apellidos,
      telefono: telefono || null,
      direccion: direccion || null,
      rol
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

    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Email y contraseña son obligatorios' });
    }

    const usuario = await Usuario.buscarPorEmail(email);
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    const esValida = await bcrypt.compare(password, usuario.password);
    if (!esValida) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

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
    console.error('Error en login:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = { registrar, login };