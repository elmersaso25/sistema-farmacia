import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
    const token = localStorage.getItem("token");
    const rol = (localStorage.getItem("rol"));

    console.log("Rol:", rol);
    console.log("Tipo:", typeof rol);
    if (!token) {
        return <Navigate to="/" />;
    }

    if (rol !== "Administrador") {
        return <Navigate to="/panelPrincipal" />;
    }

    return children;
}

export default AdminRoute;