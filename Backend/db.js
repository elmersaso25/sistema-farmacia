const mysql = require('mysql2/promise')
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
.then(conn =>{
// console.log("Conexion Exitosa con MySQL");
    conn.release();
})
.catch(err =>{
    console.error("Error al conectar con MySQL", err.message);
});


module.exports = pool;

