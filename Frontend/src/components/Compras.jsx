import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import "../styles/Compras.css"
import { FaEye } from "react-icons/fa";
import { BsXCircle } from "react-icons/bs";



function Compras() {
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState("");
    const navigate = useNavigate();

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

        { name: "No Factura", selector: (row) => row.noFactura, sortable: true, width: "150px", wrap: false },

        { name: "Fecha", selector: (row) => formatearFecha(row.fechaCompra), sortable: true, width: "120px", wrap: false },

        { name: "Proveedor", selector: (row) => row.nombreProveedor, sortable: true, width: "200px", wrap: false },

        { name: "Total", selector: (row) => `Q${Number(row.totalCompra).toFixed(2)}`, sortable: true, width: "100px", wrap: false },

        { name: "Estado", selector: (row) => row.estadoCompra, sortable: true, width: "150px", wrap: false },

        { name: "Observaciones", selector: (row) => row.observaciones, sortable: true, width: "250px", wrap: false },

        {
            name: "Acciones",cell: (row) => <div style={{ display: "flex", gap: "6px" }}>
                <Link className="btn btn-sm btn-primary" title="Ver detalles">
                <FaEye size={20} />
                </Link>
                <Link className="btn btn-sm btn-danger" title="Anular compra">
                <BsXCircle size={20} />
                </Link>
            </div>

        }
    ];

    useEffect(() => {
        const fetchCompras = async () => {
            try {
                const token = localStorage.getItem("token"); // 👈 tu JWT

                if (!token) {
                    console.error("No hay token en localStorage");
                    setLoading(false);
                    return;
                }

                const response = await fetch("http://localhost:3000/compras", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}` // 👈 AQUÍ VA EL TOKEN
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || "Error al obtener compras");
                }

                const data = await response.json();
                setCompras(data);
            } catch (error) {
                console.error("Error al obtener compras:", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCompras();
    }, []);

    //Filtrado por búsqueda
    const filteredItems = compras.filter((item) => {
        const text = filterText.toLowerCase();

        const noCompra = item.noCompra?.toString().toLowerCase() || "";
        const noFactura = item.noFactura?.toLowerCase() || "";

        return noCompra.includes(text) || noFactura.includes(text);
    });


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

    return (
        <div className="container-custom">
            <div className="p-4">
                <h4 className="mb-3">Compras Registradas</h4>
                <button className="btn btn-primary" onClick={() => navigate("/registrarCompras")}>Crear Compra</button>
            </div>

            {/* Buscador */}
            <input
                type="text"
                placeholder="Buscar por número de compra o factura"
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
        </div>
    )
}

export default Compras;
