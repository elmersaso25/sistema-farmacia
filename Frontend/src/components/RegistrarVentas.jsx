import React, { useState, useEffect, useRef } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import "../styles/Ventas.css";
import Modal from "../components/Modal";


function RegistrarVentas() {
  const navigate = useNavigate();
  const inputNombreRef = useRef(null);

  const [noVenta, setNoVenta] = useState("");
  const [noFactura, setNoFactura] = useState("");
  const [fechaVenta, setFechaVenta] = useState("");
  const [idCliente, setIdCliente] = useState("");
  const [mostrarModalCliente, setMostrarModalCliente] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [productos, setProductos] = useState([]);


  const [nit, setNit] = useState("");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("Ciudad");

  const [cliente, setCliente] = useState(null);
  const [mensajeCliente, setMensajeCliente] = useState("");

  const [detalles, setDetalles] = useState([]);

  const [cantidades, setCantidades] = useState({});



  const manejarCantidad = (id, valor) => {
    setCantidades((prev) => ({
      ...prev,
      [id]: valor
    }));
  };



  const columns = [
    { name: "Producto", selector: (row) => row.medicamento, sortable: true, width: "320px" },
    { name: "Precio", selector: (row) => `Q${Number(row.precio).toFixed(2)}`, sortable: true },
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



  //Fetch de datos de ventas
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/ventas/datosIniciales`)
      .then(res => res.json())
      .then(data => {
        setNoVenta(data.siguienteVenta);
        setNoFactura(data.siguienteFactura);
        setFechaVenta(data.fechaVenta);
      })
      .catch(err => console.error("Error:", err));
  }, []);


  const manejarNitEnter = async () => {
    const valor = nit.trim();

    if (!valor) return console.log("NIT vacío");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/clientes/nit/${valor}`);

      if (res.ok) {
        const data = await res.json();

        setCliente(data);
        setNombre(data.nombreCompleto);
        setDireccion(data.direccion);
        setNit(data.nit);

        console.log("Cliente encontrado:", data);
      }
      else if (res.status === 404) {
        console.log("Cliente no encontrado");

        setCliente(null);
        setNombre("");
        setDireccion("Ciudad");

        setMensajeCliente("Cliente nuevo, ingrese nombre");

        setMostrarModalCliente(true);

        setTimeout(() => {
          inputNombreRef.current?.focus();
        }, 100);
      }
      else {
        console.error("Error inesperado:", res.statusText);
      }

    } catch (error) {
      console.error("Error al buscar cliente:", error);
    }
  };


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



  // Funcion para guardar producto en memoria
  const guardarProductoMemoria = (producto) => {
    const cantidad = parseInt(cantidades[producto.codigoMedicamento] || 1);

    if (cantidad <= 0) return;

    if (cantidad > producto.stock) {
      Swal.fire("Error", "Cantidad supera el stock", "error");
      return;
    }

    setDetalles((prev) => {
      const existe = prev.find(
        (item) => item.idMedicamento === producto.idMedicamento
      );

      if (existe) {
        return prev.map((item) =>
          item.idMedicamento === producto.idMedicamento
            ? {
              ...item,
              cantidad: item.cantidad + cantidad,
              subtotal:
                (item.cantidad + cantidad) * Number(producto.precio),
            }
            : item
        );
      }

      return [
        ...prev,
        {
          idMedicamento: producto.idMedicamento,
          medicamento: producto.medicamento,
          precio: Number(producto.precio),
          cantidad: cantidad,
          subtotal: cantidad * Number(producto.precio),
        },
      ];
    });
  };


  useEffect(() => {
    console.log("DETALLES EN MEMORIA:", detalles);
  }, [detalles]);



  const formatearFecha = (fecha) => {
    if (!fecha) return "";

    const [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio}`;
  };


  //Enviar compra al backend
  const realizarVenta = async () => {
    const token = localStorage.getItem("token");

    if (!cliente) {
      Swal.fire("Error", "Debe seleccionar un cliente", "error");
      return;
    }


    if (detalles.length === 0) {
      Swal.fire("Error", "Debe agregar al menos un producto", "error");
      console.log("Falta detalles de venta");
      return;
    }

    const venta = {
      noVenta,
      noFactura,
      fechaVenta,
      idCliente: cliente?.idCliente,
      total,
      detalles
    };

    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/ventas/registrar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(venta)
      });

      const data = await resp.json();

      if (resp.ok) {
        Swal.fire({
          icon: "success",
          title: "Venta registrada correctamente",
          text: "¿Desea descargar Factura?",
          showCancelButton: true,
          confirmButtonText: "Sí, descargar",
          cancelButtonText: "No"
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              const resPDF = await fetch(`${import.meta.env.VITE_API_URL}/ventas/${data.noVenta}/pdf`, {
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
              a.download = `FacturaVenta_${data.noVenta}.pdf`;
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
          window.location.reload();
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
      {/* TUS BOTONES */}
      <div className="p-4 d-flex align-items-end">
        <button
          className="btn btn-danger me-2"
          onClick={() => navigate("/ventas")}
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
          onClick={realizarVenta}
        >
          Realizar Venta
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
        title="Agregar Productos a la Venta"
        size="md"
        titleSize="22px"
      >
        <div className="container">

          {/* 🔍 BUSCADOR (LO DEJAMOS IGUAL) */}
          <div className="row mb-2">
            <div className="col-12">
              <label>Producto</label>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por código o nombre Producto"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <table className="table table-sm table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th style={{ width: "150px" }}></th>
                  </tr>
                </thead>

                <tbody>
                  {productos.map((p) => (
                    <tr key={p.codigoMedicamento}>
                      <td>{p.codigoMedicamento}</td>
                      <td>{p.medicamento}</td>
                      <td>{p.precio}</td>
                      <td>{p.stock}</td>

                      <td>
                        <div className="d-flex flex-column align-items-end gap-1">

                          <input
                            type="number"
                            min="1"
                            className="form-control form-control-sm"
                            style={{ width: "60%" }}
                            value={cantidades[p.codigoMedicamento] || 1}
                            onChange={(e) =>
                              manejarCantidad(p.codigoMedicamento, e.target.value)
                            }
                          />

                          <button
                            className="btn btn-sm btn-primary"
                            style={{ width: "60%" }}
                            onClick={() => {
                              guardarProductoMemoria(p);
                              setOpenModal(false);
                              setBusqueda("");
                              setCantidades("")
                            }}
                          >
                            Agregar
                          </button>

                        </div>
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

      {mostrarModalCliente && (
        <div className="modal-custom">
          <div className="modal-box p-4">

            <h5 className="mb-3">Datos del Cliente</h5>

            <form
              onSubmit={async (e) => {
                e.preventDefault();

                if (!cliente && nombre.trim() === "") {
                  console.log("Ingrese nombre");
                  return;
                }

                let clienteFinal = cliente;

                try {
                  // 🔥 Si no existe cliente, lo crea
                  if (!clienteFinal) {
                    const nuevoCliente = {
                      nombreCompleto: nombre,
                      nit: nit,
                      direccion: "Ciudad",
                      celular: null
                    };

                    const resCrear = await fetch(
                      `${import.meta.env.VITE_API_URL}/clientes/registrarClientesDesdeVentas`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(nuevoCliente),
                      }
                    );

                    if (resCrear.ok) {
                      clienteFinal = await resCrear.json();
                      setCliente(clienteFinal);
                    } else {
                      console.error("Error al crear cliente");
                      return;
                    }
                  }

                  console.log("Cliente a utilizar:", clienteFinal);

                  setMostrarModalCliente(false);

                } catch (error) {
                  console.error(error);
                }
              }}
            >

              {/* NIT */}
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Ingrese NIT o CF"
                value={nit}
                autoFocus
                onChange={(e) => setNit(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!cliente) {
                      await manejarNitEnter();
                    } else {
                      e.target.form.requestSubmit();
                    }
                  }
                }}
              />

              {/* MENSAJE */}
              <small className="text-danger d-block mt-1">
                {mensajeCliente}
              </small>

              {/* Nombre */}
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                ref={inputNombreRef}
              />

              {/* Dirección */}
              <input
                type="text"
                className="form-control mb-3"
                placeholder="Dirección"
                value={direccion}
                readOnly
              />

              {/* Botones */}
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setMostrarModalCliente(false)}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn btn-success">
                  Aceptar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegistrarVentas;