import React, { useState } from "react";
import { useEffect } from "react";
import "../styles/PanelPrincipal.css";
import { useNavigate } from "react-router-dom";

function PanelPrincipal() {

  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [totalMedicamentos, setTotalMedicamentos] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalProveedores, setTotalProveedores] = useState(0);



  //Fetch para obtener total usuarios
  useEffect(() => {
    const obtenerTotalUsuarios = async () => {
      try {
        const res = await fetch("http://localhost:3000/usuarios/totalUsuarios");
        const data = await res.json();
        setTotalUsuarios(data.totalUsuarios);
      } catch (error) {
        console.error("Error al obtener total usuarios:", error);
      }
    }
    obtenerTotalUsuarios();
  }, []);

  //Fetch para obtener total medicamentos
  useEffect(() => {
    const obtenerTotalMedicamentos = async (req, res) => {
      try {
        const res = await fetch("http://localhost:3000/medicamentos/totalMedicamentos");
        const data = await res.json();
        setTotalMedicamentos(data.totalMedicamentos);

      } catch (error) {
        console.error("Error al obtener total medicamentos:", error);

      }
    }
    obtenerTotalMedicamentos();
  }, []);

  //Fetch para obtener total clientes
  useEffect(() => {
    const obtenerTotalClientes = async (req, res) => {
      try {
        const res = await fetch("http://localhost:3000/clientes/totalClientes");
        const data = await res.json();
        setTotalClientes(data.totalClientes);
      }
      catch (error) {
        console.error("Error al obtener total clientes:", error);
      }
    }
    obtenerTotalClientes();
  }, [])

  //Fetch para obtener total proveedores
  useEffect(() => {
    const obtenerTotalProveedores = async (req, res) => {
      try {
        const res = await fetch("http://localhost:3000/proveedores/totalProveedores");
        const data = await res.json();
        setTotalProveedores(data.totalProveedores);
      } catch (error) {
        console.error("Error al obtener total usuarios:", error);

      }
    }
    obtenerTotalProveedores();
  }, [])


  return (
    <div className="container">
      <div className="dashboard p-4 mt-5">
        <h4 className="mb-3">DashBoard</h4>
        {/* Fila 1 */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card dashboard-card text-white shadow-sm" style={{ backgroundColor: 'rgba(255, 127, 7, 1)' }}>
              <div className="card-body">
                <h5> <i className="fa fa-users"></i> Usuarios</h5>
                <h2>{totalUsuarios}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card dashboard-card text-white shadow-sm" style={{ backgroundColor: 'rgba(6, 86, 98, 1)' }}>
              <div className="card-body">
                <h5><i className="fa-solid fa-user-tag me-2"></i>Clientes</h5>
                <h2>{totalClientes}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card dashboard-card bg-warning text-white shadow-sm">
              <div className="card-body">
                <h5><i className="fa-solid fa-truck me-2"></i>Proveedores</h5>
                <h2>{totalProveedores}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card dashboard-card bg-danger text-white shadow-sm">
              <div className="card-body">
                <h5><i className="fa-solid fa-pills me-2"></i>Medicamentos</h5>
                <h2>{totalMedicamentos}</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Fila 2 */}
        <div className="row">
          <div className="col-md-3 mb-3">
            <div className="card dashboard-card bg-primary text-white shadow-sm">
              <div className="card-body">
                <h5><i className="fa-solid fa-shopping-bag me-2"></i>Compras</h5>
                <h2>45</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card dashboard-card bg-success text-white shadow-sm">
              <div className="card-body">
                <h5><i className="fa-solid fa-dollar-sign me-2"></i>Ventas Hoy</h5>
                <h2>Q2,340</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card dashboard-card bg-secondary text-white shadow-sm">
              <div className="card-body">
                <h5><i className="fa-solid fa-tags me-2"></i>Ventas Totales</h5>
                <h2>Q12,580</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card dashboard-card text-white shadow-sm" style={{ backgroundColor: 'rgb(111,66,193)' }}>
              <div className="card-body">
                <h5><i className="fa-solid fa-boxes-stacked me-2"></i>Inventario</h5>
                <h2>980</h2>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
export default PanelPrincipal;