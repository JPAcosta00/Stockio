import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Calendar, 
  Loader2, 
  BarChart3, 
  ArrowUpRight 
} from 'lucide-react';

export default function Estadisticas() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [periodo, setPeriodo] = useState('mes'); // 'dia', 'mes', 'año'

  useEffect(() => {
    fetchEstadisticas();
  }, [periodo]);

  const fetchEstadisticas = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get(`/estadisticas?periodo=${periodo}`);
      setStats(response.data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar las estadísticas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ENCABEZADO DE LA SECCIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#1C562A]/40 border border-[#5BA535]/30 flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6 text-[#5BA535]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Estadísticas y Rendimiento</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Analizá el comportamiento de ventas y stock de tu negocio.</p>
          </div>
        </div>

        {/* SELECTOR DE PERÍODO */}
        <div className="flex items-center bg-zinc-950 border border-zinc-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setPeriodo('dia')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              periodo === 'dia'
                ? 'bg-[#5BA535] text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Día
          </button>
          <button
            onClick={() => setPeriodo('mes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              periodo === 'mes'
                ? 'bg-[#5BA535] text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Mes
          </button>
          <button
            onClick={() => setPeriodo('año')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              periodo === 'año'
                ? 'bg-[#5BA535] text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Año
          </button>
        </div>
      </div>

      {/* MENSAJE DE ERROR */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-xl text-center">
          {error}
        </div>
      )}

      {/* ESTADO DE CARGA */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-[#5BA535] mb-3" />
          <p className="text-xs font-medium text-zinc-400">Cargando métricas...</p>
        </div>
      ) : (
        <>
          {/* TARJETAS DE MÉTRICAS PRINCIPALES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Ventas */}
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:border-zinc-700 transition-all">
              <div>
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Ventas Totales</p>
                <h3 className="text-2xl font-extrabold text-white mt-1">
                  ${stats?.totalVentas?.toLocaleString() || '0'}
                </h3>
                <div className="flex items-center gap-1 text-[11px] text-[#5BA535] font-medium mt-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Período actual</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#5BA535]/10 border border-[#5BA535]/20 flex items-center justify-center text-[#5BA535]">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* Cantidad de Transacciones */}
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:border-zinc-700 transition-all">
              <div>
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Transacciones</p>
                <h3 className="text-2xl font-extrabold text-white mt-1">
                  {stats?.cantidadTransacciones || 0}
                </h3>
                <span className="text-[11px] text-zinc-500 font-medium mt-1 block">Operaciones registradas</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>

            {/* Productos más vendidos */}
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:border-zinc-700 transition-all">
              <div>
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Prod. Movilizados</p>
                <h3 className="text-2xl font-extrabold text-white mt-1">
                  {stats?.productosMovilizados || 0}
                </h3>
                <span className="text-[11px] text-zinc-500 font-medium mt-1 block">Unidades totales</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                <Package className="w-5 h-5" />
              </div>
            </div>

            {/* Ticket Promedio */}
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:border-zinc-700 transition-all">
              <div>
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Ticket Promedio</p>
                <h3 className="text-2xl font-extrabold text-white mt-1">
                  ${stats?.ticketPromedio?.toLocaleString() || '0'}
                </h3>
                <span className="text-[11px] text-zinc-500 font-medium mt-1 block">Por operación</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* SECCIÓN INFERIOR: DETALLES O LISTADOS ADICIONALES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Productos */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#5BA535]" />
                <span>Productos más vendidos</span>
              </h2>

              {stats?.topProductos && stats.topProductos.length > 0 ? (
                <div className="space-y-3">
                  {stats.topProductos.map((prod, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-300 font-bold text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs font-semibold text-zinc-200">{prod.nombre}</span>
                      </div>
                      <span className="text-xs font-bold text-[#5BA535] bg-[#5BA535]/10 border border-[#5BA535]/20 px-2.5 py-1 rounded-lg">
                        {prod.cantidad} un.
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 text-center py-8">No hay datos suficientes para este período.</p>
              )}
            </div>

            {/* Resumen de actividad / Gráfico auxiliar */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#5BA535]" />
                  <span>Resumen del Periodo</span>
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2.5 border-b border-zinc-800/80 text-xs">
                    <span className="text-zinc-400">Total Ingresos Brutos</span>
                    <span className="font-semibold text-white">${stats?.totalVentas?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-zinc-800/80 text-xs">
                    <span className="text-zinc-400">Total Operaciones</span>
                    <span className="font-semibold text-white">{stats?.cantidadTransacciones || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 text-xs">
                    <span className="text-zinc-400">Eficiencia Promedio</span>
                    <span className="font-semibold text-[#5BA535]">Óptima</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl text-center">
                <p className="text-[11px] text-zinc-400">Los datos se actualizan en tiempo real según el movimiento de caja y ventas.</p>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}