import React, { useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";

function ModificarClientes() {
    const navigate = useNavigate();
    const { id } = useParams();
    console.log("id recibido", id);

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
            [e.target.name]: e.target.value
        });
    };

    // ------------------------------
    // CARGAR DATOS DEL USUARIO
    // ------------------------------
    useEffect(() => {
        const obtenerCliente = async () => {
            try {
                const res = await fetch(`http://localhost:3000/clientes/${id}`);
                const data = await res.json();

                setFormData({
                    nombreCompleto: data.nombreCompleto,
                    celular: data.celular,
                    nit: data.nit,
                    direccion: data.direccion
                });

            } catch (error) {
                console.log("Error al cargar los datos", error);
            }
        }
        obtenerCliente();
    }, [id]);

    // ------------------------------
    // ACTUALIZAR CLIENTE
    // ------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = { ...formData };

        try {
            const response = await fetch(`http://localhost:3000/clientes/actualizar/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                setErrores(result.errores);
                return;
            }
            Swal.fire({
                icon: "success",
                title: "Actualización exitosa",
                text: "El cliente fue actualizado correctamente.",
                showConfirmButton: false,
                timer: 2000,
            });
            setErrores("");

        } catch (error) {
            console.error(error);
            alert("Error de conexión con el servidor");
        }
    }


    return (
        <div className="container">
            <div className="p-4">
                <h4 className="mb-3">Modificar Clientes</h4>
                <button className="btn btn-danger" onClick={() => navigate("/clientes")}>Regresar</button>
            </div>
            <div className="d-flex justify-content-center bg-light py-3 ">
                <div className="card shadow-sm" style={{ width: "45rem" }}>
                    <div className="card-body">
                        <div className="mb-3">
                            <h5 className="text-center">Actualiza información de Clientes</h5>
                        </div>
                        <form onSubmit={ handleSubmit}>
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
                                <label className="col-sm-4 col-form-label">Nit</label>
                                <div className="col-sm-8">
                                    <input type="text"
                                        name="nit"
                                        value={formData.nit}
                                        onChange={handleChange}
                                        className="form-control"
                                        required
                                    />
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
                                        required
                                    />
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
    )
}
export default ModificarClientes;
