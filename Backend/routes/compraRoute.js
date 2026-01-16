const express = require('express');
const { registrarCompras, obtenerCompras } = require('../controllers/compraController');
const verificarToken = require('../verificarToken'); 


const router = express.Router();

router.get('/', verificarToken, obtenerCompras);
router.post('/registrar', verificarToken, registrarCompras);

module.exports = router;