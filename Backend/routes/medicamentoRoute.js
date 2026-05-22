const express = require('express');
const router = express.Router();
const { obtenerMedicamentos, obtenerMedicamentosPorId, registrarMedicamentos, actualizarMedicamentos, cambiarEstado, obtenerTotalMedicamentos, buscarMedicamentos, obtenerTotalStockMedicamentos, obtenerCategorias } = require("../controllers/medicamentoController");

router.get('/totalMedicamentos', obtenerTotalMedicamentos);
router.get('/totalStock', obtenerTotalStockMedicamentos);
router.get('/buscar', buscarMedicamentos);
router.get('/categorias', obtenerCategorias);

router.get('/', obtenerMedicamentos);
router.get('/:id', obtenerMedicamentosPorId);
router.post('/registrar', registrarMedicamentos);
router.put('/actualizar/:id', actualizarMedicamentos);
router.patch('/:id/estado', cambiarEstado);

module.exports = router;