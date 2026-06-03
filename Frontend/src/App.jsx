import { Routes, Route, useLocation } from 'react-router-dom';
import Login from './components/Login';
import PanelPrincipal from './components/PanelPrincipal';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Usuarios from './components/Usuarios';
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
import ModificarProveedores from './components/ModificarProveedores';
import Compras from './components/Compras';
import RegistrarCompras from './components/RegistrarCompras';
import Ventas from './components/Ventas';
import RegistrarVentas from './components/RegistrarVentas';
import AdminRoute from './components/AdminRoute';

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
          <AdminRoute>
            <Usuarios />
          </AdminRoute>
        } />
        <Route path="/registrarUsuarios" element={
          <AdminRoute>
            <RegistrarUsuarios />
          </AdminRoute>
        } />
        <Route path="/modificarUsuarios/:id" element={
          <AdminRoute>
            <ModificarUsuarios />
          </AdminRoute>
        } />
        <Route path="/medicamentos" element={
          <ProtectedRoute>
            <Medicamentos />
          </ProtectedRoute>
        }
        />
        <Route path="/registrarMedicamentos" element={
          <AdminRoute>
            <RegistrarMedicamentos />
          </AdminRoute>
        }
        />
        <Route path="/modificarMedicamentos/:id" element={
          <AdminRoute>
            <ModificarMedicamentos />
          </AdminRoute>
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
          <AdminRoute>
            <Proveedores />
          </AdminRoute>
        } />

        <Route path="/registrarProveedores" element={
          <AdminRoute>
            <RegistrarProveedores />
          </AdminRoute>
        }
        />

        <Route path="/modificarProveedores/:id" element={
          <AdminRoute>
            <ModificarProveedores />
          </AdminRoute>
        }
        />

        <Route path="/compras" element={
          <AdminRoute>
            <Compras />
          </AdminRoute>
        } />

        <Route path="/registrarCompras" element={
          <AdminRoute>
            <RegistrarCompras />
          </AdminRoute>
        } />

        <Route path="/ventas" element={
          <ProtectedRoute>
            <Ventas />
          </ProtectedRoute>
        } />
        <Route path="/registrarVentas" element={
          <ProtectedRoute>
            <RegistrarVentas />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;
