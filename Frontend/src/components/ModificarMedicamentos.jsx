import React, { useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";

function ModificarMedicamentos() {
    const navigate = useNavigate();
    const { id } = useParams();
    console.log("id recibido:", id);

    const [formData, setFormData] = useState({
        nombreMedicamento: "",
        descripcion: "",
        precio: "",
        categoria: ""
    });

    const [errores, setErrores] = useState({});

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // ------------------------------
    // CARGAR DATOS DEL MEDICAMENTO
    // ------------------------------
    useEffect(() => {
        const obtenerMedicamento = async () => {
            try {
                const res = await fetch(`http://localhost:3000/medicamentos/${id}`);
                const data = await res.json();

                setFormData({
                    nombreMedicamento: data.nombreMedicamento,
                    descripcion: data.descripcion,
                    precio: data.precio,
                    categoria: data.categoria
                })


            }
            catch (error) {
                console.log("Error al cargar los datos", error);
            }
        }
        obtenerMedicamento();
    }, [id]);

    // ------------------------------
    // ACTUALIZAR MEDICAMENTO    
    // ------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = { ...formData };


        try {
            const response = await fetch(`http://localhost:3000/medicamentos/actualizar/${id}`, {
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
                text: "El medicamento fue actualizado correctamente.",
                showConfirmButton: false,
                timer: 2000,
            });
            setErrores("");

        }
        catch (error) {
            console.error(error);
            alert("Error de conexión con el servidor");
        }
    }

    return (
        <div className="container">
            <div className="p-4">
                <h4 className="mb-3">Modificar Medicamento</h4>
                <button className="btn btn-danger" onClick={() => navigate("/medicamentos")}>Regresar</button>
            </div>

            <div className="d-flex justify-content-center bg-light py-3 ">
                <div className="card shadow-sm" style={{ width: "45rem" }}>
                    <div className="card-body">
                        <div className="mb-3">
                            <h5 className="text-center">Actualiza información de Medicamentos</h5>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-4 col-form-label">Nombre Medicamento</label>
                                <div className="col-sm-8">
                                    <input type="text"
                                        value={formData.nombreMedicamento}
                                        onChange={handleChange}
                                        name="nombreMedicamento"
                                        className="form-control"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-4 col-form-label">Descripción</label>
                                <div className="col-sm-8">
                                    <textarea type="textarea"
                                        value={formData.descripcion}
                                        onChange={handleChange}
                                        name="descripcion"
                                        className="form-control"
                                        rows="3"
                                        style={{ resize: "none" }}
                                        required >
                                    </textarea>

                                </div>
                            </div>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-4 col-form-label">Precio</label>
                                <div className="col-sm-8">
                                    <input type="text"
                                        value={formData.precio}
                                        onChange={handleChange}
                                        name="precio"
                                        className="form-control"
                                        required
                                    />
                                    {errores.precio && (
                                        <small className="text-danger">{errores.precio}</small>
                                    )}
                                </div>
                            </div>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-4 col-form-label">Categoría</label>
                                <div className="col-sm-8">
                                    <input type="text"
                                        value={formData.categoria}
                                        onChange={handleChange}
                                        name="categoria"
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
    );
}
export default ModificarMedicamentos;