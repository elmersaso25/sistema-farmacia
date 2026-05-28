const PDFDocument = require("pdfkit");
const pool = require("../db");


//Funcion obtener compras
const obtenerCompras = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT c.noCompra, c.noFactura, c.fechaCompra, p.nombreProveedor, c.totalCompra, c.estadoCompra, c.observaciones FROM compras c INNER JOIN proveedores p ON c.idProveedor = p.idProveedor ORDER BY c.noCompra DESC;");
        res.status(200).json(rows)
    } catch (error) {
        console.error("Error al obtener compras", error);
        res.status(500).json({ mensaje: "Error al obtener compras" });
    }
}

const obtenerDetallesCompra = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.query(
            `SELECT d.idDetalle,
                    CONCAT(p.nombreMedicamento,' ',p.descripcion) AS nombreProducto,
                    d.cantidad,
                    d.precio,
                    d.subtotal
             FROM detalleCompras d
             INNER JOIN medicamentos p 
                ON d.idMedicamento = p.idMedicamento
             WHERE d.noCompra = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ mensaje: "No hay detalles para esta compra" });
        }

        res.json(rows); // ✅ ESTO FALTABA

    } catch (error) {
        console.error("Error al obtener detalles de compra", error);
        res.status(500).json({ mensaje: "Error al obtener detalles de compra" });
    }
};



//Funcion registrar compras
const registrarCompras = async (req, res) => {
    const { idProveedor, observaciones, detalles } = req.body;
    const idUsuario = req.usuario.idUsuario;

    if (!Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({ mensaje: 'Datos incompletos' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Validar proveedor exista
        const [proveedor] = await connection.query(
            "SELECT idProveedor FROM proveedores WHERE idProveedor = ?",
            [idProveedor]
        );
        if (proveedor.length === 0) {
            throw new Error('El proveedor no existe');
        }

        let totalCompra = 0;
        let errores = {};

        // ✅ Validar detalles
        for (let i = 0; i < detalles.length; i++) {
            const { idMedicamento, lote, fechaVencimiento, cantidad, precio } = detalles[i];

            // Validar medicamento
            const [medicamento] = await connection.query(
                "SELECT idMedicamento FROM medicamentos WHERE idMedicamento = ?",
                [idMedicamento]
            );

            if (medicamento.length === 0) {
                errores[`detalles.${i}.idMedicamento`] = "El medicamento no existe";
            }

            if (!lote || lote.trim() === "") {
                errores[`detalles.${i}.lote`] = "El lote no puede estar vacío";
            }

            const fechaVence = new Date(fechaVencimiento);
            const hoy = new Date();

            if (isNaN(fechaVence.getTime())) {
                errores[`detalles.${i}.fechaVencimiento`] = "Fecha inválida";
            } else if (fechaVence <= hoy) {
                errores[`detalles.${i}.fechaVencimiento`] = "Debe ser una fecha futura";
            }

            if (!Number.isInteger(cantidad) || cantidad <= 0) {
                errores[`detalles.${i}.cantidad`] = "La cantidad debe ser mayor a 0";
            }

            if (isNaN(precio) || precio <= 0) {
                errores[`detalles.${i}.precio`] = "El precio debe ser mayor a 0";
            }

            // Solo sumar si ese item no tiene error en cantidad/precio
            if (
                !errores[`detalles.${i}.cantidad`] &&
                !errores[`detalles.${i}.precio`]
            ) {
                totalCompra += cantidad * precio;
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
            "SELECT * FROM correlativosFactura WHERE serie = ? AND anio = ? FOR UPDATE",
            [serie, añoActual]
        );

        let noFactura;
        if (correlativo.length > 0) {
            const nuevoNumero = correlativo[0].ultimoNumero + 1;
            noFactura = `${serie}-${añoActual}-${nuevoNumero.toString().padStart(5, '0')}`;

            await connection.query(
                "UPDATE correlativosFactura SET ultimoNumero = ? WHERE id = ?",
                [nuevoNumero, correlativo[0].id]
            );
        } else {
            const nuevoNumero = 1;
            noFactura = `${serie}-${añoActual}-${nuevoNumero.toString().padStart(5, '0')}`;

            await connection.query(
                "INSERT INTO correlativosFactura (serie, anio, ultimoNumero) VALUES (?, ?, ?)",
                [serie, añoActual, nuevoNumero]
            );
        }
        // ===== Insertar compra con fechaCompra automática =====
        const [compraResult] = await connection.query(
            "INSERT INTO compras (idProveedor, totalCompra, observaciones, usuarioRegistro, noFactura, fechaCompra) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
            [idProveedor, totalCompra, observaciones || null, idUsuario, noFactura]
        );

        const noCompra = compraResult.insertId;

        // Insertar detalles y actualizar stock
        for (const item of detalles) {
            const subtotal = item.cantidad * item.precio;

            await connection.query(
                "INSERT INTO detalleCompras (noCompra, idMedicamento, lote, fechaVencimiento, cantidad, precio, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [
                    noCompra,
                    item.idMedicamento,
                    item.lote,
                    item.fechaVencimiento,
                    item.cantidad,
                    item.precio,
                    subtotal
                ]
            );

            // Actualizar stock por cajas/frascos
            await connection.query(
                "UPDATE medicamentos SET stock = stock + ? WHERE idMedicamento = ?",
                [item.cantidad, item.idMedicamento]
            );

            // Obtener porcentaje ganancia
            const [medicamento] = await connection.query(
                "SELECT porcentajeGanancia FROM medicamentos WHERE idMedicamento = ?",
                [item.idMedicamento]
            );

            const porcentajeGanancia = Number(medicamento[0].porcentajeGanancia);

            const precioVenta = Number(
                (item.precio * (1 + porcentajeGanancia / 100)).toFixed(2)
            );

            // ===== ACTUALIZAR PRECIO DEL MEDICAMENTO =====
            await connection.query(
                "UPDATE medicamentos SET precio = ? WHERE idMedicamento = ?",
                [precioVenta, item.idMedicamento]
            );
        }

        await connection.commit();

    res.status(201).json({
        mensaje: 'Compra registrada correctamente',
        noCompra,
        noFactura,
        totalCompra
    });

} catch (error) {
    await connection.rollback();
    res.status(400).json({
        mensaje: 'Error al registrar la compra',
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
        MAX(noCompra) AS ultimaCompra,
        MAX(noFactura) AS ultimaFactura
      FROM compras
    `);

        const ultimaCompra = rows[0].ultimaCompra || 0;
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
            siguienteCompra: ultimaCompra + 1,
            siguienteFactura: noFacturaFormateada,
            fechaCompra: new Date().toLocaleDateString("en-CA")
        });
    } catch (error) {
        console.error("Error en obtenerDatosIniciales:", error);
        res.status(500).json({
            mensaje: "Error al obtener datos iniciales de compra"
        });
    }
};

//Funcion anular compra
const anularCompra = async (req, res) => {
    const { id } = req.params;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [compra] = await connection.query("SELECT estadoCompra FROM compras WHERE noCompra = ?",
            [id]);

        if (compra.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "La compra no existe",
            });
        }

        if (compra[0].estadoCompra === "Anulada") {
            await connection.rollback();
            return res.status(404).json({
                message: "La compra ya esta anulada",
            });
        }

        const [detalles] = await connection.query("SELECT idMedicamento, cantidad FROM detalleCompras WHERE noCompra = ?",
            [id]);


        // 🔒 VALIDAR ANTES DE TOCAR STOCK
        for (const detalle of detalles) {
            const [ventas] = await connection.query(`
        SELECT SUM(cantidad) as totalVendida
        FROM detalleVentas
        WHERE idProducto = ?
    `, [detalle.idMedicamento]);

            if (ventas[0].totalVendida && ventas[0].totalVendida > 0) {
                await connection.rollback();
                return res.status(400).json({
                    message: "No se puede anular la compra, ya se han vendido productos asociados"
                });
            }
        }

        for (const detalle of detalles) {
            await connection.query("UPDATE medicamentos SET stock = stock - ? WHERE idMedicamento = ?",
                [detalle.cantidad, detalle.idMedicamento]);
        }

        await connection.query("UPDATE compras SET estadoCompra = 'Anulada' WHERE noCompra = ?",
            [id]);

        await connection.commit();

        res.json({
            message: "Compra anulada correctamente",
        });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({
            message: "Error al anular la compra",
            error: error.message,
        });
    }
    finally {
        connection.release();
    }
}


//Funcion mostrar total de compras
const obtenerTotalCompras = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT COUNT(*) AS totalCompras FROM compras;");
        res.json({
            totalCompras: rows[0].totalCompras
        });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener el total de compras" });

    }
}

//##############################################################################################
const generarPDFCompra = async (req, res) => {
    const { id } = req.params;

    try {
        const [compra] = await pool.query("SELECT c.noCompra, c.noFactura, c.fechaCompra, p.nombreProveedor, c.totalCompra, c.estadoCompra, c.observaciones FROM compras c INNER JOIN proveedores p ON c.idProveedor = p.idProveedor WHERE c.noCompra = ?", [id]);

        if (compra.length === 0) {
            return res.status(404).json({ message: "Compra no encontrada" });
        }

        const fecha = new Date(compra[0].fechaCompra);
        const fechaFormateada = fecha.toLocaleDateString("es-GT");

        const [detalle] = await pool.query(
            "SELECT CONCAT(m.nombreMedicamento,'',m.descripcion) AS medicamento, d.cantidad, d.precio, d.subtotal FROM detalleCompras d INNER JOIN medicamentos m ON d.idMedicamento = m.idMedicamento WHERE noCompra = ?;", [id]);

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=comprobante_${id}.pdf`
        );

        doc.pipe(res);

        // 🔹 TÍTULO
        doc
            .font("Helvetica-Bold")
            .fontSize(18)
            .text("FARMACIA EL AHORRO", { align: "center" });

        doc
            .fontSize(15)
            .text("COMPROBANTE", { align: "center" });

        doc.moveDown(2);


        // 🔹 DATOS GENERALES
        doc
            .font("Helvetica")
            .fontSize(12)
            .lineGap(4); // 👈 interlineado

        doc
            .font("Helvetica-Bold")
            .text("No. Compra: ", { continued: true })
            .font("Helvetica")
            .text(compra[0].noCompra);

        doc
            .font("Helvetica-Bold")
            .text("Comprante de Compra: ", { continued: true })
            .font("Helvetica")
            .text(compra[0].noFactura);

        doc
            .font("Helvetica-Bold")
            .text("Proveedor: ", { continued: true })
            .font("Helvetica")
            .text(compra[0].nombreProveedor);

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
            .text(`TOTAL COMPRA: Q${compra[0].totalCompra}`, 400, y + 20, { align: "right" });

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error generando PDF" });

    }
}

module.exports = { obtenerCompras, obtenerDetallesCompra, registrarCompras, obtenerDatosIniciales, anularCompra, obtenerTotalCompras, generarPDFCompra };
