const express = require('express');
const { registrarCompras } = require('../controllers/compraController');
const verificarToken = require('../verificarToken'); 


const router = express.Router();

router.post('/registrar', verificarToken, registrarCompras);

module.exports = router;