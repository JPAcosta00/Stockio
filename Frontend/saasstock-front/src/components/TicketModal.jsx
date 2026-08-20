import { useAuth } from '../context/AuthContext';
import { Printer } from 'lucide-react';
import { useTheme } from '../components/DashboardLayout'; 

const TicketModal = ({ venta, onClose }) => {
  const { user } = useAuth(); 
  const { darkMode } = useTheme();

  return (
    // Aplicamos la clase dark directamente al contenedor del modal si darkMode es true
    <div className={`${darkMode ? 'dark' : ''} fixed inset-0 z-50`}>
      {/* Fondo con blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
        
        {/* Contenedor del Ticket - Cambia de blanco a oscuro según el estado */}
        <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col space-y-4">
          
          {/* ENCABEZADO */}
          <div className="text-center space-y-0.5">
            <h2 className="text-xs sm:text-base font-extrabold tracking-wide uppercase text-zinc-900 dark:text-white">
              {user?.companyName || "MI NEGOCIO"}
            </h2>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Comprobante de Venta</p>
            <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">ID Venta: #{venta?.id}</p>
          </div>

          <hr className="border-dashed border-zinc-300 dark:border-zinc-700" />

          {/* LISTA DE ITEMS */}
          <div className="space-y-2 text-xs flex-1 text-zinc-800 dark:text-zinc-200">
            {venta?.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-xs sm:text-sm">{item.name}</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                    {item.quantity}un. x ${item.unitPrice?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <span className="font-mono font-bold text-xs sm:text-sm">
                  ${(item.quantity * item.unitPrice)?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>

          <hr className="border-dashed border-zinc-300 dark:border-zinc-700" />

          {/* TOTAL */}
          <div className="flex justify-between items-center text-sm font-bold text-zinc-900 dark:text-white">
            <span>TOTAL:</span>
            <span className="font-mono text-[#5BA535] text-lg sm:text-xl">
              ${venta?.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* ACCIONES - Se ocultan automáticamente al imprimir con print:hidden */}
          <div className="flex gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 print:hidden">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-90 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TicketModal;