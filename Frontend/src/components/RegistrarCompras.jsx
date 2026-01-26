import React, { useState, useEffect } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import "../styles/Compras.css";


function RegistrarCompras() {
  const navigate = useNavigate();

  const [noCompra, setNoCompra] = useState("");
  const [noFactura, setNoFactura] = useState("");
  const [fechaCompra, setFechaCompra] = useState("");

  const [detalles, setDetalles] = useState([]);
const [proveedores, setProveedores] = useState([]);
const [idProveedor, setIdProveedor] = useState("");


  const columns = [
    { name: "Producto", selector: (row) => row.producto, sortable: true },
    { name: "Precio compra", selector: (row) => `Q${Number(row.precio).toFixed(2)}`, sortable: true },
    { name: "Cantidad", selector: (row) => row.cantidad, sortable: true },
    { name: "Subtotal", selector: (row) => `Q${Number(row.subtotal).toFixed(2)}`, sortable: true },
    {
      name: "Acción",
      cell: (row, index) => (
        <button
          className="btn btn-sm btn-danger"
          onClick={() =>
            setDetalles(detalles.filter((_, i) => i !== index))
          }
        >
          ❌
        </button>
      ),
    },
  ];

  const customStyles = {
    headCells: {
      style: {
        fontSize: "15px",
        fontWeight: "bold",
      },
    },
    cells: {
      style: {
        fontSize: "14px",
      },
    },
  };

  const total = detalles.reduce((acc, item) => acc + item.subtotal, 0);



  //Fetch de datos de compra
  useEffect(() => {
    fetch("http://localhost:3000/compras/datosIniciales")
      .then(res => res.json())
      .then(data => {
        setNoCompra(data.siguienteCompra);
        setNoFactura(data.siguienteFactura);
        setFechaCompra(data.fechaCompra);
      })
      .catch(err => console.error("Error:", err));
  }, []);

  useEffect(() => {
    fetch("http://localhost:3000/proveedores/activos")
      .then(res => res.json())
      .then(data => {
        setProveedores(data);
      })
      .catch(err => console.error("Error cargando proveedores:", err));
  }, [])

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    const fechaLocal = new Date(fecha);
    return fechaLocal.toLocaleString("es-ES", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      //  hour: "2-digit",
      //  minute: "2-digit"
    });
  };

  return (
    <div className="container-custom">
      <div className="form-altura">
        {/* TU BLOQUE ORIGINAL */}
        <div className="border rounded p-4 bg-light">
          <div className="row g-2 align-items-end">
            <div className="col-md-2">
              <label className="form-label">No. Compra</label>
              <input type="text" className="form-control border" value={noCompra} readOnly />
            </div>

            <div className="col-md-3">
              <label className="form-label">No. Factura</label>
              <input type="text" className="form-control border" value={noFactura} readOnly />
            </div>

            <div className="col-md-3">
              <label className="form-label">Fecha</label>
              <input type="text" className="form-control border" value={formatearFecha(fechaCompra)} readOnly />
            </div>

            <div className="col-md-4">
              <label className="form-label">Proveedor</label>
             <select value={idProveedor} className="form-select border" onChange={e => setIdProveedor(e.target.value)}>
  <option value="">Seleccione un proveedor</option>
  {proveedores.map(prov => (
    <option key={prov.idProveedor} value={prov.idProveedor}>
      {prov.nombreProveedor}
    </option>
  ))}
</select>

            </div>
          </div>
        </div>
      </div>

      {/* TUS BOTONES */}
      <div className="p-4">
        <button className="btn btn-danger me-2" onClick={() => navigate("/compras")}>
          Regresar
        </button>

        <button className="btn btn-primary me-2">
          Agregar
        </button>

        <button className="btn btn-success">
          Realizar Compra
        </button>
      </div>

      {/* TU TABLA, PERO YA PARA DETALLES */}
      <div className="border rounded p-5 bg-light">
        <DataTable
          columns={columns}
          data={detalles}
          pagination
          highlightOnHover
          pointerOnHover
          customStyles={customStyles}
          noDataComponent="No hay productos agregados"
        />

        <div className="d-flex justify-content-end mt-3">
          <h5>Total: Q {total.toFixed(2)}</h5>
        </div>
      </div>

    </div>
  );
}
export default RegistrarCompras;
