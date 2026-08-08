import React from 'react';

export default function InventarioTable({ productos, onOpenRow, onDelete, providers = [] }) {
  const formatearFecha = (fechaRaw) => {
    if (!fechaRaw) return '-';
    const fecha = new Date(fechaRaw);
    return fecha.toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
              <th className="p-4">Cód. Barras</th>
              <th className="p-4">Producto</th>
              <th className="p-4">Descripción</th>
              <th className="p-4">Proveedor</th>
              <th className="p-4 text-right">Precio</th>
              <th className="p-4 text-center">Stock Act.</th>
              <th className="p-4 text-center">Stock Mín.</th>
              <th className="p-4 text-right">Última Modificación</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-sm text-zinc-300">
            {productos.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-zinc-500">
                  No se encontraron productos cargados.
                </td>
              </tr>
            ) : (
              productos.map((prod) => {
                const barcode = prod.barcode || '-';
                const name = prod.name || 'Sin nombre';
                const description = prod.description || '-';

                // Cruce infalible: Busca el proveedor por ID en la lista general o toma las propiedades alternativas
                const proveedorEncontrado = providers.find(p => p.id === prod.providerId || p.Id === prod.providerId);
                
                const providerName = proveedorEncontrado?.name || 
                                     proveedorEncontrado?.Name || 
                                     prod.providerName || 
                                     prod.ProviderName || 
                                     prod.provider?.name || 
                                     'Sin proveedor';

                const price = prod.price ?? 0;
                const stock = prod.stock ?? 0;
                const minimumStock = prod.minimumStock ?? 0;

                return (
                  <tr key={prod.id} className="hover:bg-zinc-800/20 transition-colors whitespace-nowrap">
                    <td onClick={() => onOpenRow(prod, 'view')} className="p-4 font-mono text-zinc-400 text-xs cursor-pointer hover:text-emerald-400">{barcode}</td>
                    <td onClick={() => onOpenRow(prod, 'view')} className="p-4 font-medium text-white max-w-xs truncate whitespace-normal cursor-pointer hover:text-emerald-400">{name}</td>
                    <td onClick={() => onOpenRow(prod, 'view')} className="p-4 text-zinc-400 max-w-sm truncate whitespace-normal cursor-pointer hover:text-emerald-400">{description}</td>
                    <td onClick={() => onOpenRow(prod, 'view')} className="p-4 text-zinc-400 cursor-pointer hover:text-emerald-400">{providerName}</td>
                    
                    <td className="p-4 text-right font-mono text-zinc-100">
                      ${Number(price).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-block ${stock <= minimumStock ? 'bg-red-500/10 text-red-400 border border-red-500/10' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {stock} un.
                      </span>
                    </td>
                    
                    <td className="p-4 text-center text-zinc-500 font-medium">{minimumStock} un.</td>
                    <td className="p-4 text-right text-zinc-500 text-xs">{formatearFecha(prod.updatedAt)}</td>
                    
                    <td className="p-4 text-center space-x-2">
                      <button
                        onClick={() => onOpenRow(prod, 'edit')}
                        className="text-zinc-300 hover:text-white bg-blue-600 hover:bg-blue-500 font-medium text-xs px-2.5 py-1 rounded-md shadow-md transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(prod.id, name)}
                        className="text-zinc-400 hover:text-red-400 bg-zinc-800 hover:bg-zinc-700 font-medium text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        Borrar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}