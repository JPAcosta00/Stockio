import { useAuth } from '../context/AuthContext';
import { Printer } from 'lucide-react';
import { useTheme } from '../components/DashboardLayout'; 

const TicketModal = ({ venta, onClose }) => {
  const { user } = useAuth(); 
  const { darkMode } = useTheme();

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 p-3.5 sm:p-4 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 flex flex-col space-y-3 sm:space-y-4">
        
        {/* ENCABEZADO */}
        <div className="text-center space-y-0.5">
          <h2 className="text-xs sm:text-base font-extrabold tracking-wide uppercase">
            {user?.companyName || "MI NEGOCIO"}
          </h2>
          <p className="text-[10px] text-zinc-500">Comprobante de Venta</p>
          <p className="text-[10px] font-mono text-zinc-400">ID Venta: #{venta?.id}</p>
        </div>

        <hr className="border-dashed border-zinc-300 dark:border-zinc-800" />

        {/* LISTA DE ITEMS */}
        <div className="space-y-2 text-xs flex-1">
          {venta?.items?.map((item, index) => (
            <div key={index} className="flex justify-between items-start">
              <div>
                <p className="font-medium text-xs sm:text-sm">{item.name}</p>
                <p className="text-[10px] text-zinc-500 font-mono">
                  {item.quantity}un. x ${item.unitPrice?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span className="font-mono font-bold text-xs sm:text-sm">
                ${(item.quantity * item.unitPrice)?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>

        <hr className="border-dashed border-zinc-300 dark:border-zinc-800" />

        {/* TOTAL */}
        <div className="flex justify-between items-center text-sm font-bold">
          <span>TOTAL:</span>
          <span className="font-mono text-emerald-500 text-lg sm:text-xl">
            ${venta?.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* ACCIONES */}
        <div className="flex gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-90 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#1C562A]/30"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default TicketModal;