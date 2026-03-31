const express = require("express");
const verificarToken = require('../verificarToken'); 
const { obtenerVentas, registrarVentas, obtenerDatosIniciales, anularVenta, anularProductoVenta, obtenerTotalVentasDelDia, obtenerTotalVentas, generarPDFVenta, obtenerDetallesVenta } = require("../controllers/ventaController");


const router = express.Router();
router.get('/totalVentasDelDia', obtenerTotalVentasDelDia);
router.get('/totalVentas', obtenerTotalVentas);
router.get('/datosIniciales', obtenerDatosIniciales);
router.get('/:id/pdf', generarPDFVenta);
router.get('/', verificarToken, obtenerVentas );
router.get('/detalles/:id', verificarToken,obtenerDetallesVenta);
router.post('/registrar', verificarToken, registrarVentas );
router.put('/anular/:id', verificarToken, anularVenta);
router.put('/anularProductoVenta/:idDetalle', verificarToken, anularProductoVenta);

module.exports = router;