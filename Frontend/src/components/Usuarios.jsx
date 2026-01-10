import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import { BsX, BsCheck } from "react-icons/bs";
import "../styles/Usuarios.css";


function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
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
    { name: "ID", selector: (row) => row.idUsuario, sortable: true },
    { name: "Nombre Completo", selector: (row) => row.nombreCompleto, sortable: true, width: "270px", wrap: false },
    { name: "Celular", selector: (row) => row.celular },
    {
      name: "Correo Electrónico", selector: (row) => row.correo, sortable: true, width: "250px", wrap: false
    },

    { name: "Estado", selector: (row) => row.estado, sortable: true, width: "100px", wrap: false },

    { name: "Fecha de Registro", selector: (row) => formatearFecha(row.fechaRegistro), sortable: true, width: "200px", wrap: false },
    {
      name: "Acciones", cell: (row) => <div style={{ display: "flex", gap: "6px" }}>
        <Link className="btn btn-sm btn-warning" to={`/modificarUsuarios/${row.idUsuario}`} title="Modificar registro">
          <i className="fa-solid fa-pen-to-square"></i>
        </Link>
        <Link
          className={`btn btn-sm ${row.estado === "Activo" ? "btn-danger" : "btn-success"
            }`}
          to="#"
          onClick={() => cambiarEstado(row.idUsuario)}
          title="Cambiar estado"
        >
          {row.estado === "Activo" ? <BsX size={20} /> : <BsCheck size={20} />}
        </Link>

      </div>
    }
  ];


  // ✅ useEffect correctamente cerrado
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await fetch("http://localhost:3000/usuarios");
        if (!response.ok) throw new Error("Error al obtener usuarios");

        const data = await response.json();
        setUsuarios(data);
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
      } finally {
        setLoading(false);
      }
    };

    // ✅ se llama la función aquí, fuera del bloque try/catch
    fetchUsuarios();
  }, []); // ✅ cierra correctamente el useEffect


  // ✅ Filtrado por búsqueda (usa usuarios, no data)
  const filteredItems = usuarios.filter((item) =>
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

  //Funcion cambiar estado
const cambiarEstado = async (idUsuario) => {
  const usuario = usuarios.find(u => u.idUsuario === idUsuario);
  if (!usuario) return;

  const nuevoEstado = usuario.estado === "Activo" ? "Inactivo" : "Activo";

  // Confirmación con SweetAlert
  const result = await Swal.fire({
    title: "¿Estás seguro?",
    text: `El usuario pasará a estado: ${nuevoEstado}`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, cambiar",
    cancelButtonText: "Cancelar"
  });

  if (!result.isConfirmed) return;

  try {
    const response = await fetch(`http://localhost:3000/usuarios/${idUsuario}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    if (!response.ok) throw new Error("Error al cambiar estado");

    // Actualiza react localmente
    setUsuarios(prev =>
      prev.map(u =>
        u.idUsuario === idUsuario ? { ...u, estado: nuevoEstado } : u
      )
    );

    Swal.fire({
      icon: "success",
      title: "Estado actualizado",
      text: `El usuario ahora está ${nuevoEstado}`,
      timer: 1500,
      showConfirmButton: false
    });

  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo cambiar el estado"
    });
  }
};

  // ✅ Render del componente
  return (
    <div className="container-custom">
      <div className="p-4">
        <h4 className="mb-3">Usuarios Registrados</h4>
        <button className="btn btn-primary" onClick={() => navigate("/registrarUsuarios")}>Crear Nuevo</button>
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

export default Usuarios;
