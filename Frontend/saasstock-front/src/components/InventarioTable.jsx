import React from 'react';
import { useTheme } from '../components/DashboardLayout'; 

export default function InventarioTable({ productos, onOpenRow, onDelete, providers = [] }) {
  const { darkMode } = useTheme(); // <-- 2. Reemplazado el soporte estricto oscuro por el hook global

  const formatearFecha = (fechaRaw) => {
    if (!fechaRaw) return '-';
    const fecha = new Date(fechaRaw);
    return fecha.toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <div className={`border rounded-xl overflow-hidden shadow-xl transition-colors ${
      darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
    }`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`border-b text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
              darkMode ? 'border-zinc-800 bg-zinc-900/50 text-zinc-400' : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}>
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
          <tbody className={`divide-y text-sm ${
            darkMode ? 'divide-zinc-800 text-zinc-300' : 'divide-slate-200 text-slate-700'
          }`}>
            {productos.length === 0 ? (
              <tr>
                <td colSpan={9} className={`p-8 text-center ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
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
                  <tr key={prod.id} className={`transition-colors whitespace-nowrap ${
                    darkMode ? 'hover:bg-zinc-800/20' : 'hover:bg-slate-50'
                  }`}>
                    <td onClick={() => onOpenRow(prod, 'view')} className={`p-4 font-mono text-xs cursor-pointer ${
                      darkMode ? 'text-zinc-400 hover:text-emerald-400' : 'text-slate-500 hover:text-[#5BA535]'
                    }`}>{barcode}</td>
                    
                    <td onClick={() => onOpenRow(prod, 'view')} className={`p-4 font-medium max-w-xs truncate whitespace-normal cursor-pointer ${
                      darkMode ? 'text-white hover:text-emerald-400' : 'text-slate-900 hover:text-[#5BA535]'
                    }`}>{name}</td>
                    
                    <td onClick={() => onOpenRow(prod, 'view')} className={`p-4 max-w-sm truncate whitespace-normal cursor-pointer ${
                      darkMode ? 'text-zinc-400 hover:text-emerald-400' : 'text-slate-500 hover:text-[#5BA535]'
                    }`}>{description}</td>
                    
                    <td onClick={() => onOpenRow(prod, 'view')} className={`p-4 cursor-pointer ${
                      darkMode ? 'text-zinc-400 hover:text-emerald-400' : 'text-slate-500 hover:text-[#5BA535]'
                    }`}>{providerName}</td>
                    
                    <td className={`p-4 text-right font-mono ${darkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
                      ${Number(price).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-block ${
                        stock <= minimumStock 
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                          : darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}>
                        {stock} un.
                      </span>
                    </td>
                    
                    <td className={`p-4 text-center font-medium ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{minimumStock} un.</td>
                    <td className={`p-4 text-right text-xs ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{formatearFecha(prod.updatedAt)}</td>
                    
                    <td className="p-4 text-center space-x-2">
                      <button
                        onClick={() => onOpenRow(prod, 'edit')}
                        className="text-white bg-[#5BA535] hover:bg-[#1C562A] font-medium text-xs px-2.5 py-1 rounded-md shadow-md transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(prod.id, name)}
                        className={`font-medium text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          darkMode 
                            ? 'text-zinc-400 hover:text-red-400 bg-zinc-800 hover:bg-zinc-700' 
                            : 'text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                        }`}
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