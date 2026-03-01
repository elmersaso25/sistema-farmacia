const express = require("express");
const verificarToken = require('../verificarToken'); 
const { obtenerVentas } = require("../controllers/ventaController");


const router = express.Router();

router.get('/', verificarToken, obtenerVentas );

module.exports = router;