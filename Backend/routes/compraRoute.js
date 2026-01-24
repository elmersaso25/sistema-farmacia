const express = require('express');
const { registrarCompras, obtenerCompras, obtenerTotalCompras } = require('../controllers/compraController');
const verificarToken = require('../verificarToken'); 


const router = express.Router();

router.get('/totalCompras', obtenerTotalCompras);
router.get('/', verificarToken, obtenerCompras);
router.post('/registrar', verificarToken, registrarCompras);

module.exports = router;