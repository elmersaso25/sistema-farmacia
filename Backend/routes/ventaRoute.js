const express = require("express");
const verificarToken = require('../verificarToken'); 
const { obtenerVentas, registrarVentas, obtenerDatosIniciales } = require("../controllers/ventaController");


const router = express.Router();
router.get('/datosIniciales', obtenerDatosIniciales);
router.get('/', verificarToken, obtenerVentas );
router.post('/registrar', verificarToken, registrarVentas );

module.exports = router;