import React from 'react';
import { useTheme } from '../components/DashboardLayout'; 
import { X, Loader2 } from 'lucide-react';

export default function VentaDetalleModal({ venta, loading, onClose }) {
  const { darkMode } = useTheme(); 

  if (!venta && !loading) return null;

  const items = venta?.items || venta?.details || venta?.saleDetails || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-black/50 p-6 space-y-5 transition-colors ${
        darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {loading ? (
          <div className={`py-12 text-center font-medium flex items-center justify-center gap-2 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
            <Loader2 className="w-5 h-5 animate-spin text-[#5BA535]" />
            <span>Cargando detalles de la venta...</span>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={`flex items-center justify-between pb-4 border-b ${darkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
              <div>
                <h3 className={`text-base font-extrabold tracking-tight ${darkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
                  Detalle de Venta <br />
                  <span className="font-mono text-[#5BA535]">#{venta.id}</span>
                </h3>
                <p className={`text-xs font-medium mt-0.5 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                  {new Date(venta.createdAt).toLocaleString('es-AR', { 
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })} hs.
                </p>
              </div>
              <button
                onClick={onClose}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors font-bold cursor-pointer ${
                  darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Listado de ítems */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              <span className={`text-xs font-bold uppercase tracking-wider block ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                Productos Vendidos
              </span>
              
              {items.length === 0 ? (
                <p className={`text-xs italic text-center py-6 rounded-xl border ${
                  darkMode ? 'text-zinc-500 bg-zinc-950 border-zinc-800/80' : 'text-slate-400 bg-slate-50 border-slate-200'
                }`}>
                  Sin detalles registrados para esta venta.
                </p>
              ) : (
                <div className={`divide-y rounded-xl px-4 py-1 border ${
                  darkMode ? 'divide-zinc-800/80 bg-zinc-950 border-zinc-800' : 'divide-slate-100 bg-slate-50 border-slate-200'
                }`}>
                  {items.map((item, index) => (
                    <div key={item.id || index} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <p className={`font-semibold ${darkMode ? 'text-zinc-200' : 'text-slate-800'}`}>
                          {item.product?.name || item.product?.Name || item.name || item.productName || 'Producto sin nombre'}
                        </p>
                        <p className={`text-[10px] font-mono mt-0.5 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                          {item.quantity} un. x ${item.unitPrice?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <p className={`font-mono font-bold ${darkMode ? 'text-zinc-200' : 'text-slate-800'}`}>
                        ${((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div className={`pt-3 flex justify-between items-baseline p-4 rounded-xl border ${
              darkMode ? 'border-zinc-800 bg-zinc-950/60' : 'border-slate-200 bg-slate-50'
            }`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>TOTAL</span>
              <span className="text-2xl font-mono font-black text-[#5BA535]">
                ${venta.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              className={`w-full font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm cursor-pointer ${
                darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  );
}