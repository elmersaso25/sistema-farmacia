import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";

function RegistrarClientes() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nombreCompleto: "",
        celular: "",
        nit: "",
        direccion: ""
    });

    const [errores, setErrores] = useState({});

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrores("");

        try {
            const res = await fetch("http://localhost:3000/clientes/registrar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                setErrores({});
                Swal.fire({
                    icon: "success",
                    title: "Registro exitoso",
                    text: "El cliente fue registrado correctamente.",
                    showConfirmButton: false,
                    timer: 2000,
                });
                setFormData({
                    nombreCompleto: "",
                    celular: "",
                    nit: "",
                    direccion: "",
                });
            }

            // 🔹 Si el backend devuelve varios errores
            else if (data.errores) {
                if (data.errores.general) {
                    Swal.fire({
                        icon: "warning",
                        title: "Upss... Algo salió mal",
                        text: data.errores.general,
                        confirmButtonText: "Entendido",
                    });
                }

                // Muestra errores específicos bajo los inputs
                setErrores({
                    celular: data.errores.celular || "",
                    nit: data.errores.nit || ""
                });
            }
            // 🔹 Si el backend solo devuelve un mensaje simple (sin objeto "errores")
            else {
                if (data.mensaje?.toLowerCase().includes("celular")) {
                    setErrores({ celular: data.mensaje });
                } else if (data.mensaje?.toLowerCase().includes("nit")) {
                    setErrores({ nit: data.mensaje });

                } else {
                    Swal.fire("Error", data.mensaje || "No se pudo registrar", "error");
                }
            }

        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error de conexión",
                text: "No se pudo conectar con el servidor.",
                confirmButtonText: "Aceptar",
            });
            console.error(error);
        }
    }

    return (
        <div className="container">
             <div className="p-4">
                <h4 className="mb-3">Registrar Cliente Nuevo</h4>
                <button className="btn btn-danger" onClick={() => navigate("/clientes")}>Regresar</button>
            </div>

             <div className="d-flex justify-content-center bg-light py-3 ">

                <div className="card shadow-sm" style={{ width: "45rem" }}>

                    <div className="card-body">
                        <div className="mb-3">
                            <h5 className="text-center">Completa todos los campos</h5>
                        </div>
                        <form onSubmit={handleSubmit} >
                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-4 col-form-label">Nombre Completo</label>
                                <div className="col-sm-8">
                                    <input type="text"
                                        name="nombreCompleto"
                                        value={formData.nombreCompleto}
                                        onChange={handleChange}
                                        className="form-control"
                                        required />
                                </div>
                            </div>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-4 col-form-label">Celular</label>
                                <div className="col-sm-8">
                                    <input type="tel"
                                        name="celular"
                                        value={formData.celular}
                                        onChange={handleChange}
                                        className="form-control"
                                        required />
                                    {errores.celular && (
                                        <small className="text-danger">{errores.celular}</small>
                                    )}
                                </div>
                            </div>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-4 col-form-label">Nit</label>
                                <div className="col-sm-8">
                                    <input type="text"
                                        name="nit"
                                        value={formData.nit}
                                        onChange={handleChange}
                                        className="form-control"
                                        required />
                                         {errores.nit && (
                                        <small className="text-danger">{errores.nit}</small>
                                    )}   
                                </div>
                            </div>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-4 col-form-label">Dirección</label>
                                <div className="col-sm-8">
                                    <input type="text"
                                        name="direccion"
                                        value={formData.direccion}
                                        onChange={handleChange}
                                        className="form-control"
                                        required />
                                </div>
                            </div>

                            <div className="text-center">
                                <button className="btn btn-primary">Registrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default RegistrarClientes;
