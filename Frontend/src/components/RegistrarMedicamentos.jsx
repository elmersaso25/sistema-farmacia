import React, { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function RegistrarMedicamentos() {
    const navigate = useNavigate();

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
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrores({});

        try{
            const res = await fetch("http://localhost:3000/medicamentos/registrar", {
                method: "POST",
                headers: {"Content-Type": "Application/json"},
                body: JSON.stringify(formData),
            });
            const data = await res.json();

             if (res.ok) {
                  setErrores({});
                  Swal.fire({
                    icon: "success",
                    title: "Registro exitoso",
                    text: "El medicamento fue registrado correctamente.",
                    showConfirmButton: false,
                    timer: 2000,
                  });
                  setFormData({
                    nombreMedicamento: "",
                    descripcion: "",
                    precio: "",
                    categoria: "",
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
                        precio: data.errores.precio || ""
                      });
                    } 
                    // 🔹 Si el backend solo devuelve un mensaje simple (sin objeto "errores")
                    else {
                      if (data.mensaje?.toLowerCase().includes("precio")) {
                        setErrores({ precio: data.mensaje });
                     
                      } else {
                        Swal.fire("Error", data.mensaje || "No se pudo registrar", "error");
                      }
                    }

        }catch(error){
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
                <h4 className="mb-3">Registrar Medicamento Nuevo</h4>
                <button className="btn btn-danger" onClick={() => navigate("/medicamentos")}>Regresar</button>
            </div>

            <div className="d-flex justify-content-center bg-light py-3 ">
                <div className="card shadow-sm" style={{ width: "45rem" }}>
                    <div className="card-body">
                        <div className="mb-3">
                            <h5 className="text-center">Completa todos los campos</h5>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-4 col-form-label">Nombre Medicamento</label>
                                <div className="col-sm-8">
                                    <input type="text"
                                        name="nombreMedicamento"
                                        value={formData.nombreMedicamento}
                                        onChange={handleChange}
                                        className="form-control"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row mb-3 align-items-center">
                                <label className="col-sm-4 col-form-label">Descripción</label>
                                <div className="col-sm-8">
                                    <textarea type="textarea"
                                        name="descripcion"
                                        value={formData.descripcion}
                                        onChange={handleChange}
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
                                        name="precio"
                                        value={formData.precio}
                                        onChange={handleChange}
                                        className="form-control"
                                        step="0.01"
                                        min="0"
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
                                        name="categoria"
                                        value={formData.categoria}
                                        onChange={handleChange}
                                        className="form-control"
                                        required
                                    />
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
    );
}

export default RegistrarMedicamentos;