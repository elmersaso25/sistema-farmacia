const pool = require("../db");

//Funcion obtener clientes
const obtenerClientes = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT idCliente,nombreCompleto,celular,nit,direccion,fechaRegistro FROM clientes;");
        res.status(200).json(rows);
    }
    catch (error) {
        console.error("Error al obtener clientes", error);
        res.status(500).json({ mensaje: "Error al obtener clientes" });
    }
}

//Funcion obtener clientes por id
const obtenerClientesPorId = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.query("SELECT idCliente,nombreCompleto,celular,nit,direccion,fechaRegistro FROM clientes WHERE idCliente = ?", [id])

        if (rows.length === 0) {
            return res.status(404).json({ mensaje: "Cliente no encontrado" });
        }
        return res.status(200).json(rows[0]);

    } catch (error) {
        console.error("Error al obtener cliente por Id", error);
        res.status(500).json({ mensaje: "Error al obtener cliente por Id" });
    }
}

const registrarClientes = async (req, res) => {
    const { nombreCompleto, celular, nit, direccion } = req.body;
    const errores = {};

    try {
        //validacion campos vacios
        if (!nombreCompleto || !celular || !nit || !direccion) {
            return res.status(400).json({
                errores: { general: "Todos los campos son obligatorios" }
            });
        }

        //validacion celular
        const regexCelular = /^[0-9]{8}$/;
        if (!regexCelular.test(celular)) {
            errores.celular = "El número de celular debe tener 8 dígitos";
        }

        //validacion nit
        const regexNit = /^[0-9]{6,12}(-[0-9])?$/;
        if (!regexNit.test(nit)) {
            errores.nit = "Ingrese un NIT válido";
        }

        if (Object.keys(errores).length > 0) {
            return res.status(400).json({ errores });
        }
        await pool.query("INSERT INTO clientes(nombreCompleto,celular,nit,direccion) VALUES(?,?,?,?)",
            [nombreCompleto, celular, nit, direccion]);

        res.status(200).json({ mensaje: "Cliente registrado correctamente" });

    } catch (error) {
        console.error("Error al registrar cliente", error);
        res.status(500).json({ mensaje: "Error al registrar cliente" });
    }
}

const actualizarClientes = async (req, res) => {
    const { nombreCompleto, celular, nit, direccion } = req.body;
    const { id } = req.params;
    const errores = {};

    try {
        const [rows] = await pool.query(
            "SELECT idCliente FROM clientes WHERE idCliente = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }

        const updates = {};

        // 🔹 Campos de texto simples
        const campos = { nombreCompleto, direccion };

        for (const campo in campos) {
            if (campos[campo] !== undefined) {
                if (campos[campo].trim() === "") {
                    errores[campo] = `El campo ${campo} no puede estar vacío`;
                } else {
                    updates[campo] = campos[campo].trim();
                }
            }
        }

        // 🔹 Celular (solo si viene)
        if (celular !== undefined) {
            const regexCelular = /^[0-9]{8}$/;
            if (celular === "" || !regexCelular.test(celular)) {
                errores.celular = "El número de celular debe tener 8 dígitos";
            } else {
                updates.celular = celular;
            }
        }

        // 🔹 NIT (solo si viene)
        if (nit !== undefined) {
            const regexNit = /^[0-9]{6,12}(-[0-9])?$/;
            if (nit === "" || !regexNit.test(nit)) {
                errores.nit = "Ingrese un NIT válido";
            } else {
                updates.nit = nit;
            }
        }

        if (Object.keys(errores).length > 0) {
            return res.status(400).json({ errores });
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No hay datos para actualizar" });
        }

        await pool.query(
            "UPDATE clientes SET ? WHERE idCliente = ?",
            [updates, id]
        );

        const [updatedCliente] = await pool.query(
            "SELECT idCliente, nombreCompleto, celular, nit, direccion FROM clientes WHERE idCliente = ?",
            [id]
        );

        res.json({
            message: "Cliente actualizado correctamente",
            cliente: updatedCliente[0]
        });

    } catch (error) {
        console.error("Error al actualizar:", error);
        res.status(500).json({ message: "Error al actualizar cliente" });
    }
};


const obtenerTotalClientes = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT COUNT(*) AS totalClientes FROM clientes;");
        res.json({
            totalClientes: rows[0].totalClientes
        });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener el total de clientes" });

    }
}

module.exports = { obtenerClientes, obtenerClientesPorId, registrarClientes, actualizarClientes, obtenerTotalClientes }