const pool = require("../db");
const bcrypt = require('bcrypt');

//Funcion obtener usuario
const obtenerUsuarios = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT u.idUsuario,u.nombreCompleto,u.celular,u.correo,u.estado,r.nombreRol,u.fechaRegistro FROM usuarios u JOIN roles r ON u.idRol = r.idRol;");
        res.status(200).json(rows);

    } catch (error) {
        console.error("Error al obtener usuarios", error);
        res.status(500).json({ mensaje: "Error al obtener usuarios" });
    }
}

//Funcion obtener usuario por Id
const obtenerUsuariosPorId = async (req, res) => {
    const { id } = req.params

    try {
        const [rows] = await pool.query("SELECT u.idUsuario, u.nombreCompleto,u.celular,u.correo,u.estado, u.idRol FROM usuarios u WHERE u.idUsuario = ?", [id]);
        // Si no existe el usuario
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        // Enviar el usuario encontrado
        return res.status(200).json(rows[0]);
    }
    catch (error) {
        console.error("Error al obtener usuario por Id", error);
        res.status(500).json({ mensaje: "Error al obtener usuario por Id" });
    }
}

//Funcion registrar usuarios
const registrarUsuarios = async (req, res) => {
    const { nombreCompleto, celular, correo, contrasenia, idRol } = req.body;
    const errores = {};

    try {
        //Validacion todos los campos son obligatorios
        if (!nombreCompleto || !celular || !correo || !contrasenia || idRol === undefined || idRol === null) {
            return res.status(400).json({
                errores: { general: "Todos los campos son obligatorios" }
            });
        }

        //Validacion celular de 8 digitos
        const regexCelular = /^[0-9]{8}$/;
        if (!regexCelular.test(celular)) {
            errores.celular = "El número de celular debe tener 8 dígitos";
        }


        //Validacion contrasenia segura
        const regexContrasenia = /^(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        if (!regexContrasenia.test(contrasenia)) {
            errores.contrasenia =
                "La contraseña debe tener al menos 8 caracteres, una mayúscula y un carácter especial (@, $, !, %, *, ?, &)";
        }


        const [existeCorreo] = await pool.query(
            "SELECT idUsuario FROM usuarios WHERE correo = ?",
            [correo]
        );

        if (existeCorreo.length > 0) {
            errores.correo = "El correo electrónico ya está registrado";
        }

        const [rolExiste] = await pool.query(
            "SELECT idRol FROM roles WHERE idRol = ?",
            [idRol]
        );

        if (rolExiste.length === 0) {
            errores.idRol = "Rol inválido";
        }

        // Si hay errores, devolverlos todos
        if (Object.keys(errores).length > 0) {
            return res.status(400).json({ errores });
        }

        const contraseniaHash = await bcrypt.hash(contrasenia, 10);

        await pool.query(
            "INSERT INTO usuarios(nombreCompleto,celular,correo,contrasenia,idRol) VALUES(?,?,?,?,?)",
            [nombreCompleto, celular, correo, contraseniaHash, idRol]);

        res.status(201).json({ mensaje: "Usuario registrado correctamente" });


    } catch (error) {
        console.error("Error al registrar usuario", error);
        res.status(500).json({ mensaje: "Error al registrar usuario" });
    }
}

const actualizarUsuarios = async (req, res) => {
    const { nombreCompleto, correo, celular, contrasenia, idRol } = req.body;
    const { id } = req.params;
    const errores = {};

    try {
        // 1. Verificar si el usuario existe
        const [rows] = await pool.query(
            "SELECT idUsuario FROM usuarios WHERE idUsuario = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // 2. Crear objeto dinámico
        let updates = {};

        const campos = { nombreCompleto, correo };

        for (const campo in campos) {
            if (campos[campo] !== undefined) {
                if (campos[campo].trim() === "") {
                    errores[campo] = `El campo ${campo} no puede estar vacío`;
                } else {
                    updates[campo] = campos[campo].trim();
                }
            }
        }



        // 3. Validación de contraseña
        if (contrasenia && contrasenia.trim() !== "") {
            const regexContrasenia =
                /^(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

            if (!regexContrasenia.test(contrasenia)) {
                errores.contrasenia =
                    "La contraseña debe tener al menos 8 caracteres, una mayúscula y un carácter especial (@, $, !, %, *, ?, &)";
            } else {
                // Hashear solo si es válida
                const salt = await bcrypt.genSalt(10);
                const hashed = await bcrypt.hash(contrasenia, salt);
                updates.contrasenia = hashed;
            }
        }

        // Validación celular
        const regexCelular = /^[0-9]{8}$/;
        if (celular !== undefined) {
            if (!regexCelular.test(celular)) {
                errores.celular = "El número de celular debe tener 8 dígitos";
            } else {
                updates.celular = celular;
            }
        }

        if (idRol !== undefined) {
            if (!Number.isInteger(Number(idRol)) || Number(idRol) <= 0) {
                errores.idRol = "El rol enviado no es válido";
            } else {
                updates.idRol = Number(idRol);
            }
        }

        // 📌 Si hay errores de validación, devolverlos todos juntos
        if (Object.keys(errores).length > 0) {
            return res.status(400).json({ errores });
        }

        // 5. Si no se enviaron campos válidos
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No hay datos para actualizar" });
        }

        console.log("updates:", updates);
        // 6. Actualizar usuario
        await pool.query(
            "UPDATE usuarios SET ? WHERE idUsuario = ?",
            [updates, id]
        );

        // 7. Obtener usuario actualizado
        const [updatedUser] = await pool.query(
            "SELECT idUsuario, nombreCompleto, correo, celular, idRol FROM usuarios WHERE idUsuario = ?",
            [id]
        );

        res.json({
            message: "Usuario actualizado correctamente",
            usuario: updatedUser[0]
        });

    } catch (error) {
        console.error("ERROR EN ACTUALIZAR:", error);
        res.status(500).json({ message: "Error al actualizar usuario" });
    }
};


//Funcion cambiar estado del usuario
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
            "SELECT idUsuario FROM usuarios WHERE idUsuario = ?",
            [id]
        )

        if (usuario.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "Usuario no encontrado"
            });
        }

        // Cambiar estado
        await pool.query(
            "UPDATE usuarios SET estado = ? WHERE idUsuario = ?",
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

const obtenerTotalUsuarios = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT COUNT(*) AS totalUsuarios FROM usuarios;");
        res.json({
            totalUsuarios: rows[0].totalUsuarios
        });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener el total de usuarios" });

    }
}

//Funcion para mostrar rol de usuario
const obtenerRoles = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT idRol, nombreRol FROM roles;");
        res.status(200).json(rows);

    } catch (error) {
        res.status(500).json({ error: "Error al obtener roles de usuarios"});
    }
}



module.exports = { obtenerUsuarios, obtenerUsuariosPorId, registrarUsuarios, actualizarUsuarios, cambiarEstado, obtenerTotalUsuarios, obtenerRoles };