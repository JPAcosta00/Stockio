import React from 'react';

export default function VentaDetalleModal({ venta, onClose }) {
  // Si no hay venta seleccionada, no renderizamos nada
  if (!venta) return null;

  const items = venta.items || venta.saleDetails || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
        
        {/* Header del Modal */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-zinc-100">
              Detalle de Venta <span className="font-mono text-emerald-400">#{venta.id}</span>
            </h3>
            <p className="text-xs text-zinc-400">
              {new Date(venta.createdAt).toLocaleString('es-AR', { 
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
              })} hs.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 text-lg px-2 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Listado de items de la venta */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Productos Vendidos
          </span>
          
          {items.length === 0 ? (
            <p className="text-xs text-zinc-500 italic text-center py-4">
              Sin detalles registrados para esta venta.
            </p>
          ) : (
            <div className="divide-y divide-zinc-800/60 border-t border-b border-zinc-800/60">
              {items.map((item, index) => (
                <div key={item.id || index} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-medium text-zinc-200">
                      {item.product?.name || item.name || `Producto #${item.productId}`}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {item.quantity} un. x ${item.unitPrice?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <p className="font-mono font-semibold text-zinc-300">
                    ${((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con el total */}
        <div className="pt-3 border-t border-zinc-800 flex justify-between items-baseline">
          <span className="text-xs font-semibold text-zinc-400">TOTAL:</span>
          <span className="text-lg font-mono font-bold text-emerald-400">
            ${venta.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-2 rounded-lg text-xs transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}