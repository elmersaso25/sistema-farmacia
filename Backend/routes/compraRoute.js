const express = require('express');
const { registrarCompras, obtenerCompras, obtenerTotalCompras, obtenerDatosIniciales, obtenerDetallesCompra } = require('../controllers/compraController');
const verificarToken = require('../verificarToken'); 


const router = express.Router();

router.get('/totalCompras', obtenerTotalCompras);
router.get('/datosIniciales', obtenerDatosIniciales );
router.get('/', verificarToken, obtenerCompras );
router.get('/detalles/:id', verificarToken,obtenerDetallesCompra);
router.post('/registrar', verificarToken, registrarCompras);

module.exports = router;