const { json } = require("express");
const pool = require("../db");

//Funcion obtener proveedores
const obtenerProveedores = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT idProveedor,nombreProveedor,telefono,correo,nit,direccion,estado,fechaRegistro FROM proveedores;");
        res.status(200).json(rows);



    } catch (error) {
        console.error("Error al obtener proveedores", error);
        res.status(500).json({ mensaje: "Error al obtener proveedores" });
    }
}

//Funcion obtener proveedores activos
const obtenerProveedoresActivos = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT idProveedor, nombreProveedor FROM proveedores WHERE estado='Activo';");
        res.status(200).json(rows);
    } catch (error) {
         console.error("Error al obtener proveedores Activos", error);
        res.status(500).json({ mensaje: "Error al obtener proveedores activos" });
    }
}

//Funcion obtener proveedor por id
const obtenerProveedoresPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT idProveedor,nombreProveedor,telefono,correo,nit,direccion,estado,fechaRegistro FROM proveedores WHERE idProveedor = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ mensaje: "Proveedor no encontrado" });
        }
        return res.status(200).json(rows[0]);


    } catch (error) {
        console.error("Error al obtener proveedor por Id", error);
        res.status(500).json({ mensaje: "Error al obtener proveedor por Id" });
    }
}

//Funcion para registrar proveedores
const registrarProveedores = async (req, res) => {
    const { nombreProveedor, telefono, correo, nit, direccion } = req.body;
    const errores = {};

    try {
        //Validacion de campos vacios
        if (!nombreProveedor || !telefono || !correo || !nit || !direccion) {
            return res.json({
                errores: { general: "Todos los campos son obligatorios" }
            });
        }

        //validacion telefono
        const regexTelefono = /^[0-9]{8}$/;
        if (!regexTelefono.test(telefono)) {
            errores.telefono = "El número de teléfono debe tener 8 dígitos";
        }

        //validacion nit
        const regexNit = /^[0-9]{6,12}(-[0-9])?$/;
        if (!regexNit.test(nit)) {
            errores.nit = "Ingrese un NIT válido";
        }

        if (Object.keys(errores).length > 0) {
            return res.status(400).json({ errores });
        }

        await pool.query("INSERT INTO proveedores(nombreProveedor,telefono,correo,nit,direccion) VALUES(?,?,?,?,?)",
            [nombreProveedor, telefono, correo, nit, direccion]);

        res.status(200).json({ mensaje: "Proveedor registrado correctamente" });



    } catch (error) {
        console.error("Error al registrar proveedor", error);
        res.status(500).json({ mensaje: "Error al registrar proveedor" });
    }
}

//Funcion para actualizar proveedores
const actualizarProveedores = async (req, res) => {
    const { nombreProveedor, telefono, correo, nit, direccion } = req.body;
    const { id } = req.params;
    const errores = {};

    try {
        const [rows] = await pool.query(
            "SELECT idProveedor FROM proveedores WHERE idProveedor = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Proveedor no encontrado" });
        }

        const updates = {};

        // 🔹 Campos de texto simples
        const campos = { nombreProveedor, correo, direccion };

        for (const campo in campos) {
            if (campos[campo] !== undefined) {
                if (campos[campo].trim() === "") {
                    errores[campo] = `El campo ${campo} no puede estar vacío`;
                } else {
                    updates[campo] = campos[campo].trim();
                }
            }
        }

        // telefono (solo si viene)
        if (telefono !== undefined) {
            const regexTelefono = /^[0-9]{8}$/;
            if (telefono === "" || !regexTelefono.test(telefono)) {
                errores.telefono = "El número de  teléfono debe tener 8 dígitos";
            } else {
                updates.telefono = telefono;
            }
        }

        //Nit (solo si viene)
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
            "UPDATE proveedores SET ? WHERE idProveedor = ?",
            [updates, id]
        );

        const [updatedProveedor] = await pool.query(
            "SELECT idProveedor, nombreProveedor, telefono, correo ,nit, direccion FROM proveedores WHERE idProveedor = ?",
            [id]
        );

        res.json({
            message: "Proveedor actualizado correctamente",
            cliente: updatedProveedor[0]
        });

    } catch (error) {
        console.error("Error al actualizar:", error);
        res.status(500).json({ message: "Error al actualizar proveedor" });
    }
}

//Funcion cambiar estado del proveedor
const cambiarEstado = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    //validacion
    const estadosValidos = ["Activo", "Inactivo"];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
            ok: false,
            message: "El estado debe ser 'Activo' o 'Inactivo'"
        });
    }

    try {
        const [usuario] = await pool.query(
            "SELECT idProveedor FROM proveedores WHERE idProveedor = ?",
            [id]
        )

        if (usuario.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "Proveedor no encontrado"
            });
        }

        // Cambiar estado
        await pool.query(
            "UPDATE proveedores SET estado = ? WHERE idProveedor = ?",
            [estado, id]
        );

        res.json({
            ok: true,
            message: `Estado cambiado a ${estado}`
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: "Error en el servidor" });
    }
}

//Funcion obtener total proveedores registrados//
const obtenerTotalProveedores = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT COUNT(*) AS totalProveedores FROM proveedores;");
        res.json({
            totalProveedores: rows[0].totalProveedores
        });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener el total de proveedores" });

    }
}


module.exports = { obtenerProveedores, obtenerProveedoresActivos, obtenerProveedoresPorId, registrarProveedores, actualizarProveedores, cambiarEstado, obtenerTotalProveedores }