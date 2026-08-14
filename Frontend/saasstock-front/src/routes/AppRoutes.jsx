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
import Providers from '../pages/Providers'; 
import Empleados from '../pages/Empleados'; 
import { ThemeProvider } from '../context/ThemeContext';

// Ruta protegida general (verifica autenticación)
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth(); 

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Cargando sesión...
      </div>
    );
  }

  return isAuthenticated ? <DashboardLayout>{children}</DashboardLayout> : <Navigate to="/login" />;
};

// Ruta protegida por roles (bloquea a empleados si es solo para admins/empresa)
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Cargando sesión...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const userRole = user?.role ? String(user.role).toUpperCase().trim() : '';

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/inventario" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth(); 

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
  const { user } = useAuth();
  const userRole = user?.role ? String(user.role).toUpperCase().trim() : '';
  const isEmpleado = userRole === 'EMPLEADO' || userRole === 'EMPLOYEE';

  return (
    <ThemeProvider>
      <AlertProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

          {/* INICIO: Si es empleado va directo a /inventario, si es admin/empresa ve Estadísticas */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                {isEmpleado ? <Navigate to="/inventario" replace /> : <Estadisticas />}
              </PrivateRoute>
            } 
          />

          {/* CAJA */}
          <Route path="/caja" element={<PrivateRoute><Caja /></PrivateRoute>} />

          {/* INVENTARIO */}
          <Route path="/inventario" element={<PrivateRoute><Inventario /></PrivateRoute>} />

          {/* VENTAS */}
          <Route path="/ventas" element={<PrivateRoute><Ventas /></PrivateRoute>} />
          
          {/* PROVEEDORES (Permite ADMIN y EMPRESA) */}
          <Route 
            path="/providers" 
            element={
              <RoleRoute allowedRoles={['ADMIN', 'ADMINISTRADOR', 'EMPRESA', 'COMPANY']}>
                <Providers />
              </RoleRoute>
            } 
          /> 

          {/* EMPLEADOS (Permite ADMIN y EMPRESA) */}
          <Route 
            path="/empleados" 
            element={
              <RoleRoute allowedRoles={['ADMIN', 'ADMINISTRADOR', 'EMPRESA', 'COMPANY']}>
                <Empleados />
              </RoleRoute>
            } 
          />

          {/* PERFIL */}
          <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AlertProvider>
    </ThemeProvider>
  );
}