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
  const [observaciones, setObservaciones] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [productos, setProductos] = useState([]);


  const [openMiniModal, setOpenMiniModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const [cantidad, setCantidad] = useState("");
  const [precio, setPrecio] = useState("");
  const [lote, setLote] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");

  const [erroresMini, setErroresMini] = useState({});




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
    fetch(`${import.meta.env.VITE_API_URL}/compras/datosIniciales`)
      .then(res => res.json())
      .then(data => {
        setNoCompra(data.siguienteCompra);
        setNoFactura(data.siguienteFactura);
        setFechaCompra(data.fechaCompra);
      })
      .catch(err => console.error("Error:", err));
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/proveedores/activos`)
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
    console.log("Fecha recibida", fecha)
    if (!fecha) return "";

    const [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio}`;
  };



  //Funcion para mostrar segundo modal
  const agregarDetallesProducto = (producto) => {
    setProductoSeleccionado(producto);
    setOpenMiniModal(true);
  };

  // Funcion para guardar producto en memoria
  const guardarProductoMemoria = () => {

    let nuevosErrores = {};

    if (!cantidad || Number(cantidad) <= 0) {
      nuevosErrores.cantidad = "La cantidad debe ser mayor a 0";
    }

    if (!precio || Number(precio) <= 0) {
      nuevosErrores.precio = "El precio debe ser mayor a 0";
    }

    if (!lote || lote.trim() === "") {
      nuevosErrores.lote = "El lote es obligatorio";
    }

    if (!fechaVencimiento) {
      nuevosErrores.fechaVencimiento = "La fecha es obligatoria";
    } else {
      const fecha = new Date(fechaVencimiento);
      const hoy = new Date();

      if (fecha <= hoy) {
        nuevosErrores.fechaVencimiento = "Debe ser una fecha futura";
      }
    }

    // Guardar errores en estado
    setErroresMini(nuevosErrores);

    // Si hay errores, no continuar
    if (Object.keys(nuevosErrores).length > 0) return;

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

    // Limpiar campos
    setCantidad("");
    setPrecio("");
    setLote("");
    setFechaVencimiento("");
    setProductoSeleccionado(null);
    setErroresMini({});

    setOpenMiniModal(false);
    setOpenModal(false);
  };


  useEffect(() => {
    console.log("DETALLES EN MEMORIA:", detalles);
  }, [detalles]);



  //Enviar compra al backend
 const realizarCompra = async () => {
  const token = localStorage.getItem("token");

  if (!idProveedor) {
    Swal.fire("Error", "Seleccione un proveedor", "error");
    console.log("Falta Proveedor");
    return;
  }

  if (detalles.length === 0) {
    Swal.fire("Error", "Debe agregar al menos un producto", "error");
    console.log("Falta detalles de compra");
    return;
  }

  const compra = {
    noCompra,
    noFactura,
    fechaCompra,
    idProveedor,
    observaciones,
    total,
    detalles
  };

  try {
    const resp = await fetch(`${import.meta.env.VITE_API_URL}/compras/registrar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(compra)
    });

    const data = await resp.json();

    if (resp.ok) {
      Swal.fire({
        icon: "success",
        title: "Compra registrada correctamente",
        text: "¿Desea descargar el comprobante?",
        showCancelButton: true,
        confirmButtonText: "Sí, descargar",
        cancelButtonText: "No"
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const resPDF = await fetch(`${import.meta.env.VITE_API_URL}/compras/${data.noCompra}/pdf`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });

            if (!resPDF.ok) throw new Error("Error al descargar PDF");

            const blob = await resPDF.blob();
            const url = window.URL.createObjectURL(blob);

            // Forzar descarga
            const a = document.createElement("a");
            a.href = url;
            a.download = `ComprobanteCompra_${data.noCompra}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            console.log("PDF descargado correctamente");

          } catch (error) {
            console.error("Error al descargar PDF:", error);
            Swal.fire("Error", "No se pudo descargar el PDF", "error");
          }
        }

        // Mantener en el módulo de Compras
        navigate("/registrarCompras");
      });

    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.mensaje || "Error al guardar"
      });

      if (resp.status === 401) {
        setTimeout(() => {
          localStorage.removeItem("token");
          navigate("/");
        }, 2000);
      }
    }

  } catch (error) {
    console.error(error);
    Swal.fire("Error", "No se pudo conectar al servidor", "error");
  }
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
              <label className="form-label">No. Comprobante</label>
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
      <div className="p-4 d-flex align-items-end">

        <button
          className="btn btn-danger me-2"
          onClick={() => navigate("/compras")}
        >
          Regresar
        </button>

        <button
          className="btn btn-primary me-2"
          onClick={() => setOpenModal(true)}
        >
          Agregar
        </button>

        <button
          className="btn btn-success me-3"
          onClick={realizarCompra}
        >
          Realizar Compra
        </button>

        {/* Observaciones */}
        <div style={{ width: "450px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Observaciones de compra (opcional)"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

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
        size="md"
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
        {/* Cantidad */}
        <input
          type="number"
          className={`form-control mb-1 ${erroresMini.cantidad ? "is-invalid" : ""}`}
          placeholder="Cantidad"
          value={cantidad}
          onChange={(e) => {
            setCantidad(e.target.value);
            setErroresMini(prev => ({ ...prev, cantidad: undefined }));
          }}
        />
        {erroresMini.cantidad && <div className="text-danger small">{erroresMini.cantidad}</div>}

        {/* Precio */}
        <input
          type="number"
          className={`form-control mb-1 ${erroresMini.precio ? "is-invalid" : ""}`}
          placeholder="Precio Unitario"
          value={precio}
          onChange={(e) => {
            setPrecio(e.target.value);
            setErroresMini(prev => ({ ...prev, precio: undefined }));
          }}
        />
        {erroresMini.precio && <div className="text-danger small">{erroresMini.precio}</div>}

        {/* Lote */}
        <input
          type="text"
          className={`form-control mb-1 ${erroresMini.lote ? "is-invalid" : ""}`}
          placeholder="Lote"
          value={lote}
          onChange={(e) => {
            setLote(e.target.value);
            setErroresMini(prev => ({ ...prev, lote: undefined }));
          }}
        />
        {erroresMini.lote && <div className="text-danger small">{erroresMini.lote}</div>}

        {/* Fecha de vencimiento */}
        <label>Fecha vencimiento</label>
        <input
          type="date"
          className={`form-control mb-2 ${erroresMini.fechaVencimiento ? "is-invalid" : ""}`}
          value={fechaVencimiento}
          onChange={(e) => {
            setFechaVencimiento(e.target.value);
            setErroresMini(prev => ({ ...prev, fechaVencimiento: undefined }));
          }}
        />
        {erroresMini.fechaVencimiento && (
          <div className="text-danger small">{erroresMini.fechaVencimiento}</div>
        )}

        {/* Botón Guardar */}
        <div className="text-end mt-2">
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
