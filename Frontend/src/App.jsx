import { Routes, Route, useLocation } from 'react-router-dom';
import Login from './components/Login';
import PanelPrincipal from './components/PanelPrincipal';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Usuarios from './components/Usuarios';
import RegistrarUsuario from './components/RegistrarUsuarios';
import RegistrarUsuarios from './components/RegistrarUsuarios';
import ModificarUsuarios from './components/ModificarUsuarios';
import Medicamentos from './components/Medicamentos';
import RegistrarMedicamentos from './components/RegistrarMedicamentos';
import ModificarMedicamentos from './components/ModificarMedicamentos';
import Clientes from './components/Clientes';
import RegistrarClientes from './components/RegistrarClientes';
import ModificarClientes from './components/ModificarClientes';
import Proveedores from './components/Proveedores';
import RegistrarProveedores from './components/RegistrarProveedores';

function App() {
  const location = useLocation(); // Obtén la ubicación actual

  // Mostrar el Navbar solo si no estamos en la ruta '/'
  const mostrarNavbar = location.pathname !== '/';

  return (
    <div>
      {mostrarNavbar && <Navbar />}

      {/* Rutas */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/panelPrincipal"
          element={
            <ProtectedRoute>
              <PanelPrincipal />
            </ProtectedRoute>
          } />
        <Route path="/usuarios" element={
          <ProtectedRoute>
            <Usuarios />
          </ProtectedRoute>
        } />
        <Route path="/registrarUsuarios" element={
          <ProtectedRoute>
            <RegistrarUsuarios />
          </ProtectedRoute>
        } />
        <Route path="/modificarUsuarios/:id" element={
          <ProtectedRoute>
            <ModificarUsuarios />
          </ProtectedRoute>
        } />
        <Route path="/medicamentos" element={
          <ProtectedRoute>
            <Medicamentos />
          </ProtectedRoute>
        }
        />
        <Route path="/registrarMedicamentos" element={
          <ProtectedRoute>
            <RegistrarMedicamentos />
          </ProtectedRoute>
        }
        />
        <Route path="/modificarMedicamentos/:id" element={
          <ProtectedRoute>
            <ModificarMedicamentos />
          </ProtectedRoute>
        } />
        <Route path="/clientes" element={
          <ProtectedRoute>
            <Clientes />
          </ProtectedRoute>
        } />
         <Route path="/registrarClientes" element={
          <ProtectedRoute>
            <RegistrarClientes />
          </ProtectedRoute>
        }
        />
        <Route path="/modificarClientes/:id" element={
          <ProtectedRoute>
            <ModificarClientes />
          </ProtectedRoute>
        } />

         <Route path="/proveedores" element={
          <ProtectedRoute>
            <Proveedores />
          </ProtectedRoute>
        } />

        <Route path="/registrarProveedores" element={
          <ProtectedRoute>
            <RegistrarProveedores />
          </ProtectedRoute>
        }
        />
      </Routes>
    </div>
  );
}

export default App;
