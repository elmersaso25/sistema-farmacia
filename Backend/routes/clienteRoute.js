const express = require("express");
const router = express.Router();
const {obtenerClientes, obtenerClientesPorId, registrarClientes, actualizarClientes, obtenerTotalClientes} = require("../controllers/clienteController");

router.get('/totalClientes', obtenerTotalClientes);
router.get('/:id', obtenerClientesPorId);
router.get('/', obtenerClientes);
router.post('/registrar', registrarClientes);
router.put('/actualizar/:id', actualizarClientes);

module.exports = router;