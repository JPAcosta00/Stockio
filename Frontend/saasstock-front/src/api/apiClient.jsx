import axios from 'axios';

// Crea la instancia base de Axios apuntando a la API de .NET
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:7046/api', 
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
});

// INTERCEPTOR DE PETICIONES: Agrega el token JWT automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

//  INTERCEPTOR DE RESPUESTAS: Captura errores globales 
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('token');
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default apiClient; 