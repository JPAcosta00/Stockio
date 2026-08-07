import React from 'react';

export default function VentaDetalleModal({ venta, loading, onClose }) {
  // Si no hay venta ni está cargando, no mostramos nada
  if (!venta && !loading) return null;

  // Extraemos la lista de items contemplando distintas respuestas del backend
  const items = venta?.items || venta?.details || venta?.saleDetails || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-black/50 p-6 space-y-5">
        
        {loading ? (
          <div className="py-12 text-center text-zinc-400 font-medium">
            ⏳ Cargando detalles de la venta...
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-extrabold text-zinc-100 tracking-tight">
                  Detalle de Venta <br />
                  <span className="font-mono text-[#5BA535]">#{venta.id}</span>
                </h3>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                  {new Date(venta.createdAt).toLocaleString('es-AR', { 
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })} hs.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            {/* Listado de ítems */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Productos Vendidos
              </span>
              
              {items.length === 0 ? (
                <p className="text-xs text-zinc-500 italic text-center py-6 bg-zinc-950 rounded-xl border border-zinc-800/80">
                  Sin detalles registrados para esta venta.
                </p>
              ) : (
                <div className="divide-y divide-zinc-800/80 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-1">
                  {items.map((item, index) => (
                    <div key={item.id || index} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-zinc-200">
                          {item.product?.name || item.product?.Name || item.name || item.productName || 'Producto sin nombre'}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          {item.quantity} un. x ${item.unitPrice?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <p className="font-mono font-bold text-zinc-200">
                        ${((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-zinc-800 flex justify-between items-baseline bg-zinc-950/60 p-4 rounded-xl border border-zinc-800">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">TOTAL</span>
              <span className="text-2xl font-mono font-black text-[#5BA535]">
                ${venta.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
            >
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  );
}