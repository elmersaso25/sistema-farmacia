const express = require('express');
const router = express.Router();
const {obtenerProveedores, obtenerProveedoresPorId, registrarProveedores, actualizarProveedores, obtenerTotalProveedores, cambiarEstado, obtenerProveedoresActivos} = require("../controllers/proveedorController");

router.get('/totalProveedores', obtenerTotalProveedores);
router.get('/', obtenerProveedores);
router.get('/activos',obtenerProveedoresActivos);
router.get('/:id', obtenerProveedoresPorId);

//Otras rutas//
router.post('/registrar', registrarProveedores);
router.put('/actualizar/:id', actualizarProveedores);
router.patch('/:id/estado', cambiarEstado);



module.exports = router;
