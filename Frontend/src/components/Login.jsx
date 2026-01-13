import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import "../styles/Login.css"
import Swal from "sweetalert2";

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/panelPrincipal", { replace: true });
    }
  }, [navigate]);


 const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch("http://localhost:3000/login/iniciar",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo: email,
          contrasenia: password,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);

      Swal.fire({
        icon: "success",
        title: "¡Bienvenido!",
        text: `Hola, ${data.usuario}`,
        timer: 2000,
        showConfirmButton: false,
      });

      navigate("/panelPrincipal",  { replace: true });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.mensaje,
      });
    }
  } catch (error) {
    console.error("Error al conectar con el backend:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo conectar con el servidor",
    });
  }
};



  return (
    <div className="d-flex justify-content-center align-items-center vh-100" id="Login">
      <div className="card p-4" style={{ minWidth: '350px' }} id="Login-card">
        <h3 className="text-center mb-3">Iniciar Sesión</h3>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="micorreo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="****************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn w-100 text-white" style={{ backgroundColor: 'rgba(1, 15, 96, 1)' }}>Ingresar</button>
        </form>
        {mensaje && <p className="mt-2">{mensaje}</p>}

      </div>
    </div>
  );
}

export default Login;
