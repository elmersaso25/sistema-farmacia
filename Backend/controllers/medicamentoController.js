const pool = require("../db");

//Funcion obtener medicamentos
const obtenerMedicamentos = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT idMedicamento,m.codigoMedicamento,m.nombreMedicamento,m.descripcion,m.porcentajeGanancia,m.precio,c.categoria,m.stock,m.estado FROM medicamentos m JOIN categorias c ON m.idCategoria = c.idCategoria");
        res.status(200).json(rows)
    } catch (error) {
        console.error("Error al obtener medicamentos", error);
        res.status(500).json({ mensaje: "Error al obtener medicamentos" });
    }
}

//Funcion obtener medicamento por id
const obtenerMedicamentosPorId = async (req, res) => {
    const { id } = req.params
    try {
        const [rows] = await pool.query("SELECT idMedicamento,codigoMedicamento,nombreMedicamento,descripcion,porcentajeGanancia,idCategoria,stock,estado FROM medicamentos m  WHERE idMedicamento = ?", [id]);
        //Si no existe el medicamento
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: "Medicamento no encontrado" });
        }

        //Enviar el medicamento encontrado
        return res.status(200).json(rows[0]);
    }
    catch (error) {
        console.error("Error al obtener medicamento por Id", error);
        res.status(500).json({ mensaje: "Error al obtener medicamento por Id" });
    }
}

//Funcion buscar medicamento
const buscarMedicamentos = async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ mensaje: "Debe enviar un término de búsqueda" });
    }

    try {
        const [rows] = await pool.query("SELECT idMedicamento, codigoMedicamento, CONCAT(nombreMedicamento, ' ', descripcion) AS medicamento,precio,stock FROM medicamentos WHERE nombreMedicamento LIKE ? OR codigoMedicamento LIKE ?  LIMIT 10",
            [`${q}%`, `${q}%`]
        );

        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error al buscar medicamento", error);
        return res.status(500).json({ mensaje: "Error al buscar medicamento" });
    }
}

//Funcion registrar medicamentos
const registrarMedicamentos = async (req, res) => {
    let { nombreMedicamento, descripcion, ganancia, idCategoria } = req.body
    const errores = {}

    if (nombreMedicamento) nombreMedicamento = nombreMedicamento.trim();
    if (descripcion) descripcion = descripcion.trim();
    if (ganancia) ganancia = ganancia.toString().trim();

    try {


        // VALIDAR SOLO SI GANANCIA FUE ENVIADO
        if (ganancia !== undefined) {
            const regexGanancia = /^[0-9]+(\.[0-9]{1,2})?$/;

            if (ganancia === "" || !regexGanancia.test(ganancia)) {
                errores.ganancia = "Porcentaje ganancia debe ser un número válido (solo números, máximo 2 decimales).";
            } else if (Number(ganancia) <= 0) {
                errores.ganancia = "Porcentaje ganancia debe ser mayor que 0.";
            }
        }


        // Si hay errores, devolverlos todos
        if (Object.keys(errores).length > 0) {
            return res.status(400).json({ errores });
        }

        await pool.query("INSERT INTO medicamentos(nombreMedicamento,descripcion,porcentajeGanancia,idCategoria) VALUES(?,?,?,?)",
            [nombreMedicamento, descripcion, ganancia, idCategoria]);

        res.status(201).json({ mensaje: "Medicamento registrado correctamente" });

    } catch (error) {
        console.error("Error al registrar medicamento", error);
        res.status(500).json({ mensaje: "Error al registrar medicamento" });

    }
}

const actualizarMedicamentos = async (req, res) => {
    let { nombreMedicamento, descripcion, porcentajeGanancia, idCategoria } = req.body;
    const { id } = req.params;
    const errores = {};

    try {
        const [rows] = await pool.query(
            "SELECT idMedicamento FROM medicamentos WHERE idMedicamento = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ mensaje: "Medicamento no encontrado" });
        }

        let updates = {};

        // VALIDACIÓN GENERAL DE CAMPOS VACÍOS
        const campos = { nombreMedicamento, descripcion, idCategoria };

        for (const campo in campos) {

            if (campos[campo] !== undefined) {
                const valor = String(campos[campo]).trim();
                if (valor === "") {
                    errores[campo] =
                        `El campo ${campo} no puede estar vacío`;
                } else {
                    updates[campo] = valor;
                }
            }
        }

        // VALIDAR SOLO SI PRECIO FUE ENVIADO
        if (porcentajeGanancia !== undefined) {
            const regexGanancia = /^[0-9]+(\.[0-9]{1,2})?$/;

            if (porcentajeGanancia === "" || !regexGanancia.test(porcentajeGanancia)) {
                errores.porcentajeGanancia = "Porcentaje ganancia debe ser un número válido (solo números, máximo 2 decimales).";
            } else if (Number(porcentajeGanancia) <= 0) {
                errores.porcentajeGanancia = "Porcentaje ganancia debe ser mayor que 0.";
            } else {
                updates.porcentajeGanancia = Number(porcentajeGanancia);
            }
        }

        // Error si algo vino vacío o incorrecto
        if (Object.keys(errores).length > 0) {
            return res.status(400).json({ errores });
        }

        // Error si no hay campos para actualizar
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No hay datos para actualizar" });
        }

        await pool.query(
            "UPDATE medicamentos SET ? WHERE idMedicamento = ?",
            [updates, id]
        );

        const [updated] = await pool.query(
            "SELECT idMedicamento, nombreMedicamento, descripcion, porcentajeGanancia, idCategoria FROM medicamentos WHERE idMedicamento = ?",
            [id]
        );

        res.json({
            message: "Medicamento actualizado correctamente",
            medicamento: updated[0]
        });

    } catch (error) {
        console.error("ERROR EN ACTUALIZAR:", error);
        res.status(500).json({ message: "Error al actualizar medicamento" });
    }
};

const cambiarEstado = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    //Validacion
    const estadosValidos = ['Activo', 'Inactivo'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
            ok: false,
            message: "El estado debe ser 'Activo' o 'Inactivo'"
        });
    }
    try {
        const [medicamento] = await pool.query("SELECT idMedicamento FROM medicamentos WHERE idMedicamento = ?",
            [id]
        )
        if (medicamento.length === 0) {
            return res.status(404).json({
                ok: "false",
                message: "Medicamento no Encontrado"
            });
        }
        await pool.query("UPDATE medicamentos SET estado = ? WHERE idMedicamento = ?",
            [estado, id]
        );

        res.json({
            ok: true,
            message: `Estado cambiado a ${estado}`
        });
    }

    catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: "Error en el servidor" });
    }
}

const obtenerTotalMedicamentos = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT COUNT(*) AS totalMedicamentos FROM medicamentos;");
        res.json({
            totalMedicamentos: rows[0].totalMedicamentos
        });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener el total de medicamentos" });
    }
}

const obtenerTotalStockMedicamentos = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT IFNULL (SUM(stock), 0) AS stockTotal FROM medicamentos;");
        res.json({
            stockTotal: rows[0].stockTotal
        });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener total stock medicamentos" });
    }
}

const obtenerCategorias = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT idCategoria, categoria FROM categorias");
        res.status(200).json(rows)
    } catch (error) {
        console.error("Error al obtener categorias", error);
        res.status(500).json({ mensaje: "Error al obtener categorias" });
    }
}




module.exports = { obtenerMedicamentos, obtenerMedicamentosPorId, buscarMedicamentos, registrarMedicamentos, actualizarMedicamentos, cambiarEstado, obtenerTotalMedicamentos, obtenerTotalStockMedicamentos, obtenerCategorias };