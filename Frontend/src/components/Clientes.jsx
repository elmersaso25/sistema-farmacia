import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import "../styles/Clientes.css"

function Clientes() {
  const [clientes, setClientes] = useState([]);
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
    { name: "Id", selector: (row) => row.idCliente, sortable: true },
    { name: "Nombre Completo", selector: (row) => row.nombreCompleto, sortable: true, width: "270px", wrap: false },
    { name: "Celular", selector: (row) => row.celular, sortable: true, width: "150px", wrap: false },
    {
      name: "Nit", selector: (row) => row.nit, sortable: true, width: "150x", wrap: false
    },

    { name: "Dirección", selector: (row) => row.direccion, sortable: true, width: "250px", wrap: false },

    { name: "Fecha de Registro", selector: (row) => formatearFecha(row.fechaRegistro), sortable: true, width: "200px", wrap: false },
    {
      name: "Acciones",
      cell: (row) => (
        <div style={{ display: "flex", gap: "6px" }}>
          <Link
            className="btn btn-sm btn-warning"
            to={row.idCliente === 1 ? "#" : `/modificarClientes/${row.idCliente}`}
            title={
              row.idCliente === 1
                ? "No se puede editar este registro"
                : "Modificar registro"
            }
            style={{
              opacity: row.idCliente === 1 ? 0.4 : 1,
              pointerEvents: row.idCliente === 1 ? "none" : "auto",
              cursor: row.idCliente === 1 ? "not-allowed" : "pointer",
            }}
          >
            <i className="fa-solid fa-pen-to-square"></i>
          </Link>
        </div>
      )
    }
  ];

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch("http://localhost:3000/clientes");
        if (!response.ok) throw new Error("Error al obtener clientes");

        const data = await response.json();
        setClientes(data);
      } catch (error) {
        console.error("Error al obtener clientes:", error);
      } finally {
        setLoading(false);
      }
    };

    // ✅ se llama la función aquí, fuera del bloque try/catch
    fetchClientes();
  }, []);

  // ✅ Filtrado por búsqueda
  const filteredItems = clientes.filter((item) =>
    item.nombreCompleto.toLowerCase().includes(filterText.toLowerCase())
  );

  // ✅ Estilos personalizados
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
        <h4 className="mb-3">Clientes Registrados</h4>
        <button className="btn btn-primary" onClick={() => navigate("/registrarClientes")}>Crear Nuevo</button>
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

export default Clientes;
