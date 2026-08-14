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
    <div className={`w-full rounded-2xl border transition-colors shadow-sm overflow-hidden ${darkMode ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200'}`}>
      <div className="w-full overflow-hidden">
        <table className="w-full table-fixed text-left border-collapse text-xs">
          <thead>
            <tr className={`border-b font-semibold uppercase tracking-wider whitespace-nowrap ${
              darkMode ? 'border-zinc-800/80 bg-zinc-900/50 text-zinc-400' : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}>
              <th className="py-3.5 px-4 w-[8%]">Código</th>
              <th className="py-3.5 px-4 w-[12%]">Producto</th>
              <th className="py-3.5 px-4 w-[14%]">Descripción</th>
              <th className="py-3.5 px-4 w-[10%]">Categoría</th>
              <th className="py-3.5 px-4 w-[10%]">Proveedor</th>
              <th className="py-3.5 px-4 w-[9%] text-right">Precio</th>
              <th className="py-3.5 px-4 w-[6%] text-center">Stock</th>
              <th className="py-3.5 px-4 w-[6%] text-center">Mín.</th>
              <th className="py-3.5 px-4 w-[9%] text-right">Modif.</th>
              {!isEmpleado && <th className="py-3.5 px-4 w-[16%] text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody className={`divide-y text-xs ${
            darkMode ? 'divide-zinc-800/60 text-zinc-300' : 'divide-slate-100 text-slate-700'
          }`}>
            {productos.length === 0 ? (
              <tr>
                <td colSpan={totalColumnas} className={`p-12 text-center text-xs ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
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
                    darkMode ? 'hover:bg-zinc-800/30' : 'hover:bg-slate-50/80'
                  }`}>
                    {/* Código */}
                    <td onClick={() => onOpenRow(prod, 'view')} className={`py-3.5 px-4 font-mono truncate cursor-pointer ${
                      darkMode ? 'text-zinc-400 hover:text-emerald-400' : 'text-slate-500 hover:text-[#5BA535]'
                    }`} title={barcode}>{barcode}</td>
                    
                    {/* Producto */}
                    <td onClick={() => onOpenRow(prod, 'view')} className={`py-3.5 px-4 font-semibold truncate cursor-pointer ${
                      darkMode ? 'text-zinc-200 hover:text-emerald-400' : 'text-slate-800 hover:text-[#5BA535]'
                    }`} title={name}>{name}</td>
                    
                    {/* Descripción */}
                    <td onClick={() => onOpenRow(prod, 'view')} className={`py-3.5 px-4 truncate cursor-pointer ${
                      darkMode ? 'text-zinc-400 hover:text-emerald-400' : 'text-slate-500 hover:text-[#5BA535]'
                    }`} title={description}>{description}</td>

                    {/* Categoría */}
                    <td onClick={() => onOpenRow(prod, 'view')} className="py-3.5 px-4 truncate cursor-pointer">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium inline-block truncate max-w-full ${
                        darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'
                      }`} title={categoria}>
                        {categoria}
                      </span>
                    </td>
                    
                    {/* Proveedor */}
                    <td onClick={() => onOpenRow(prod, 'view')} className={`py-3.5 px-4 truncate cursor-pointer ${
                      darkMode ? 'text-zinc-400 hover:text-emerald-400' : 'text-slate-500 hover:text-[#5BA535]'
                    }`} title={providerName}>{providerName}</td>
                    
                    {/* Precio */}
                    <td className={`py-3.5 px-4 text-right font-mono truncate ${darkMode ? 'text-zinc-200' : 'text-slate-800'}`}>
                      ${Number(price).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    
                    {/* Stock */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold inline-block ${
                        stock <= minimumStock 
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                          : darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}>
                        {stock}
                      </span>
                    </td>
                    
                    {/* Stock Mínimo */}
                    <td className={`py-3.5 px-4 text-center font-medium truncate ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{minimumStock}</td>
                    
                    {/* Modificación */}
                    <td className={`py-3.5 px-4 text-right text-[11px] truncate ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`} title={formatearFecha(rawDate)}>{formatearFecha(rawDate)}</td>
                    
                    {/* Acciones */}
                    {!isEmpleado && (
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onOpenRow(prod, 'edit')}
                            className="text-white bg-[#5BA535] hover:opacity-90 font-medium text-[11px] px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => onDelete(prod.id || prod.Id, name)}
                            className={`font-medium text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                              darkMode 
                                ? 'text-zinc-400 hover:text-red-400 bg-zinc-800/80 hover:bg-zinc-800' 
                                : 'text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            Borrar
                          </button>
                        </div>
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