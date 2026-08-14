import React from 'react';
import { useTheme } from '../components/DashboardLayout'; 

export default function InventarioTable({ productos, onOpenRow, onDelete, providers = [], isEmpleado = false }) {
  const { darkMode } = useTheme();

  const formatearFecha = (fechaRaw) => {
    if (!fechaRaw) return '-';
    const fecha = new Date(fechaRaw);
    if (isNaN(fecha.getTime())) return '-';
    return fecha.toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const obtenerTextoCategoria = (cat) => {
    if (cat === null || cat === undefined) return 'Sin categoría';

    const mapaNumerico = {
      0: 'Bebida',
      1: 'Fruta/Verdura',
      2: 'Lácteo',
      3: 'Snack/Dulce',
      4: 'Grano/Cereal',
      5: 'Enlatado/Conserva',
      6: 'Panadería',
      7: 'Limpieza',
      8: 'Cuidado Personal',
      9: 'Otros'
    };

    if (typeof cat === 'number' || !isNaN(Number(cat))) {
      return mapaNumerico[Number(cat)] || 'Sin categoría';
    }

    const mapaString = {
      'Bebida': 'Bebida',
      'FrutaVerdura': 'Fruta/Verdura',
      'Lacteo': 'Lácteo',
      'SnackDulce': 'Snack/Dulce',
      'GranoCereal': 'Grano/Cereal',
      'EnlatadoConserva': 'Enlatado/Conserva',
      'Panaderia': 'Panadería',
      'Limpieza': 'Limpieza',
      'CuidadoPersonal': 'Cuidado Personal',
      'Otros': 'Otros'
    };

    return mapaString[cat] || cat;
  };

  const totalColumnas = isEmpleado ? 9 : 10;

  return (
    <div className={`border rounded-xl overflow-hidden shadow-xl transition-colors ${
      darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
    }`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className={`border-b font-semibold uppercase tracking-wider whitespace-nowrap ${
              darkMode ? 'border-zinc-800 bg-zinc-900/50 text-zinc-400' : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}>
              <th className="py-3 px-3.5">Código</th>
              <th className="py-3 px-3.5">Producto</th>
              <th className="py-3 px-3.5">Descripción</th>
              <th className="py-3 px-3.5">Categoría</th>
              <th className="py-3 px-3.5">Proveedor</th>
              <th className="py-3 px-3.5 text-right">Precio</th>
              <th className="py-3 px-3.5 text-center">Stock</th>
              <th className="py-3 px-3.5 text-center">Mín.</th>
              <th className="py-3 px-3.5 text-right">Modificación</th>
              {!isEmpleado && <th className="py-3 px-3.5 text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody className={`divide-y text-xs ${
            darkMode ? 'divide-zinc-800 text-zinc-300' : 'divide-slate-200 text-slate-700'
          }`}>
            {productos.length === 0 ? (
              <tr>
                <td colSpan={totalColumnas} className={`p-8 text-center ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                  No se encontraron productos cargados.
                </td>
              </tr>
            ) : (
              productos.map((prod) => {
                const barcode = prod.barcode || prod.Barcode || '-';
                const name = prod.name || prod.Name || 'Sin nombre';
                const description = prod.description || prod.Description || '-';
                const categoria = obtenerTextoCategoria(prod.categoria ?? prod.Categoria ?? prod.category ?? prod.Category);

                const proveedorEncontrado = providers.find(p => p.id === prod.providerId || p.Id === prod.providerId);
                
                const providerName = proveedorEncontrado?.name || 
                                     proveedorEncontrado?.Name || 
                                     prod.providerName || 
                                     prod.ProviderName || 
                                     prod.provider?.name || 
                                     'Sin proveedor';

                const price = prod.price ?? prod.Price ?? 0;
                const stock = prod.stock ?? prod.Stock ?? 0;
                const minimumStock = prod.minimumStock ?? prod.MinimumStock ?? 0;
                
                const rawDate = prod.updatedAt || prod.UpdatedAt || prod.updated_at || prod.lastModified || prod.LastModified;

                return (
                  <tr key={prod.id || prod.Id} className={`transition-colors whitespace-nowrap ${
                    darkMode ? 'hover:bg-zinc-800/20' : 'hover:bg-slate-50'
                  }`}>
                    <td onClick={() => onOpenRow(prod, 'view')} className={`py-3 px-3.5 font-mono text-[11px] cursor-pointer ${
                      darkMode ? 'text-zinc-400 hover:text-emerald-400' : 'text-slate-500 hover:text-[#5BA535]'
                    }`}>{barcode}</td>
                    
                    <td onClick={() => onOpenRow(prod, 'view')} className={`py-3 px-3.5 font-medium max-w-[180px] truncate whitespace-normal cursor-pointer ${
                      darkMode ? 'text-white hover:text-emerald-400' : 'text-slate-900 hover:text-[#5BA535]'
                    }`}>{name}</td>
                    
                    <td onClick={() => onOpenRow(prod, 'view')} className={`py-3 px-3.5 max-w-[180px] truncate whitespace-normal cursor-pointer ${
                      darkMode ? 'text-zinc-400 hover:text-emerald-400' : 'text-slate-500 hover:text-[#5BA535]'
                    }`}>{description}</td>

                    <td onClick={() => onOpenRow(prod, 'view')} className="py-3 px-3.5 cursor-pointer">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${
                        darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {categoria}
                      </span>
                    </td>
                    
                    <td onClick={() => onOpenRow(prod, 'view')} className={`py-3 px-3.5 truncate max-w-[120px] cursor-pointer ${
                      darkMode ? 'text-zinc-400 hover:text-emerald-400' : 'text-slate-500 hover:text-[#5BA535]'
                    }`}>{providerName}</td>
                    
                    <td className={`py-3 px-3.5 text-right font-mono ${darkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
                      ${Number(price).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    
                    <td className="py-3 px-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold inline-block ${
                        stock <= minimumStock 
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                          : darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}>
                        {stock}
                      </span>
                    </td>
                    
                    <td className={`py-3 px-3.5 text-center font-medium ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{minimumStock}</td>
                    <td className={`py-3 px-3.5 text-right text-[11px] ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{formatearFecha(rawDate)}</td>
                    
                    {!isEmpleado && (
                      <td className="py-3 px-3.5 text-center space-x-2">
                        <button
                          onClick={() => onOpenRow(prod, 'edit')}
                          className="text-white bg-[#5BA535] hover:bg-[#1C562A] font-medium text-[11px] px-2.5 py-1.5 rounded-md shadow transition-colors cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => onDelete(prod.id || prod.Id, name)}
                          className={`font-medium text-[11px] px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                            darkMode 
                              ? 'text-zinc-400 hover:text-red-400 bg-zinc-800 hover:bg-zinc-700' 
                              : 'text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          Borrar
                        </button>
                      </td>
                    )}
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