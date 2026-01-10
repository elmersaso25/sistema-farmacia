import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import { BsX, BsCheck } from "react-icons/bs";
import "../styles/medicamentos.css";


function Medicamentos() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const navigate = useNavigate();




  const columns = [
    { name: "Cod", selector: (row) => row.codigoMedicamento, sortable: true, width: "80px", wrap: false },
    { name: "Medicamento", selector: (row) => row.nombreMedicamento, sortable: true, width: "235px", wrap: false },
    { name: "Descripción", selector: (row) => row.descripcion, sortable: true, width: "265px", wrap: false },

    { name: "Precio", selector: (row) => `Q${Number(row.precio).toFixed(2)}`, sortable: true, width: "95px", wrap: false },

    { name: "Categoría", selector: (row) => row.categoria, sortable: true, width: "180px", wrap: false },

    { name: "Stock", selector: (row) => row.stock, sortable: true, width: "90px", wrap: false },

    { name: "Estado", selector: (row) => row.estado, sortable: true, width: "95x", wrap: false },

    {
      name: "Acciones", cell: (row) => <div style={{ display: "flex", gap: "6px" }}>
        <Link className="btn btn-sm btn-warning" to={`/modificarMedicamentos/${row.idMedicamento}`} title="Modificar registro">
          <i className="fa-solid fa-pen-to-square"></i>
        </Link>
        <Link
          className={`btn btn-sm ${row.estado === "Disponible" ? "btn-danger" : "btn-success"
            }`}
          to="#"
          onClick={() => cambiarEstado(row.idMedicamento)}
          title="Cambiar estado"
        >
          {row.estado === "Disponible" ? <BsX size={20} /> : <BsCheck size={20} />}
        </Link>

      </div>
    }
  ];


  // ✅ useEffect correctamente cerrado
  useEffect(() => {
    const fetchMedicamentos = async () => {
      try {
        const response = await fetch("http://localhost:3000/medicamentos");
        if (!response.ok) throw new Error("Error al obtener medicamentos");

        const data = await response.json();
        setMedicamentos(data);
      } catch (error) {
        console.error("Error al obtener medicamentos:", error);
      } finally {
        setLoading(false);
      }
    };

    // ✅ se llama la función aquí, fuera del bloque try/catch
    fetchMedicamentos();
  }, []); // ✅ cierra correctamente el useEffect



  // ✅ Filtrado por búsqueda (usa usuarios, no data)
  const filteredItems = medicamentos.filter((item) =>
    item.nombreMedicamento.toLowerCase().includes(filterText.toLowerCase())
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
  const cambiarEstado = async (idMedicamento) => {
    const medicamento = medicamentos.find(m => m.idMedicamento === idMedicamento);
    if (!idMedicamento) return;

    const nuevoEstado = medicamento.estado === "Disponible" ? "No Disponible" : "Disponible";

    // Confirmación con SweetAlert
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `El medicamento pasará a estado: ${nuevoEstado}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cambiar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`http://localhost:3000/medicamentos/${idMedicamento}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (!response.ok) throw new Error("Error al cambiar estado");

      // Actualiza react localmente
      setMedicamentos(prev =>
        prev.map(m =>
          m.idMedicamento === idMedicamento ? { ...m, estado: nuevoEstado } : m
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
  }



  return (
    <div className="container-custom">
      <div className="p-4">
        <h4 className="mb-3">Medicamentos Registrados</h4>
        <button className="btn btn-primary" onClick={() => navigate("/registrarMedicamentos")}>Crear Nuevo</button>
      </div>

      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar por nombre medicamento"
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

export default Medicamentos;