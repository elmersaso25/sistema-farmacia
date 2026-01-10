const express = require('express');
const router = express.Router();
const { login } = require('../controllers/loginController');

router.post('/iniciar', login);

module.exports = router;
