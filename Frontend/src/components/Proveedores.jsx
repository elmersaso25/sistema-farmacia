import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import { BsX, BsCheck } from "react-icons/bs";
import "../styles/proveedores.css";


function Proveedores() {
    const [proveedores, setProveedores] = useState([]);
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
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const columns = [
        { name: "ID", selector: (row) => row.idProveedor, sortable: true },

        { name: "Nombre Proveedor", selector: (row) => row.nombreProveedor, sortable: true, width: "270px", wrap: false },

        { name: "Teléfono", selector: (row) => row.telefono, width: "140px", wrap: false },

        { name: "Correo Electrónico", selector: (row) => row.correo, sortable: true, width: "250px", wrap: false },

        { name: "Nit", selector: (row) => row.nit, sortable: true, width: "140px", wrap: false },

        { name: "Dirección", selector: (row) => row.direccion, sortable: true, width: "270px", wrap: false },

        { name: "Estado", selector: (row) => row.estado, sortable: true, width: "100px", wrap: false },

        {
            name: "Acciones", cell: (row) => <div style={{ display: "flex", gap: "6px" }}>
                <Link className="btn btn-sm btn-warning" to={`/modificarProveedores/${row.idProveedor}`} title="Modificar registro">
                    <i className="fa-solid fa-pen-to-square"></i>
                </Link>
                <Link
                    className={`btn btn-sm ${row.estado === "Activo" ? "btn-danger" : "btn-success"
                        }`}
                    to="#"
                    onClick={() => cambiarEstado(row.idProveedor)}
                    title="Cambiar estado"
                >
                    {row.estado === "Activo" ? <BsX size={20} /> : <BsCheck size={20} />}
                </Link>
            </div>
        }
    ];

    //useEffect correctamente cerrado
    useEffect(() => {
        const fetchProveedores = async () => {
            try {
                const response = await fetch("http://localhost:3000/proveedores");
                if (!response.ok) throw new Error("Error al obtener proveedores");

                const data = await response.json();
                setProveedores(data);
            } catch (error) {
                console.error("Error al obtener proveedores:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProveedores();
    }, []); // ✅ cierra correctamente el useEffect

    //Filtrado por búsqueda (usa usuarios, no data)
    const filteredItems = proveedores.filter((item) =>
        item.nombreProveedor.toLowerCase().includes(filterText.toLowerCase())
    );

    //Estilos personalizados
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

    //Funcion cambiar estado PENDIENTE


    return (
        <div className="container-custom">
            <div className="p-4">
                <h4 className="mb-3">Proveedores Registrados</h4>
                <button className="btn btn-primary" onClick={() => navigate("/registrarProveedores")}>Crear Nuevo</button>
            </div>
            {/* Buscador */}
            <input
                type="text"
                placeholder="Buscar por nombre"
                className="form-control mb-3"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
            />

            {/* Tabla */}
            <DataTable
                columns={columns}
                data={filteredItems} // ✅ usa la lista filtrada
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
    );
}

export default Proveedores;