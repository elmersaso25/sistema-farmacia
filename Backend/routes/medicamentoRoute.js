const express = require('express');
const router = express.Router();
const { obtenerMedicamentos, obtenerMedicamentosPorId, registrarMedicamentos, actualizarMedicamentos, cambiarEstado, obtenerTotalMedicamentos } = require("../controllers/medicamentoController");

router.get('/totalMedicamentos', obtenerTotalMedicamentos);
router.get('/:id', obtenerMedicamentosPorId);
router.get('/', obtenerMedicamentos);
router.post('/registrar', registrarMedicamentos);
router.put('/actualizar/:id', actualizarMedicamentos);
router.patch('/:id/estado', cambiarEstado);

module.exports = router;