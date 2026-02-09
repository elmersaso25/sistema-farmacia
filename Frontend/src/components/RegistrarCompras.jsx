import React, { useState, useEffect } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import "../styles/Compras.css";
import Modal from "../components/Modal";



function RegistrarCompras() {
  const navigate = useNavigate();

  const [noCompra, setNoCompra] = useState("");
  const [noFactura, setNoFactura] = useState("");
  const [fechaCompra, setFechaCompra] = useState("");

  const [detalles, setDetalles] = useState([]);
const [proveedores, setProveedores] = useState([]);
const [idProveedor, setIdProveedor] = useState("");

const [openModal, setOpenModal] = useState(false);
const [busqueda, setBusqueda] = useState("");
const [productos, setProductos] = useState([]);


const [openMiniModal, setOpenMiniModal] = useState(false);
const [productoSeleccionado, setProductoSeleccionado] = useState(null);

const [cantidad, setCantidad] = useState("");
const [precio, setPrecio] = useState("");
const [lote, setLote] = useState("");
const [fechaVencimiento, setFechaVencimiento] = useState("");





  const columns = [
    { name: "Producto", selector: (row) => row.medicamento, sortable: true, width: "270px" },
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

  useEffect(() => {
  if (busqueda.trim().length < 2) {
    setProductos([]);
    return;
  }

  const buscarProductos = async () => {
    try {
      const resp = await fetch(
        `http://localhost:3000/medicamentos/buscar?q=${busqueda}`
      );

      if (!resp.ok) {
        throw new Error("Error al buscar productos");
      }

      const data = await resp.json();
      setProductos(data);
    } catch (error) {
      console.error(error);
      setProductos([]);
    }
  };
  buscarProductos();
}, [busqueda]);

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

  //Funcion para mostrar segundo modal
  const agregarDetallesProducto = (producto) => {
  setProductoSeleccionado(producto);
  setOpenMiniModal(true);
};

//Funcion para guardar producto en memoria
const guardarProductoMemoria = () => {
  if (!cantidad || !precio || !lote || !fechaVencimiento) {
    alert("Complete todos los campos");
    return;
  }

  const nuevoDetalle = {
    idMedicamento: productoSeleccionado.idMedicamento,
    medicamento: productoSeleccionado.medicamento,
    cantidad: Number(cantidad),
    precio: Number(precio),
    lote,
    fechaVencimiento,
    subtotal: Number(cantidad) * Number(precio)
  };

  setDetalles(prev => [...prev, nuevoDetalle]);

  // limpiar estados
  setCantidad("");
  setPrecio("");
  setLote("");
  setFechaVencimiento("");
  setProductoSeleccionado(null);

  setOpenMiniModal(false);
  setOpenModal(false);
};

useEffect(() => {
  console.log("DETALLES EN MEMORIA:", detalles);
}, [detalles]);



 

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
  <option value="" disabled>Seleccione un proveedor</option>
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

        <button className="btn btn-primary me-2"  onClick={() => setOpenModal(true)}>
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

<Modal
  isOpen={openModal}
  onClose={() => setOpenModal(false)}
  title="Agregar Productos a la Compra"
    size ="md"
    titleSize="22px">
    <div className="container">
        <div className="row">
          <div className="col-12">
            <label htmlFor="">Producto</label>
            <input type="text" className="form-control" placeholder="Buscar por código o nombre Producto" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
        </div>
        {/* TABLA DE RESULTADOS */}
    <div className="row">
      <div className="col-12">
        <table className="table table-sm table-hover">
          <thead className="table-light">
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.codigoMedicamento}>
                <td>{p.codigoMedicamento}</td>
                <td>{p.medicamento}</td>

                <td>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => agregarDetallesProducto(p)}
                  >
                    Agregar
                  </button>
                </td>
              </tr>
            ))}

            {productos.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center text-muted">
                  No hay resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
</Modal>


<Modal
  isOpen={openMiniModal}
  onClose={() => setOpenMiniModal(false)}
  title="Detalles del producto"
  size="sm"
  titleSize="20px"
>
  <input
    type="number"
    className="form-control mb-2"
    placeholder="Cantidad"
    value={cantidad}
    onChange={(e) => setCantidad(e.target.value)}
  />

  <input
    type="number"
    className="form-control mb-2"
    placeholder="Precio Unitario"
    value={precio}
    onChange={(e) => setPrecio(e.target.value)}
  />

  <input
    type="text"
    className="form-control mb-2"
    placeholder="Lote"
    value={lote}
    onChange={(e) => setLote(e.target.value)}
  />

  <label>Fecha vencimiento</label>
  <input
    type="date"
    className="form-control mb-3"
    value={fechaVencimiento}
    onChange={(e) => setFechaVencimiento(e.target.value)}
  />

  <div className="text-end">
    <button
      type="button"
      className="btn btn-success btn-sm"
      onClick={guardarProductoMemoria}
    >
      Guardar
    </button>
  </div>
</Modal>


    </div>
  );
}

export default RegistrarCompras;
