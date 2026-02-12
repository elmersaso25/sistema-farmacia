const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;

const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ mensaje: 'Token requerido' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.usuario = { idUsuario: decoded.idUsuario };
        next();
        
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ mensaje: 'Sesión expirada, inicia sesión de nuevo' });
        }
        return res.status(401).json({ mensaje: 'Token inválido' });
    }
};

module.exports = verificarToken;
