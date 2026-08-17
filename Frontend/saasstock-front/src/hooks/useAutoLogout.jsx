import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const TIMEOUT_IN_MS = 10 * 60 * 1000; 

export default function useAutoLogout() {
  const navigate = useNavigate();

  const logout = useCallback(() => {
    console.log("Cerrando sesión por inactividad...");
    localStorage.removeItem('token');
    localStorage.removeItem('user'); 
    navigate('/login');
    window.location.reload(); 
  }, [navigate]);

  useEffect(() => {
    // 1. SI ESTÁ DESACTIVADO POR CONFIGURACIÓN, NO HACE NADA
    // (Puedes controlar esto desde tu archivo .env con VITE_ENABLE_AUTO_LOGOUT=false)
    const enableAutoLogout = import.meta.env.VITE_ENABLE_AUTO_LOGOUT;
    if (enableAutoLogout === 'false') {
      return; 
    }

    // 2. Si no hay un token guardado, tampoco tiene sentido
    const token = localStorage.getItem('token');
    if (!token) return;

    let timer;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(logout, TIMEOUT_IN_MS);
    };

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart'
    ];

    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [logout]);
}