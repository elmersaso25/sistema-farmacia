const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../db');

const SECRET_KEY = process.env.JWT_SECRET;


const login = async (req, res) => {
  const { correo, contrasenia } = req.body;

  try {
    // Buscar al usuario por correo
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE correo = ?", [correo]);
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const usuario = rows[0];

    // Verificar si el usuario está inactivo
    if (usuario.estado !== "Activo") {
        return res.status(403).json({
            mensaje: "El usuario está inactivo. Contacte al administrador."
        });
    }
    
    // Comparar la contraseña proporcionada con el hash almacenado en la base de datos
    const coincide = await bcrypt.compare(contrasenia, usuario.contrasenia);

    if (!coincide) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }

    // Generar el token JWT si las credenciales son correctas
    const token = jwt.sign(
      { id: usuario.id, nombreCompleto: usuario.nombreCompleto },
      SECRET_KEY, 
      { expiresIn: '1h' } // El token expirará en 1 hora
    );

    // Enviar el token como respuesta
    res.json({ mensaje: 'Login exitoso',
      usuario: usuario.nombreCompleto,
    token });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

module.exports = { login };
