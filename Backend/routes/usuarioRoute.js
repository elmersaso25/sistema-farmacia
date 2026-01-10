const express = require('express');
const router = express.Router();
const { obtenerUsuarios, obtenerUsuariosPorId, registrarUsuarios,actualizarUsuarios, cambiarEstado, obtenerTotalUsuarios } = require("../controllers/usuarioController");

router.get('/totalUsuarios', obtenerTotalUsuarios);
router.get('/:id', obtenerUsuariosPorId);
router.get('/', obtenerUsuarios);
router.post('/registrar', registrarUsuarios );
router.put('/actualizar/:id', actualizarUsuarios );
router.patch('/:id/estado', cambiarEstado);

module.exports = router;