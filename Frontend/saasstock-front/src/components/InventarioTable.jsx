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
    <div className={`border rounded-xl shadow-xl transition-colors overflow-hidden ${
      darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
    }`}>
      {/* Contenedor ancho 100% */}
      <div className="w-full">
        <table className="w-full table-fixed text-left border-collapse text-[10px] md:text-xs">
          <thead>
            <tr className={`border-b font-semibold uppercase tracking-wider ${
              darkMode ? 'border-zinc-800 bg-zinc-900/50 text-zinc-400' : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}>
              <th className="py-3 px-2 w-[8%]">Cód.</th>
              <th className="py-3 px-2 w-[18%]">Producto</th>
              <th className="py-3 px-2 w-[18%]">Descrip.</th>
              <th className="py-3 px-2 w-[12%]">Cat.</th>
              <th className="py-3 px-2 w-[12%]">Prov.</th>
              <th className="py-3 px-2 text-right w-[10%]">Precio</th>
              <th className="py-3 px-2 text-center w-[7%]">Stock</th>
              <th className="py-3 px-2 text-center w-[7%]">Mín.</th>
              {!isEmpleado && <th className="py-3 px-2 text-center w-[8%]">Acción</th>}
            </tr>
          </thead>
          <tbody className={`divide-y ${
            darkMode ? 'divide-zinc-800 text-zinc-300' : 'divide-slate-200 text-slate-700'
          }`}>
            {productos.length === 0 ? (
              <tr>
                <td colSpan={9} className={`p-8 text-center ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                  No se encontraron productos.
                </td>
              </tr>
            ) : (
              productos.map((prod) => {
                // ... (tus constantes de datos se mantienen igual)
                return (
                  <tr key={prod.id || prod.Id} className={`transition-colors truncate ${
                    darkMode ? 'hover:bg-zinc-800/20' : 'hover:bg-slate-50'
                  }`}>
                    <td className="py-2.5 px-2 font-mono truncate">{barcode}</td>
                    <td className="py-2.5 px-2 font-medium truncate">{name}</td>
                    <td className="py-2.5 px-2 truncate">{description}</td>
                    <td className="py-2.5 px-2 truncate">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 truncate block">{categoria}</span>
                    </td>
                    <td className="py-2.5 px-2 truncate">{providerName}</td>
                    <td className="py-2.5 px-2 text-right font-mono truncate">${Number(price).toFixed(0)}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${stock <= minimumStock ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {stock}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center truncate">{minimumStock}</td>
                    {!isEmpleado && (
                      <td className="py-2.5 px-2 text-center">
                        <button onClick={() => onOpenRow(prod, 'edit')} className="text-[#5BA535] hover:underline font-medium">Editar</button>
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