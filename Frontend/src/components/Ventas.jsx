import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import "../styles/Ventas.css";
import Modal from "../components/Modal";
import { FaEye } from "react-icons/fa";
import { BsXCircle } from "react-icons/bs";

function Ventas() {
    const [ventas, setVentas] = useState([]);
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState("");
    const navigate = useNavigate();

    const [mostrarModal, setMostrarModal] = useState(false);
    const [detallesVenta, setDetallesVenta] = useState([]);


    const [mostrarModalAnular, setMostrarModalAnular] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [cantidadAnular, setCantidadAnular] = useState("");


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


    //Funcion ver detalles
    const verDetalles = async (idVenta, venta) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/ventas/detalles/${idVenta}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            if (response.status === 401) {
                Swal.fire({
                    icon: "warning",
                    title: "Sesión expirada",
                    text: "Inicia sesión nuevamente",
                }).then(() => {
                    localStorage.removeItem("token");
                    navigate("/login");
                });
                return;
            }
            const data = await response.json();
            setVentaSeleccionada(venta);
            setDetallesVenta(data);
            setMostrarModal(true);

        } catch (error) {
            console.error("Error al obtener detalles:", error);
        }
    };


    //Funcion anular venta
    const anularVenta = async (idVenta) => {

        const confirmacion = await Swal.fire({
            title: "¿Anularventa?",
            text: "Esta acción no se puede deshacer",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, anular",
            cancelButtonText: "Cancelar"
        });

        if (!confirmacion.isConfirmed) return;

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/ventas/anular/${idVenta}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            if (response.status === 401) {
                Swal.fire({
                    icon: "warning",
                    title: "Sesión expirada",
                    text: "Inicia sesión nuevamente",
                }).then(() => {
                    localStorage.removeItem("token");
                    navigate("/login");
                });
                return;
            }

            if (!response.ok) {
                throw new Error("Error al anular la venta");
            }

            await obtenerVentas();

            Swal.fire({
                icon: "success",
                title: "Venta anulada",
                text: "Venta anulada correctamente",
                timer: 1500,
                showConfirmButton: false
            });

        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.message
            });
        } finally {
            setLoadingId(null);
        }
    }


    const confirmarAnulacionProducto = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/ventas/anularProductoVenta/${productoSeleccionado.idDetalle}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({
                            cantidadAnular: Number(cantidadAnular)
                    })
                }
            );

            if (!response.ok) {
                throw new Error("Error al anular producto");
            }

            Swal.fire({
                icon: "success",
                title: "Producto anulado correctamente",
                timer: 1500,
                showConfirmButton: false
            });

            setMostrarModalAnular(false);
            setCantidadAnular("");

            // Recargar detalles
            verDetalles(ventaSeleccionada.noVenta, ventaSeleccionada);

        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.message
            });
        }
    };




    //Tabla para mostrar las ventas
    const columns = [
        { name: "No.", selector: (row) => row.noVenta, sortable: true, width: "100px", wrap: false },

        { name: "Factura", selector: (row) => row.noFactura, sortable: true, width: "150px", wrap: false },

        { name: "Fecha", selector: (row) => formatearFecha(row.fechaVenta), sortable: true, width: "150px", wrap: false },

        { name: "Cliente", selector: (row) => row.nombreCompleto, sortable: true, width: "250px", wrap: false },

        { name: "Total", selector: (row) => `Q${Number(row.totalVenta).toFixed(2)}`, sortable: true, width: "150px", wrap: false },

        { name: "Estado", selector: (row) => row.estadoVenta, sortable: true, width: "150px", wrap: false },


        {
            name: "Acciones", cell: (row) => <div style={{ display: "flex", gap: "6px" }}>
                <Link className="btn btn-sm btn-primary" title="Ver detalles" onClick={() => verDetalles(row.noVenta, row)}>
                    <FaEye size={20} />
                </Link>
                <Link
                    className={`btn btn-sm ${row.estadoVenta === "Anulada"
                        ? "btn-danger"
                        : "btn-danger"
                        }`}
                    title={
                        row.estadoVenta === "Anulada"
                            ? "Venta anulada"
                            : "Anular Venta"
                    }
                    onClick={() => {
                        if (row.estadoVenta !== "Anulada") {
                            anularVenta(row.noVenta);
                        }
                    }}
                    style={{
                        pointerEvents: row.estadoVenta === "Anulada" ? "none" : "auto",
                        opacity: row.estadoVenta === "Anulada" ? 0.6 : 1
                    }}
                >
                    <BsXCircle size={20} />
                </Link>
            </div >
        }
    ];



    const obtenerVentas = async () => {
        console.log("1️⃣ Componente Ventas montado");

        try {
            const token = localStorage.getItem("token");
            console.log("3️⃣ Token obtenido");
            console.log(token);
            console.log("4️⃣ Antes del fetch");

            if (!token) {
                console.log("❌ No hay token en localStorage");
                setLoading(false);
                return;
            }

            console.log("4️⃣ Antes del fetch");

            const response = await fetch(`${import.meta.env.VITE_API_URL}/ventas`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            console.log("Status:", response.status);
            console.log("OK:", response.ok);

            if (response.status === 401) {
                console.log("❌ Token inválido o expirado");

                Swal.fire({
                    icon: "warning",
                    title: "Sesión expirada",
                    text: "Tu sesión ha expirado. Inicia sesión nuevamente.",
                }).then(() => {
                    localStorage.removeItem("token");
                    navigate("/");
                });

                setLoading(false);
                return;
            }

            const data = await response.json();
            console.log("7️⃣ Data recibida:", data);

            setVentas(data);

        } catch (error) {
            console.log("🔥 Error en fetch:", error);
        } finally {
            console.log("8️⃣ Finalizó fetch");
            setLoading(false);
        }
    }

    useEffect(() => {
        obtenerVentas();
    }, []);


    //Filtrado por búsqueda
    const text = filterText.trim();

    let filteredItems = ventas;

    if (text) {
        // 1️⃣ Buscar coincidencia exacta en número de compra
        const porNumero = ventas.filter(
            (item) => String(item.noVenta) === text
        );

        if (porNumero.length > 0) {
            filteredItems = porNumero;
        } else {
            // 2️⃣ Si no encontró número exacto, buscar en factura
            filteredItems = ventas.filter((item) =>
                String(item.noFactura ?? "")
                    .toLowerCase()
                    .includes(text.toLowerCase())
            );
        }
    }

    // Estilos personalizados
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


    const totalDetalles = detallesVenta.reduce((acc, item) => {
        return acc + Number(item.subtotal);
    }, 0);

    const ventaAnulada = ventaSeleccionada?.estadoVenta === "Anulada";



    return (
        <div className="container-custom">
            <div className="p-4">
                <h4 className="mb-3">Ventas Registradas</h4>
                <button className="btn btn-primary" onClick={() => navigate("/registrarVentas")}>Crear Venta</button>
            </div>

            {/* Buscador */}
            <input
                type="text"
                placeholder="Buscar por número de venta o factura"
                className="form-control mb-3"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
            />

            {/* Tabla */}
            <DataTable
                columns={columns}
                data={filteredItems}
                progressPending={loading}
                pagination
                highlightOnHover
                pointerOnHover
                customStyles={customStyles}

                paginationComponentOptions={{
                    rowsPerPageText: "Filas por página",
                    rangeSeparatorText: "de",
                    selectAllRowsItem: true,
                    selectAllRowsItemText: "Todos",
                }}
                paginationRowsPerPageOptions={[5, 10, 25, 50]}
                paginationPerPage={5}

                noDataComponent="No hay ventas para mostrar"
            />

            <Modal
                isOpen={mostrarModal}
                onClose={() => setMostrarModal(false)}
                title="Detalles de la Compra"
                size="md"
                titleSize="18px"
            >
                {detallesVenta.length === 0 ? (
                    <p>No hay detalles para esta compra</p>
                ) : (
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Precio</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detallesVenta.map((detalle) => (

                                <tr key={detalle.idDetalle}>
                                    <td>{detalle.nombreProducto}</td>
                                    <td>{detalle.cantidad}</td>
                                    <td>Q{detalle.precio}</td>
                                    <td>Q{detalle.subtotal}</td>


                                    <td>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            title={ventaAnulada ? "Venta anulada" : "Anular producto"}
                                            onClick={() => {
                                                if (!ventaAnulada) {
                                                    setProductoSeleccionado(detalle);
                                                    setMostrarModalAnular(true);
                                                }
                                            }}
                                            disabled={ventaAnulada}
                                            style={{
                                                opacity: ventaAnulada ? 0.5 : 1,
                                                cursor: ventaAnulada ? "not-allowed" : "pointer"
                                            }}
                                        >
                                            <BsXCircle size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            <tr>
                                <td colSpan="3" style={{ textAlign: "right", fontWeight: "bold" }}>
                                    Total:
                                </td>
                                <td style={{ fontWeight: "bold" }}>
                                    Q{totalDetalles.toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </Modal>


            <Modal
                isOpen={mostrarModalAnular}
                onClose={() => setMostrarModalAnular(false)}
                title="Anular producto"
                size="sm"
            >
                <div>
                    <p><strong>Producto:</strong> {productoSeleccionado?.nombreProducto}</p>

                    <label>Cantidad a anular:</label>
                    <input
                        type="number"
                        className="form-control"
                        value={cantidadAnular}
                        onChange={(e) => setCantidadAnular(Number(e.target.value))}
                        min="1"
                    />

                    <button
                        className="btn btn-danger mt-3"
                        onClick={confirmarAnulacionProducto}
                    >
                        Confirmar
                    </button>
                </div>
            </Modal>
        </div>
    );
}

export default Ventas;