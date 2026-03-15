const PDFDocument = require("pdfkit");
const pool = require("../db");


const obtenerVentas = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT v.noVenta, v.noFactura, v.fechaVenta, c.nombreCompleto, v.totalVenta, v.estadoVenta FROM ventas v INNER JOIN clientes c ON v.idCliente = c.idCliente ORDER BY v.noVenta DESC;");
        res.status(200).json(rows)

    } catch (error) {
        console.error("Error al obtener ventas", error);
        res.status(500).json({ mensaje: "Error al obtener ventas" });

    }
}


const obtenerDetallesVenta = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.query(
            `SELECT d.idDetalle,
                    CONCAT(p.nombreMedicamento,' ',p.descripcion) AS nombreProducto,
                    d.cantidad,
                    d.precio,
                    d.subtotal
             FROM detalleVentas d
             INNER JOIN medicamentos p 
                ON d.idProducto = p.idMedicamento
             WHERE d.noVenta = ?;`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ mensaje: "No hay detalles para esta venta" });
        }

        res.json(rows); // ✅ ESTO FALTABA

    } catch (error) {
        console.error("Error al obtener detalles de venta", error);
        res.status(500).json({ mensaje: "Error al obtener detalles de venta" });
    }
};


//Funcion registrar ventas
const registrarVentas = async (req, res) => {
    const { idCliente, detalles } = req.body;
    const idUsuario = req.usuario.idUsuario;

    if (!Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({ mensaje: 'Datos incompletos' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Validar cliente exista
        const [cliente] = await connection.query(
            "SELECT idCliente FROM clientes WHERE idCliente = ?",
            [idCliente]
        );
        if (cliente.length === 0) {
            throw new Error('El cliente no existe');
        }

        let totalVenta = 0;
        let errores = {};

        // ✅ Validar detalles
        for (let i = 0; i < detalles.length; i++) {
            const { idProducto, cantidad } = detalles[i];

            // Validar stock medicamento
            const [medicamento] = await connection.query(
                "SELECT idMedicamento, precio, stock FROM medicamentos WHERE idMedicamento = ?",
                [idProducto]
            );

            if (medicamento.length === 0) {
                errores[`detalles.${i}.idMedicamento`] = "El medicamento no existe";
            }
            else if (medicamento[0].stock < cantidad) {
                errores[`detalles.${i}.cantidad`] = "Stock insuficiente";
            }

            if (!Number.isInteger(cantidad) || cantidad <= 0) {
                errores[`detalles.${i}.cantidad`] = "La cantidad debe ser mayor a 0";
            }

            // Solo sumar si ese item no tiene error en cantidad/precio
            if (
                !errores[`detalles.${i}.cantidad`]
            ) {
                totalVenta += cantidad * medicamento[0].precio;
            }
        }

        if (Object.keys(errores).length > 0) {
            await connection.rollback();
            return res.status(400).json({ errores });
        }

        // ===== Generar número de factura seguro usando correlativosFactura =====
        const serie = 'A';
        const añoActual = new Date().getFullYear();

        let [correlativo] = await connection.query(
            "SELECT * FROM correlativosFactura2 WHERE serie = ? AND anio = ? FOR UPDATE",
            [serie, añoActual]
        );

        let noFactura;
        if (correlativo.length > 0) {
            const nuevoNumero = correlativo[0].ultimoNumero + 1;
            noFactura = `${serie}-${añoActual}-${nuevoNumero.toString().padStart(5, '0')}`;

            await connection.query(
                "UPDATE correlativosFactura2 SET ultimoNumero = ? WHERE id = ?",
                [nuevoNumero, correlativo[0].id]
            );
        } else {
            const nuevoNumero = 1;
            noFactura = `${serie}-${añoActual}-${nuevoNumero.toString().padStart(5, '0')}`;

            await connection.query(
                "INSERT INTO correlativosFactura2 (serie, anio, ultimoNumero) VALUES (?, ?, ?)",
                [serie, añoActual, nuevoNumero]
            );
        }
        // ===== Insertar venta con fechaVenta automática =====
        const [ventaResult] = await connection.query(
            "INSERT INTO ventas (idCliente, totalVenta, usuarioRegistro, noFactura, fechaVenta) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
            [idCliente, totalVenta, idUsuario, noFactura]
        );

        const noVenta = ventaResult.insertId;

        // Insertar detalles y actualizar stock
        for (const item of detalles) {

    const [medicamento] = await connection.query(
        "SELECT precio FROM medicamentos WHERE idMedicamento = ?",
        [item.idProducto]
    );

    const precio = medicamento[0].precio;
    const subtotal = item.cantidad * precio;

    await connection.query(
        "INSERT INTO detalleVentas (noVenta, idProducto, cantidad, precio, subtotal) VALUES (?, ?, ?, ?, ?)",
        [
            noVenta,
            item.idProducto,
            item.cantidad,
            precio,
            subtotal
        ]
    );

    const [updateStock] = await connection.query(
        "UPDATE medicamentos SET stock = stock - ? WHERE idMedicamento = ? AND stock >= ?",
        [item.cantidad, item.idProducto, item.cantidad]
    );

    if (updateStock.affectedRows === 0) {
        throw new Error("Stock insuficiente al actualizar");
    }
}

        await connection.commit();

        res.status(201).json({
            mensaje: 'Venta registrada correctamente',
            noVenta,
            noFactura,
            totalVenta
        });

    } catch (error) {
        await connection.rollback();
        res.status(400).json({
            mensaje: 'Error al registrar la venta',
            error: error.message
        });
    } finally {
        connection.release();
    }
};


// Funcion obtener datos iniciales
const obtenerDatosIniciales = async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT 
        MAX(noVenta) AS ultimaVenta,
        MAX(noFactura) AS ultimaFactura
      FROM ventas
    `);

        const ultimaVenta = rows[0].ultimaVenta || 0;
        const ultimaFactura = rows[0].ultimaFactura; // puede ser NULL

        let siguienteNumeroFactura = 1;

        if (ultimaFactura) {
            // Formato esperado: A-2026-00001
            const partes = ultimaFactura.split("-");
            const numero = parseInt(partes[2], 10);
            siguienteNumeroFactura = numero + 1;
        }

        const anioActual = new Date().getFullYear();
        const noFacturaFormateada = `A-${anioActual}-${String(siguienteNumeroFactura).padStart(5, "0")}`;

        res.json({
            siguienteVenta: ultimaVenta + 1,
            siguienteFactura: noFacturaFormateada,
            fechaVenta: new Date().toISOString().split("T")[0]
        });
    } catch (error) {
        console.error("Error en obtenerDatosIniciales:", error);
        res.status(500).json({
            mensaje: "Error al obtener datos iniciales de venta"
        });
    }
};


module.exports = { obtenerVentas, obtenerDetallesVenta, registrarVentas, obtenerDatosIniciales };
