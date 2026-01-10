import React, { useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";

function ModificarUsuarios() {
    const navigate = useNavigate();
    const { id } = useParams();
    console.log("id recibido:", id);

    const [formData, setFormData] = useState({
        nombreCompleto: "",
        celular: "",
        correo: "",
        contrasenia: ""
    });

    const [mensaje, setMensaje] = useState("");
    const [errores, setErrores] = useState({});

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // ------------------------------
    // CARGAR DATOS DEL USUARIO
    // ------------------------------
    useEffect(() => {
        const obtenerUsuario = async () => {
            try {
                const res = await fetch(`http://localhost:3000/usuarios/${id}`);
                const data = await res.json();

                // NO cargar la contraseña encriptada
                setFormData({
                    nombreCompleto: data.nombreCompleto,
                    celular: data.celular,
                    correo: data.correo,
                    contrasenia: "" // siempre vacía para evitar enviar hash
                });
            }
            catch (error) {
                console.error("Error al cargar los datos", error);
            }
        }
        obtenerUsuario();
    }, [id]);

    // ------------------------------
    // ACTUALIZAR USUARIO
    // ------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();

        const dataToSend = { ...formData };

        // No enviar contraseña si está vacía
        if (!dataToSend.contrasenia || dataToSend.contrasenia.trim() === "") {
            delete dataToSend.contrasenia;
        }

        try {
            const response = await fetch(`http://localhost:3000/usuarios/actualizar/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json().catch(() => ({}));

           if (!response.ok) {
            setErrores(data.errores); 
            return;
        }

            Swal.fire({
                icon: "success",
                title: "Actualización exitosa",
                text: "El usuario fue actualizado correctamente.",
                showConfirmButton: false,
                timer: 2000,
            });
            setErrores("");

        } catch (error) {
            console.error(error);
            alert("Error de conexión con el servidor");
        }
    };

    return (
        <div className="container">
            <div className="p-4">
                <h4 className="mb-3">Modificar Usuario</h4>
                <button className="btn btn-danger" onClick={() => navigate("/usuarios")}>Regresar</button>
            </div>

            <div className="d-flex justify-content-center bg-light py-3 ">
                <div className="card shadow-sm" style={{ width: "45rem" }}>
                    <div className="card-body">
                        <div className="mb-3">
                            <h5 className="text-center">Actualiza información de Usuarios</h5>
                        </div>
                        <form onSubmit={handleSubmit}>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-4 col-form-label">Nombre Completo</label>
                                <div className="col-sm-8">
                                    <input type="text"
                                        name="nombreCompleto"
                                        value={formData.nombreCompleto}
                                        onChange={handleChange}
                                        className="form-control"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-4 col-form-label">Celular</label>
                                <div className="col-sm-8">
                                    <input type="text"
                                        name="celular"
                                        value={formData.celular}
                                        onChange={handleChange}
                                        className="form-control"
                                        required
                                    />
                                    {errores.celular && (
                                        <small className="text-danger">{errores.celular}</small>
                                    )}
                                </div>
                            </div>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-4 col-form-label">Correo Electrónico</label>
                                <div className="col-sm-8">
                                    <input type="email"
                                        name="correo"
                                        value={formData.correo}
                                        onChange={handleChange}
                                        className="form-control"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-4 col-form-label">Contraseña</label>
                                <div className="col-sm-8">
                                    <input type="password"
                                        name="contrasenia"
                                        placeholder="Nueva contraseña (opcional)"
                                        onChange={handleChange}
                                        className="form-control"
                                    />
                                     {errores.contrasenia && (
                                        <small className="text-danger">{errores.contrasenia}</small>
                                    )}
                                </div>
                            </div>

                            <div className="text-center">
                                <button className="btn btn-primary">Actualizar</button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );

}

export default ModificarUsuarios;
