const { pool } = require('../config/database');
const Usuario = require('../models/Usuario');

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