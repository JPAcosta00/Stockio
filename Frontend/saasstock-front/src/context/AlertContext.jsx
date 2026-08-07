import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((message, type = 'error') => {
    setAlert({ message, type });
    // Se oculta sola a los 4 segundos
    setTimeout(() => {
      setAlert(null);
    }, 4000);
  }, []);

  const hideAlert = () => setAlert(null);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}

      {/* Contenedor flotante de la alerta */}
      {alert && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900 border border-zinc-800 text-white px-5 py-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-md">
          {alert.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
          {alert.type === 'error' && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}

          <p className="text-xs font-medium leading-relaxed flex-1">
            {alert.message}
          </p>

          <button 
            onClick={hideAlert} 
            className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert debe usarse dentro de un AlertProvider');
  }
  return context;
}