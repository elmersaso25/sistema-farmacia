require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcrypt');
const loginRoute = require('./routes/loginRoute');
const usuarioRoute = require('./routes/usuarioRoute');
const medicamentoRoute = require('./routes/medicamentoRoute');
const clienteRoute = require('./routes/clienteRoute');
const proveedorRoute = require('./routes/proveedorRoute');
const compraRoute = require('./routes/compraRoute');
const ventaRoute = require('./routes/ventaRoute');

const app = express();

//Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Permitir cualquier origen (incluso otras PCs de la red)
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], 
  allowedHeaders: ["Content-Type", "Authorization"], 
  credentials: true // si usas cookies o headers con credenciales
}));

// 🔹 Middleware para parsear JSON
app.use(express.json());


// Ruta raíz
app.get('/', (req, res) => {
  res.send('API funcionando');
});

// Rutas de login
app.use('/login', loginRoute);


// Rutas de usuarios
app.use('/usuarios', usuarioRoute);

// Ruta de medicamentos
app.use('/medicamentos', medicamentoRoute);

//Ruta de clientes
app.use('/clientes', clienteRoute);

//Ruta de proveedores
app.use('/proveedores', proveedorRoute);

//Ruta de compras
app.use('/compras', compraRoute);

//Ruta de ventas
app.use('/ventas', ventaRoute);

// Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});





