const express = require('express');
const router = express.Router();
const {obtenerProveedores, obtenerProveedoresPorId, registrarProveedores, actualizarProveedores, obtenerTotalProveedores} = require("../controllers/proveedorController");

router.get('/totalProveedores', obtenerTotalProveedores);
router.get('/', obtenerProveedores);
router.get('/:id', obtenerProveedoresPorId);

router.post('/registrar', registrarProveedores);
router.put('/actualizar/:id', actualizarProveedores);



module.exports = router;
