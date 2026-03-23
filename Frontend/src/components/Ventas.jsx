import React, {useState, useEffect} from "react";
import { useNavigate, Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import "../styles/Ventas.css";
import Modal from "../components/Modal";
import { FaEye } from "react-icons/fa";
import { BsXCircle } from "react-icons/bs";

function Ventas(){
    const [ventas, setVentas] = useState([]);
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
            { name: "No.", selector: (row) => row.noVenta, sortable: true, width: "100px", wrap: false },
    
            { name: "Factura", selector: (row) => row.noFactura, sortable: true, width: "150px", wrap: false },
    
            { name: "Fecha", selector: (row) => formatearFecha(row.fechaVenta), sortable: true, width: "150px", wrap: false },
    
            { name: "Cliente", selector: (row) => row.nombreCompleto, sortable: true, width: "250px", wrap: false },
    
            { name: "Total", selector: (row) => `Q${Number(row.totalVenta).toFixed(2)}`, sortable: true, width: "150px", wrap: false },
    
            { name: "Estado", selector: (row) => row.estadoVenta, sortable: true, width: "150px", wrap: false },
    
    
            {
                name: "Acciones", cell: (row) => <div style={{ display: "flex", gap: "6px" }}>
                    <Link className="btn btn-sm btn-primary" title="Ver detalles" onClick={() => verDetalles(row.noVenta)}>
                        <FaEye size={20} />
                    </Link>
                    <Link
                        className={`btn btn-sm ${row.estadoVenta === "Anulada"
                                ? "btn-danger"
                                : "btn-danger"
                            }`}
                        title={
                            row.estadoVenta === "Anulada"
                                ? "Compra anulada"
                                : "Anular Venta"
                        }
                        onClick={() => {
                            if (row.estadoVenta !== "Anulada") {
                                anularCompra(row.noCompra);
                            }
                        }}
                        style={{
                            pointerEvents: row.estadoVenta === "Anulada" ? "none" : "auto",
                            opacity: row.estadoCompra === "Anulada" ? 0.6 : 1
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


    return(
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
        </div>
    );
}

export default Ventas;