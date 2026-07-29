import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// El tiempo de inactividad por defecto es de 15 minutos
const TIMEOUT_IN_MS = 10 * 60 * 1000; 

export default function useAutoLogout() {
  const navigate = useNavigate();

  const logout = useCallback(() => {
    console.log("Cerrando sesión por inactividad...");

    //Se limpian las credenciales almacenadas
    localStorage.removeItem('token');
    localStorage.removeItem('user'); 
    
    // se redirige al Login
    navigate('/login');
    
    
    window.location.reload(); 
  }, [navigate]);

  useEffect(() => {
    // Si no hay un token guardado, no tiene sentido activar el control
    const token = localStorage.getItem('token');
    if (!token) return;

    let timer;

    // Función para reiniciar el contador de tiempo
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(logout, TIMEOUT_IN_MS);
    };

    // Eventos que muestran actividad del usuario
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart'
    ];

    // Registra los eventos en la ventana
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    //inicializa el contador cuando se monta el componente
    resetTimer();

    // Limpia cuando se desmonta el componente 
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [logout]);
}