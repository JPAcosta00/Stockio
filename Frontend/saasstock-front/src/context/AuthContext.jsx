import { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se lee el token de la sesión
    const token = sessionStorage.getItem('token');
  
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
      
        // VALIDACIÓN DE EXPIRACIÓN
        const currentTime = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
      
        if (payload.exp && payload.exp < currentTime) {
          // El token ya expiró de tiempo
          console.warn("El token ha expirado. Cerrando sesión...");
          sessionStorage.removeItem('token');
          setUser(null);
        } else {
          // El token sigue siendo válido
          setUser({
            token,
            email: payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || payload.email,
            role: payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role,
            tenantId: payload.TenantId,
            companyName: payload.CompanyName || "MI NEGOCIO" 
          });
        }
      } catch (error) {
        console.error("Token inválido", error);
        sessionStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  // Función para iniciar sesión (recibe el token del backend)
  const login = (token) => {
    sessionStorage.setItem('token', token);
    
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));

    setUser({
      token,
      email: payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || payload.email,
      role: payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role,
      tenantId: payload.TenantId,
      companyName: payload.CompanyName || "MI NEGOCIO" 
    });
  };

  // Función para cerrar sesión
  const logout = () => {
    sessionStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  // Método para el registro
  const register = async (username, email, password, companyName) => {
    try {
      const response = await apiClient.post('/auth/register', {
        username,
        email,
        password,
        businessName: companyName
      });
    
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error atrapado en AuthContext.register:", error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'No se pudo completar el registro en el servidor.' 
      };
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        register, 
        isAuthenticated: !!user, 
        loading 
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);