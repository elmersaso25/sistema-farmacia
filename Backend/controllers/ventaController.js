const PDFDocument = require("pdfkit");
const pool = require("../db");


const obtenerVentas = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT v.noVenta,v.noFactura,v.fechaVenta,c.nombreCompleto,v.totalVenta,COALESCE(SUM((d.cantidad - d.cantidadAnulada) * d.precio), 0) AS totalActual,COALESCE(SUM(d.cantidadAnulada * d.precio), 0) AS totalAnulado,v.estadoVenta FROM ventas v INNER JOIN clientes c ON v.idCliente = c.idCliente LEFT JOIN detalleVentas d ON v.noVenta = d.noVenta GROUP BY v.noVenta,v.noFactura, v.fechaVenta,c.nombreCompleto,v.totalVenta,v.estadoVenta ORDER BY v.noVenta DESC; ");
        res.status(200).json(rows)

    } catch (error) {
        console.error("Error al obtener ventas", error);
        res.status(500).json({ mensaje: "Error al obtener ventas" });

    }
}
///PENDIENTE LO DE OBTENER DETALLES 
const obtenerDetallesVenta = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.query(
            `SELECT d.idDetalle,
                    CONCAT(p.nombreMedicamento,' ',p.descripcion) AS nombreProducto,
                    cantidad AS vendida,
                    cantidadAnulada AS anulado,
                    (d.cantidad - d.cantidadAnulada) AS final,
                    d.precio,
                    d.subtotal,
                    (d.precio * (d.cantidad - d.cantidadAnulada)) AS subtotalFinal
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
            const { idMedicamento, cantidad } = detalles[i];

            // Validar stock medicamento
            const [medicamento] = await connection.query(
                "SELECT precio, stock FROM medicamentos WHERE idMedicamento = ?",
                [idMedicamento]
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
                "SELECT precio, stock FROM medicamentos WHERE idMedicamento = ?",
                [item.idMedicamento]
            );

            const precio = medicamento[0].precio;
            const subtotal = item.cantidad * precio;


            await connection.query(
                `INSERT INTO detalleVentas 
        (noVenta, idProducto, cantidad, precio, subtotal) 
        VALUES (?, ?, ?, ?, ?)`,
                [noVenta, item.idMedicamento, item.cantidad, precio, subtotal]
            );


            const [updateStock] = await connection.query(
                "UPDATE medicamentos SET stock = stock - ? WHERE idMedicamento = ? AND stock >= ?",
                [item.cantidad, item.idMedicamento, item.cantidad]
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
            fechaVenta: new Date().toLocaleDateString("en-CA")
        });
    } catch (error) {
        console.error("Error en obtenerDatosIniciales:", error);
        res.status(500).json({
            mensaje: "Error al obtener datos iniciales de venta"
        });
    }
};


//Funcion anular Venta
const anularVenta = async (req, res) => {
    const { id } = req.params;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [venta] = await connection.query("SELECT estadoVenta FROM ventas WHERE noVenta = ?",
            [id]);

        if (venta.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "La venta no existe",
            });
        }

        if (venta[0].estado === "Anulada") {
            await connection.rollback();
            return res.status(404).json({
                message: "La venta ya esta anulada",
            });
        }

        const [detalles] = await connection.query("SELECT idProducto, cantidad, cantidadAnulada FROM detalleVentas WHERE noVenta = ?",
            [id]);


        // Devolver SOLO lo que no estaba anulado
        for (const d of detalles) {
            const pendiente = d.cantidad - d.cantidadAnulada;

            if (pendiente > 0) {
                await connection.query(
                    "UPDATE medicamentos SET stock = stock + ? WHERE idMedicamento = ?",
                    [pendiente, d.idProducto]
                );
            }
        }

        // Marcar todo como anulado
        await connection.query(
            "UPDATE detalleVentas SET cantidadAnulada = cantidad WHERE noVenta = ?",
            [id]
        );

        await connection.query(
            "UPDATE ventas SET estadoVenta = 'Anulada' WHERE noVenta = ?",
            [id]
        );

        await connection.commit();

        res.json({
            message: "Venta anulada correctamente",
        });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({
            message: "Error al anular la venta",
            error: error.message,
        });
    }
    finally {
        connection.release();
    }
}




// Funcion anular uno o mas productos de una venta
const anularProductoVenta = async (req, res) => {
    const idUsuario = req.usuario.idUsuario;
    const { idDetalle } = req.params;
    const { cantidadAnular } = req.body;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Obtener detalle
        const [detalle] = await connection.query(
            `SELECT noVenta, idProducto, cantidad, cantidadAnulada
             FROM detalleVentas
             WHERE idDetalle = ? FOR UPDATE`,
            [idDetalle]
        );

        if (detalle.length === 0) {
            throw new Error("El detalle de venta no existe");
        }

        const { noVenta, idProducto, cantidad, cantidadAnulada } = detalle[0];

        // 2. Validar cantidad disponible
        const disponible = cantidad - cantidadAnulada;

        if (!Number.isInteger(cantidadAnular) || cantidadAnular <= 0) {
            throw new Error("Cantidad inválida");
        }

        if (cantidadAnular > disponible) {
            throw new Error("No puedes anular más de lo disponible");
        }

        // 3. Actualizar cantidadAnulada
        await connection.query(
            `UPDATE detalleVentas 
             SET cantidadAnulada = cantidadAnulada + ?
             WHERE idDetalle = ?`,
            [cantidadAnular, idDetalle]
        );

        // 4. Devolver stock
        await connection.query(
            `UPDATE medicamentos 
             SET stock = stock + ?
             WHERE idMedicamento = ?`,
            [cantidadAnular, idProducto]
        );

        // 5. Calcular estado de la venta
        const [estadoData] = await connection.query(
            `SELECT 
                SUM(cantidad) AS total,
                SUM(cantidadAnulada) AS anulados
             FROM detalleVentas
             WHERE noVenta = ?`,
            [noVenta]
        );

        let nuevoEstado = "Completada";

        if (estadoData[0].anulados === estadoData[0].total) {
            nuevoEstado = "Anulada";
        } else if (estadoData[0].anulados > 0) {
            nuevoEstado = "Parcialmente Anulada";
        }

        // 6. Actualizar estado en ventas
        await connection.query(
            "UPDATE ventas SET estadoVenta = ? WHERE noVenta = ?",
            [nuevoEstado, noVenta]
        );

        await connection.commit();

        // 7. Mensaje
        const restante = cantidad - (cantidadAnulada + cantidadAnular);

        const mensaje = restante === 0
            ? "Producto anulado completamente"
            : "Producto anulado parcialmente";

        res.json({
            mensaje,
            noVenta,
            estado: nuevoEstado
        });

    } catch (error) {
        await connection.rollback();

        res.status(400).json({
            mensaje: "Error al anular el producto",
            error: error.message
        });

    } finally {
        connection.release();
    }
};




//Funcion mostrar total ventas del dia
const obtenerTotalVentasDelDia = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT IFNULL( SUM(totalVenta), 0.00) AS ventasDelDia FROM ventas WHERE fechaVenta >= CURDATE() AND fechaVenta < CURDATE() + INTERVAL 1 DAY AND estadoVenta ='Completada'");
        res.json({
            totalVentasDelDia: rows[0].ventasDelDia
        })
    } catch (error) {
        res.status(500).json({ error: "Error al obtener total de ventas al dia" });
    }
}


//Funcion mostrar total todas las ventas 
const obtenerTotalVentas = async (req, res) => {
    try {
        const [rows] = await pool.query(" SELECT IFNULL( SUM(totalVenta), 0.00) AS ventasTotales FROM ventas WHERE estadoVenta ='Completada'");
        res.json({
            totalVentas: rows[0].ventasTotales
        })
    } catch (error) {
        res.status(500).json({ error: "Error al obtener total de ventas" });
    }
}


//************************************************************//
const generarPDFVenta = async (req, res) => {
    const { id } = req.params;

    try {
        const [venta] = await pool.query("SELECT v.noVenta, v.noFactura, v.fechaVenta, c.nombreCompleto, c.nit, v.totalVenta, v.estadoVenta FROM ventas v INNER JOIN clientes c ON v.idCliente = c.idCliente WHERE v.noVenta = ?", [id]);

        if (venta.length === 0) {
            return res.status(404).json({ message: "Venta no encontrada" });
        }

        const fecha = new Date(venta[0].fechaVenta);
        const fechaFormateada = fecha.toLocaleDateString("es-GT");

        const [detalle] = await pool.query(
            "SELECT CONCAT(m.nombreMedicamento,'',m.descripcion) AS medicamento, d.cantidad, d.precio, d.subtotal FROM detalleVentas d INNER JOIN medicamentos m ON d.idProducto = m.idMedicamento WHERE noVenta = ?;", [id]);

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=factura_${id}.pdf`
        );

        doc.pipe(res);

        // 🔹 TÍTULO
        doc
            .font("Helvetica-Bold")
            .fontSize(18)
            .text("FARMACIA EL AHORRO", { align: "center" });

        doc
            .fontSize(15)
            .text("FACTURA", { align: "center" });

        doc.moveDown(2);

        // 🔹 DATOS GENERALES
        doc
            .font("Helvetica")
            .fontSize(12)
            .lineGap(4); // 👈 interlineado

        doc
            .font("Helvetica-Bold")
            .text("No. Venta: ", { continued: true })
            .font("Helvetica")
            .text(venta[0].noVenta);

        doc
            .font("Helvetica-Bold")
            .text("Factura: ", { continued: true })
            .font("Helvetica")
            .text(venta[0].noFactura);

        doc
            .font("Helvetica-Bold")
            .text("Cliente: ", { continued: true })
            .font("Helvetica")
            .text(venta[0].nombreCompleto);

        doc
            .font("Helvetica-Bold")
            .text("NIT: ", { continued: true })
            .font("Helvetica")
            .text(venta[0].nit || "CF");

        doc
            .font("Helvetica-Bold")
            .text("Fecha: ", { continued: true })
            .font("Helvetica")
            .text(fechaFormateada);

        doc.moveDown();

        // 🔹 Línea separadora
        doc.moveTo(50, doc.y)
            .lineTo(550, doc.y)
            .stroke();

        doc.moveDown();

        // 🔹 Encabezado tabla
        doc.fontSize(13).text("DETALLE DE PRODUCTOS");
        doc.moveDown();

        const tableTop = doc.y;

        doc
            .font("Helvetica-Bold")
            .fontSize(11);

        doc.text("Medicamento", 50, tableTop);
        doc.text("Cantidad", 300, tableTop);
        doc.text("Precio", 380, tableTop);
        doc.text("Subtotal", 450, tableTop);

        // 🔹 volver a normal para las filas
        doc.font("Helvetica");

        doc.moveDown();

        let y = doc.y;

        // 🔹 Filas
        detalle.forEach((item) => {
            const subtotal = item.cantidad * item.precio;

            doc.text(item.medicamento, 50, y);
            doc.text(item.cantidad.toString(), 300, y);
            doc.text(`Q${item.precio}`, 380, y);
            doc.text(`Q${subtotal}`, 450, y);

            y += 20;
        });

        doc.moveDown(2);

        // 🔹 Línea antes del total
        doc.moveTo(50, y)
            .lineTo(550, y)
            .stroke();

        doc.moveDown();

        // 🔹 TOTAL
        doc
            .fontSize(12)
            .text(`TOTAL: Q${venta[0].totalVenta}`, 400, y + 20, { align: "right" });

        doc
            .fontSize(12)
            .text("¡Gracias por su compra!", 50, y + 60, { align: "center" });

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error generando PDF" });

    }
}

module.exports = { obtenerVentas, obtenerDetallesVenta, registrarVentas, obtenerDatosIniciales, anularVenta, anularProductoVenta, obtenerTotalVentasDelDia, obtenerTotalVentas, generarPDFVenta };
