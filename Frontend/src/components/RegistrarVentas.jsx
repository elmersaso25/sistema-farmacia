import React, { useState, useEffect } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import "../styles/Ventas.css";
import Modal from "../components/Modal";


function RegistrarVentas(){
 const navigate = useNavigate();

  const [noVenta, setNoVenta] = useState("");
  const [noFactura, setNoFactura] = useState("");
  const [fechaVenta, setFechaVenta] = useState("");




  const formatearFecha = (fecha) => {
    console.log("Fecha recibida", fecha)
    if (!fecha) return "";

    const [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio}`;
  };


    return(
        <div className="container-custom">
               <div className="form-altura">
        {/* TU BLOQUE ORIGINAL */}
        <div className="border rounded p-4 bg-light">
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label">No. Venta</label>
              <input type="text" className="form-control border" value={noVenta} readOnly />
            </div>

            <div className="col-md-4">
              <label className="form-label">No. Factura</label>
              <input type="text" className="form-control border" value={noFactura} readOnly />
            </div>

            <div className="col-md-4">
              <label className="form-label">Fecha</label>
              <input type="text" className="form-control border" value={formatearFecha(fechaVenta)} readOnly />
            </div>
          </div>
        </div>
      </div>
        </div>
    );
}

export default RegistrarVentas;