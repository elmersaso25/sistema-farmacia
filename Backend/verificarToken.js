const jwt = require('jsonwebtoken');
const SECRET_KEY = 'mi_clave_secreta'; 

// Middleware para verificar el token JWT
const verificarToken = (req, res, next) => {

    const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ mensaje: 'No se proporcionó un token' });
  }

  // Verificar el token usando jwt.verify
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ mensaje: 'Token no válido' });
    }

    // Si el token es válido, pasamos la información del usuario al siguiente middleware o ruta
    req.user = decoded;
    next();
  });
};

module.exports = { verificarToken };
