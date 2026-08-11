import { useAuth } from '../context/AuthContext';
import { Printer } from 'lucide-react';

const TicketModal = ({ venta, onClose }) => {
  const { user } = useAuth(); // Obtenemos el usuario y su info del token

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl text-zinc-800 dark:text-zinc-200">
        
        {/* ENCABEZADO: AQUÍ SE MUESTRA EL NOMBRE REAL DEL NEGOCIO */}
        <div className="text-center space-y-1">
          <h2 className="text-base font-extrabold tracking-wide uppercase">
            {user?.companyName || "MI NEGOCIO"}
          </h2>
          <p className="text-[10px] text-zinc-500">Comprobante de Venta</p>
          <p className="text-[10px] font-mono text-zinc-400">ID Venta: #{venta?.id}</p>
        </div>

        <hr className="border-dashed border-zinc-300 dark:border-zinc-800" />

        {/* LISTA DE ITEMS */}
        <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
          {venta?.items?.map((item, index) => (
            <div key={index} className="flex justify-between items-start">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-[10px] text-zinc-500 font-mono">
                  {item.quantity}un. x ${item.unitPrice?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span className="font-mono font-bold">
                ${(item.quantity * item.unitPrice)?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>

        <hr className="border-dashed border-zinc-300 dark:border-zinc-800" />

        {/* TOTAL */}
        <div className="flex justify-between items-center text-sm font-bold">
          <span>TOTAL:</span>
          <span className="font-mono text-emerald-500 text-base">
            ${venta?.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* ACCIONES */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 font-medium rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default TicketModal;