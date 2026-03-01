const PDFDocument = require("pdfkit");
const pool = require("../db");


const obtenerVentas = async (req, res) => {
    try{
        const [rows] = await pool.query("SELECT v.noVenta, v.noFactura, v.fechaVenta, c.nombreCompleto, v.totalVenta, v.estadoVenta, v.observaciones FROM ventas v INNER JOIN clientes c ON v.idCliente = c.idCliente ORDER BY v.noVenta DESC;");
        res.status(200).json(rows)

    } catch(error){
        console.error("Error al obtener ventas", error);
        res.status(500).json({ mensaje: "Error al obtener ventas" });

    }
}

module.exports = {obtenerVentas};
