import React from 'react';
import { useTheme } from './DashboardLayout';
import { BarChart3, Layers } from 'lucide-react';

export default function GraficoVentasPorCategoria({ ventasHoy = [] }) {
  const { darkMode } = useTheme();

  const categoriasMap = {};

  ventasHoy.forEach((venta) => {
    // Soporta tanto si vienen en un array 'items' o 'detalles', o si es un objeto plano
    const itemsVenta = venta.items || venta.detalles || venta.productos || [venta];

    itemsVenta.forEach((item) => {
    
      const categoria = 
        item.categoryName || 
        item.CategoryName || 
        item.product?.category?.name || 
        'Sin Categoría';

    
      const cantidad = Number(item.quantity || item.cantidad || 1);
      const unitPrice = Number(item.unitPrice || item.precioUnitario || item.precio || 0);
      const subtotalItem = Number(item.subtotal || (cantidad * unitPrice));

      if (!categoriasMap[categoria]) {
        categoriasMap[categoria] = { cantidad: 0, total: 0 };
      }
      categoriasMap[categoria].cantidad += cantidad;
      categoriasMap[categoria].total += subtotalItem;
    });
  });

  const categoriasArray = Object.keys(categoriasMap).map((cat) => ({
    name: cat,
    cantidad: categoriasMap[cat].cantidad,
    total: categoriasMap[cat].total,
  }));

  // Ordenar de mayor a menor según el total vendido
  categoriasArray.sort((a, b) => b.total - a.total);

  const maxTotal = Math.max(...categoriasArray.map((c) => c.total), 1);

  return (
    <div className={`border rounded-2xl p-5 space-y-4 shadow-xl transition-colors flex flex-col justify-between ${
      darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
    }`}>
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <h2 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Ventas por Categoría (Hoy)</h2>
            <p className={`text-[10px] ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Desglose de facturación por rubro.</p>
          </div>
        </div>

        {categoriasArray.length === 0 ? (
          <div className={`text-center py-10 text-xs ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <span>Sin datos de categorías para la jornada de hoy.</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {categoriasArray.map((cat, index) => {
              const porcentajeBarra = Math.round((cat.total / maxTotal) * 100);
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-medium truncate max-w-[60%] ${darkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                      {cat.name}
                    </span>
                    <span className={`font-mono font-bold ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      ${cat.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })} <span className="text-[10px] font-normal opacity-70">({cat.cantidad} un.)</span>
                    </span>
                  </div>
                  {/* Barra de progreso visual */}
                  <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-zinc-950' : 'bg-zinc-100'}`}>
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(porcentajeBarra, 5)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={`pt-3 border-t text-[11px] flex justify-between items-center ${darkMode ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-400'}`}>
        <span>Total categorías: {categoriasArray.length}</span>
        <span className="font-mono">Actualizado en vivo</span>
      </div>
    </div>
  );
}