import React from "react";
import { useNavigate, Link } from 'react-router-dom';
import "../styles/Navbar.css"
function Navbar() {

  const navigate = useNavigate();
  
  const cerrarSesion = () => {

    localStorage.removeItem('token');

    navigate("/");
  };
  return (
    <div>
      <nav className="navbar navbar-expand-lg fixed-top" style={{ backgroundColor: 'rgba(1, 15, 96, 1)' }}>
        <div className="container-fluid">
          <a className="navbar-brand" href="#" style={{ color: '#ffff' }}>
            <i className="fa-solid fa-staff-snake"></i> Farmacia El Ahorro
          </a>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav mx-auto">
               <li className="nav-item">
                <Link className="nav-link text-white" to="/panelPrincipal">
                  <i className="fas fa-tachometer-alt"></i> Panel Principal
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white" to="/usuarios">
                  <i className="fa fa-users"></i> Usuarios
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white" to="/medicamentos" >
                  <i className="fas fa-pills"></i> Medicamentos
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white" to="/clientes">
                  <i className="fa-solid fa-user-tag"></i> Clientes
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white" to="/proveedores">
                  <i className="fas fa-truck"></i> Proveedores
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white" to="#">
                  <i className="fas fa-shopping-bag"></i> Compras
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white" to="#">
                  <i className="fas fa-tag"></i> Ventas
                </Link>
              </li>
              <li className="nav-item">
                <a className="nav-link text-white" href="#" onClick={(e) => {
                  e.preventDefault(); 
                  cerrarSesion();    
                }}>
                  <i className="fas fa-right-from-bracket"></i> Cerrar Sesión
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
