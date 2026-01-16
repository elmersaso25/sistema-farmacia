const express = require('express');
const router = express.Router();
const verificarToken = require('../verificarToken');

const { obtenerUsuarios, obtenerUsuariosPorId, registrarUsuarios, actualizarUsuarios, cambiarEstado, obtenerTotalUsuarios } = require("../controllers/usuarioController");

// Todas protegidas con token
router.get('/totalUsuarios', verificarToken, obtenerTotalUsuarios);
router.get('/:id', verificarToken, obtenerUsuariosPorId);
router.get('/', verificarToken, obtenerUsuarios);
router.post('/registrar', verificarToken, registrarUsuarios);
router.put('/actualizar/:id', verificarToken, actualizarUsuarios);
router.patch('/:id/estado', verificarToken, cambiarEstado);

module.exports = router;
