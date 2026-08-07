import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertProvider } from '../context/AlertContext';
import Login from '../pages/Login';
import DashboardLayout from '../components/DashboardLayout';
import Inventario from '../pages/Inventario';
import Ventas from '../pages/Ventas';
import Estadisticas from '../pages/Estadisticas'; 
import Perfil from '../pages/Perfil'; 
import Caja from '../pages/Caja'; 


const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth(); 

  //  Si todavía está leyendo el sessionStorage, muestra un estado de carga temporal
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Cargando sesión...
      </div>
    );
  }

  return isAuthenticated ? <DashboardLayout>{children}</DashboardLayout> : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth(); 

  // Si está cargando, se espera
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Cargando sesión...
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" /> : children;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      {/* INICIO */}
      <Route 
        path="/" 
        element={
          <PrivateRoute>
            <Estadisticas />
          </PrivateRoute>
        } 
      />

      {/* INVENTARIO REAL */}
      <Route path="/caja" element={<PrivateRoute><Caja /></PrivateRoute>} />

      {/* INVENTARIO REAL */}
      <Route path="/inventario" element={<PrivateRoute><Inventario /></PrivateRoute>} />

      {/* SECCION DE VENTTAS*/}
      <Route path="/ventas" element={<PrivateRoute><Ventas /></PrivateRoute>} />
      
      {/* CONFIGURACIÓN (temporal) */}
      <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}