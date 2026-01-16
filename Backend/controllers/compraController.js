const pool = require("../db");

//Funcion obtener compras
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

        // Validar detalles y calcular total
        for (const item of detalles) {
            const { idMedicamento, lote, fechaVencimiento, cantidad, precio } = item;

            // Validar medicamento
            const [medicamento] = await connection.query(
                "SELECT idMedicamento FROM medicamentos WHERE idMedicamento = ?",
                [idMedicamento]
            );
            if (medicamento.length === 0) throw new Error('Uno de los medicamentos no existe');

            if (!lote || lote.trim() === '') throw new Error('El lote no puede estar vacío');

            const fechaVence = new Date(fechaVencimiento);
            const hoy = new Date();
            if (isNaN(fechaVence.getTime())) throw new Error('Fecha de vencimiento inválida');
            if (fechaVence <= hoy) throw new Error('La fecha de vencimiento debe ser futura');

            if (!Number.isInteger(cantidad) || cantidad <= 0)
                throw new Error('La cantidad debe ser un número entero mayor a 0');

            if (isNaN(precio) || precio <= 0) throw new Error('El precio debe ser mayor a 0');

            totalCompra += cantidad * precio;
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
        res.status(500).json({
            mensaje: 'Error al registrar la compra',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

module.exports = { registrarCompras };
