import React from 'react';
import { useTheme } from '../components/DashboardLayout'; 
import { Package, Tag, Truck, DollarSign, BarChart2, Calendar, Edit2, Trash2, Eye } from 'lucide-react';

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
      
      {/* 📱 VISTA MÓVIL: Tarjetas (Se muestra solo en pantallas chicas) */}
      <div className="block md:hidden divide-y divide-zinc-200 dark:divide-zinc-800">
        {productos.length === 0 ? (
          <div className={`p-12 text-center text-xs ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
            No se encontraron productos cargados.
          </div>
        ) : (
          productos.map((prod) => {
            const barcode = prod.barcode || prod.Barcode || '-';
            const name = prod.name || prod.Name || 'Sin nombre';
            const description = prod.description || prod.Description || '-';
            const categoria = obtenerTextoCategoria(prod.categoria ?? prod.Categoria ?? prod.category ?? prod.Category);

            const proveedorEncontrado = providers.find(p => p.id === prod.providerId || p.Id === prod.providerId);
            const providerName = proveedorEncontrado?.name || proveedorEncontrado?.Name || prod.providerName || prod.ProviderName || prod.provider?.name || 'Sin proveedor';

            const price = prod.price ?? prod.Price ?? 0;
            const stock = prod.stock ?? prod.Stock ?? 0;
            const minimumStock = prod.minimumStock ?? prod.MinimumStock ?? 0;
            const rawDate = prod.updatedAt || prod.UpdatedAt || prod.updated_at || prod.lastModified || prod.LastModified;

            return (
              <div 
                key={prod.id || prod.Id} 
                className={`p-4 space-y-3 transition-colors ${darkMode ? 'bg-zinc-900/40 hover:bg-zinc-800/20' : 'bg-white hover:bg-slate-50'}`}
              >
                {/* Cabecera de tarjeta: Nombre y Código */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider ${
                      darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {barcode}
                    </span>
                    <h3 
                      onClick={() => onOpenRow(prod, 'view')} 
                      className={`text-sm font-bold mt-1 cursor-pointer ${darkMode ? 'text-white hover:text-emerald-400' : 'text-slate-900 hover:text-[#5BA535]'}`}
                    >
                      {name}
                    </h3>
                  </div>
                  
                  {/* Precio destacado */}
                  <div className="text-right">
                    <span className={`text-sm font-mono font-bold ${darkMode ? 'text-emerald-400' : 'text-[#5BA535]'}`}>
                      ${Number(price).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Descripción y Categoría / Proveedor */}
                <div className={`text-xs space-y-1 ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                  {description !== '-' && <p className="italic">"{description}"</p>}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {categoria}
                    </span>
                    <span className="text-[11px] opacity-80">• {providerName}</span>
                  </div>
                </div>

                {/* Stock e indicadores de estado */}
                <div className={`flex items-center justify-between pt-2 border-t text-xs ${darkMode ? 'border-zinc-800/80' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-3">
                    <div>
                      <span className={`text-[10px] uppercase block ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Stock</span>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold inline-block mt-0.5 ${
                        stock <= minimumStock 
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                          : darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}>
                        {stock} (Mín: {minimumStock})
                      </span>
                    </div>
                  </div>

                  <div className={`text-[10px] text-right ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Modif: {formatearFecha(rawDate)}
                  </div>
                </div>

                {/* Botones de acción móvil */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => onOpenRow(prod, 'view')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      darkMode ? 'bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Ver detalle
                  </button>

                  {!isEmpleado && (
                    <>
                      <button
                        onClick={() => onOpenRow(prod, 'edit')}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-medium bg-[#5BA535] text-white flex items-center justify-center gap-1.5 hover:opacity-90 transition-all cursor-pointer shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button
                        onClick={() => onDelete(prod.id || prod.Id, name)}
                        className={`p-2 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                          darkMode ? 'bg-red-950/40 border-red-900/50 text-red-400 hover:bg-red-900/60' : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                        }`}
                        title="Borrar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* 💻 VISTA ESCRITORIO: Tabla tradicional (Se oculta en celulares, se muestra desde pantallas medianas md en adelante) */}
      <div className="hidden md:block w-full overflow-x-auto">
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
                const providerName = proveedorEncontrado?.name || proveedorEncontrado?.Name || prod.providerName || prod.ProviderName || prod.provider?.name || 'Sin proveedor';

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