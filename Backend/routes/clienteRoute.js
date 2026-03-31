const express = require("express");
const router = express.Router();
const {obtenerClientes, obtenerClientesPorId, registrarClientes, actualizarClientes, obtenerTotalClientes, obtenerClientesPorNit, registrarClientesDesdeVentas} = require("../controllers/clienteController");

router.get('/totalClientes', obtenerTotalClientes);
router.get('/nit/:nit', obtenerClientesPorNit);
router.get('/id/:id', obtenerClientesPorId);
router.get('/', obtenerClientes);
router.post('/registrar', registrarClientes);
router.post('/registrarClientesDesdeVentas', registrarClientesDesdeVentas);
router.put('/actualizar/:id', actualizarClientes);

module.exports = router;