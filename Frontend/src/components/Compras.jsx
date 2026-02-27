import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import "../styles/Compras.css"
import Modal from "../components/Modal";
import { FaEye } from "react-icons/fa";
import { BsXCircle } from "react-icons/bs";


function Compras() {
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState("");
    const navigate = useNavigate();

    const [mostrarModal, setMostrarModal] = useState(false);
    const [detallesCompra, setDetallesCompra] = useState([]);

    const [loadingId, setLoadingId] = useState(null);

    //Funcion ver detalles
    const verDetalles = async (idCompra) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/compras/detalles/${idCompra}`,
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
            setDetallesCompra(data);
            setMostrarModal(true);

        } catch (error) {
            console.error("Error al obtener detalles:", error);
        }
    };


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

    //Tabla para mostrar las compras
    const columns = [
        { name: "No.", selector: (row) => row.noCompra, sortable: true, width: "80px", wrap: false },

        { name: "Comprobante", selector: (row) => row.noFactura, sortable: true, width: "150px", wrap: false },

        { name: "Fecha", selector: (row) => formatearFecha(row.fechaCompra), sortable: true, width: "120px", wrap: false },

        { name: "Proveedor", selector: (row) => row.nombreProveedor, sortable: true, width: "200px", wrap: false },

        { name: "Total", selector: (row) => `Q${Number(row.totalCompra).toFixed(2)}`, sortable: true, width: "100px", wrap: false },

        { name: "Estado", selector: (row) => row.estadoCompra, sortable: true, width: "150px", wrap: false },

        { name: "Observaciones", selector: (row) => row.observaciones, sortable: true, width: "250px", wrap: false },

        {
            name: "Acciones", cell: (row) => <div style={{ display: "flex", gap: "6px" }}>
                <Link className="btn btn-sm btn-primary" title="Ver detalles" onClick={() => verDetalles(row.noCompra)}>
                    <FaEye size={20} />
                </Link>
                <Link
                    className={`btn btn-sm ${row.estadoCompra === "Anulada"
                            ? "btn-danger"
                            : "btn-danger"
                        }`}
                    title={
                        row.estadoCompra === "Anulada"
                            ? "Compra anulada"
                            : "Anular compra"
                    }
                    onClick={() => {
                        if (row.estadoCompra !== "Anulada") {
                            anularCompra(row.noCompra);
                        }
                    }}
                    style={{
                        pointerEvents: row.estadoCompra === "Anulada" ? "none" : "auto",
                        opacity: row.estadoCompra === "Anulada" ? 0.6 : 1
                    }}
                >
                    <BsXCircle size={20} />
                </Link>
            </div >

        }
    ];

    const obtenerCompras = async () => {
        console.log("1️⃣ Componente Compras montado");

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

            const response = await fetch(`${import.meta.env.VITE_API_URL}/compras`, {
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

            setCompras(data);

        } catch (error) {
            console.log("🔥 Error en fetch:", error);
        } finally {
            console.log("8️⃣ Finalizó fetch");
            setLoading(false);
        }
    }

    useEffect(() => {
        obtenerCompras();
    }, []);



    //Funcion anular compra
    const anularCompra = async (idCompra) => {

        const confirmacion = await Swal.fire({
            title: "¿Anular compra?",
            text: "Esta acción no se puede deshacer",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, anular",
            cancelButtonText: "Cancelar"
        });

        if (!confirmacion.isConfirmed) return;

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/compras/anular/${idCompra}`,
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
                throw new Error("Error al anular la compra");
            }

            await obtenerCompras();

            Swal.fire({
                icon: "success",
                title: "Compra anulada",
                text: "Compra anulada correctamente",
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

    //Filtrado por búsqueda
    const text = filterText.trim();

    let filteredItems = compras;

    if (text) {
        // 1️⃣ Buscar coincidencia exacta en número de compra
        const porNumero = compras.filter(
            (item) => String(item.noCompra) === text
        );

        if (porNumero.length > 0) {
            filteredItems = porNumero;
        } else {
            // 2️⃣ Si no encontró número exacto, buscar en factura
            filteredItems = compras.filter((item) =>
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

    const totalDetalles = detallesCompra.reduce((acc, item) => {
        return acc + Number(item.subtotal);
    }, 0);

    return (
        <div className="container-custom">
            <div className="p-4">
                <h4 className="mb-3">Compras Registradas</h4>
                <button className="btn btn-primary" onClick={() => navigate("/registrarCompras")}>Crear Compra</button>
            </div>

            {/* Buscador */}
            <input
                type="text"
                placeholder="Buscar por número de compra o comprobante"
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

                noDataComponent="No hay registros para mostrar"
            />
            <Modal
                isOpen={mostrarModal}
                onClose={() => setMostrarModal(false)}
                title="Detalles de la Compra"
                size="md"
                titleSize="18px"
            >
                {detallesCompra.length === 0 ? (
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
                            {detallesCompra.map((detalle) => (
                                <tr key={detalle.idDetalle}>
                                    <td>{detalle.nombreProducto}</td>
                                    <td>{detalle.cantidad}</td>
                                    <td>Q{detalle.precio}</td>
                                    <td>Q{detalle.subtotal}</td>
                                </tr>
                            ))}
                            <tr>
                                <td colSpan="3" style={{ textAlign: "right", fontWeight: "bold" }}>
                                    Total compra:
                                </td>
                                <td style={{ fontWeight: "bold" }}>
                                    Q{totalDetalles.toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </Modal>
        </div>
    )
}

export default Compras;
