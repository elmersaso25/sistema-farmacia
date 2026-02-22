const express = require('express');
const { registrarCompras, obtenerCompras, obtenerTotalCompras, obtenerDatosIniciales, obtenerDetallesCompra, anularCompra, generarPDFCompra } = require('../controllers/compraController');
const verificarToken = require('../verificarToken'); 


const router = express.Router();

router.get('/totalCompras', obtenerTotalCompras);
router.get('/datosIniciales', obtenerDatosIniciales );
router.get('/:id/pdf', generarPDFCompra);
router.get('/', verificarToken, obtenerCompras );
router.get('/detalles/:id', verificarToken,obtenerDetallesCompra);
router.post('/registrar', verificarToken, registrarCompras);
router.put('/anular/:id', verificarToken, anularCompra);

module.exports = router;