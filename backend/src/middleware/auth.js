const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  console.log(`🔐 Middleware auth - Ruta: ${req.path}, Método: ${req.method}`);

  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      console.log('❌ No hay token en la petición');
      return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
    }

    const decodificado = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decodificado;
    next();
  } catch (error) {
    res.status(401).json({ mensaje: 'Token no proporcionado o inválido' });
  }
};

module.exports = verificarToken;