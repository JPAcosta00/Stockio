import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../components/DashboardLayout'; 
import { Search, Calendar, Loader2, DollarSign, ShoppingBag, Package, AlertTriangle, Download } from 'lucide-react';
import SalesTimelineChart from '../components/SalesTimelineChart.jsx';

export default function Estadisticas() {
  const { showAlert } = useAlert();
  const { darkMode } = useTheme(); // <-- Usamos el hook global aquí

  const [name, setName] = useState('');
  const [period, setPeriod] = useState('');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get('/stats/dashboard', {
          params: {
            name: name || undefined,
            period: period || undefined
          }
        });
        setData(response.data);
      } catch (err) {
        console.error("Error al obtener estadísticas:", err);
        setError("No se pudieron cargar las estadísticas. Intentalo de nuevo.");
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [name, period]);

  const handleDownloadPdf = async (filterName, filterPeriod) => {
    try {
      setDownloadingPdf(true);

      const cleanName = typeof filterName === 'string' ? filterName : undefined;
      const cleanPeriod = typeof filterPeriod === 'string' ? filterPeriod : undefined;

      const response = await apiClient.get('/stats/download-pdf', {
        responseType: 'blob',
        params: {
          name: cleanName,
          period: cleanPeriod
        }
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const dateFormatted = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `Estadisticas_${dateFormatted}.pdf`);

      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar el PDF de estadísticas:", err);
      showAlert("No se pudo generar el reporte de estadísticas. Intentá nuevamente.", "error");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-200 p-2 sm:p-6 md:p-8 flex flex-col space-y-6 ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Encabezado */}
      <div className={`w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-6 rounded-2xl border transition-colors shadow-sm ${darkMode ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-white border-slate-200'}`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Rendimiento del Inventario</h1>
          <p className={`text-xs mt-1 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Estadísticas y métricas generales del negocio hasta el momento.</p>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
          {/* Botón Descargar PDF */}
          <button
            onClick={() => handleDownloadPdf(name, period)}
            disabled={downloadingPdf || loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-90 text-white px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all shadow-md shadow-emerald-950/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {downloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generando PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white" />
                <span>Descargar Reporte PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className={`w-full grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 rounded-2xl border transition-colors shadow-sm ${darkMode ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200'}`}>
        <div className="relative">
          <Search className={`absolute left-3.5 top-3 h-4 w-4 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Buscar por nombre o código de barras..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#5BA535]/50 transition-all border ${
              darkMode 
                ? 'bg-zinc-950 border-zinc-800/80 text-zinc-200 placeholder-zinc-500' 
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="relative">
          <Calendar className={`absolute left-3.5 top-3 h-4 w-4 pointer-events-none ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`} />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#5BA535]/50 appearance-none cursor-pointer transition-all border ${
              darkMode 
                ? 'bg-zinc-950 border-zinc-800/80 text-zinc-200' 
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="">Todas las fechas</option>
            <option value="hoy">Ventas de Hoy</option>
            <option value="semana">Ventas de esta Semana</option>
            <option value="mes">Ventas de este Mes</option>
            <option value="anio">Ventas de este Año</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={`flex h-64 items-center justify-center gap-3 rounded-2xl border ${darkMode ? 'bg-zinc-900/30 border-zinc-800/50 text-zinc-500' : 'bg-white border-slate-200 text-slate-500'}`}>
          <Loader2 className="w-6 h-6 animate-spin text-[#5BA535]" />
          <span className="text-xs font-medium">Procesando métricas de inventario...</span>
        </div>
      ) : error ? (
        <div className="bg-red-950/25 border border-red-900/50 text-red-400 p-4 rounded-xl text-center text-xs font-medium">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-6 w-full">
          {/* Métricas KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard 
              title="Ventas del Grupo" 
              value={`$${data.metrics.totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`} 
              icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
              colorClass="bg-[#1C562A]/20 border-[#5BA535]/30 text-[#5BA535]"
              darkMode={darkMode}
            />
            <KpiCard 
              title="Unidades Vendidas" 
              value={data.metrics.totalSalesCount} 
              icon={<ShoppingBag className="w-5 h-5 text-blue-400" />}
              colorClass="bg-blue-950/30 border-blue-900/50 text-blue-400"
              darkMode={darkMode}
            />
            <KpiCard 
              title="Variedad de Productos" 
              value={data.metrics.activeProductsCount} 
              icon={<Package className="w-5 h-5 text-indigo-400" />}
              colorClass="bg-indigo-950/30 border-indigo-900/50 text-indigo-400"
              subtitle="Coincidentes con tu filtro"
              darkMode={darkMode}
            />
            <KpiCard 
              title="Stock Crítico en Filtro" 
              value={data.metrics.lowStockAlertsCount} 
              icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
              colorClass="bg-amber-950/30 border-amber-900/50 text-amber-400"
              subtitle="Por debajo del mínimo"
              darkMode={darkMode}
            />
          </div>

          {/* Gráfico de Línea de Tiempo */}
          <div className={`p-4 sm:p-6 rounded-2xl border transition-colors shadow-sm overflow-x-auto ${darkMode ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200'}`}>
            <SalesTimelineChart data={data.salesTimeline} darkMode={darkMode} />
          </div>

          {/* Tabla Productos */}
          <div className={`p-4 sm:p-6 rounded-2xl border transition-colors shadow-sm ${darkMode ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200'}`}>
            <h3 className={`font-bold text-sm mb-4 ${darkMode ? 'text-zinc-100' : 'text-slate-800'}`}>Productos más vendidos bajo este filtro</h3>
            {data.topProducts.length === 0 ? (
              <p className={`text-xs py-8 text-center ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>No se registran ventas para los productos de este filtro en los últimos 30 días.</p>
            ) : (
              <div className={`divide-y ${darkMode ? 'divide-zinc-800/60' : 'divide-slate-100'}`}>
                {data.topProducts.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 first:pt-0 last:pb-0 gap-4">
                    <div className="min-w-0 pr-4">
                      <p className={`text-xs font-semibold truncate ${darkMode ? 'text-zinc-200' : 'text-slate-800'}`}>{p.productName}</p>
                      <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{p.salesCount} unidades despachadas</p>
                    </div>
                    <span className={`text-xs font-bold shrink-0 ${darkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
                      {`$${p.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function KpiCard({ title, value, icon, colorClass, subtitle, darkMode }) {
  return (
    <div className={`p-5 rounded-2xl border transition-all shadow-sm flex justify-between items-start ${
      darkMode ? 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'
    }`}>
      <div className="space-y-1 min-w-0 pr-2">
        <span className={`text-[10px] font-bold tracking-wider uppercase block ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>{title}</span>
        <h3 className={`text-xl font-extrabold tracking-tight truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{value}</h3>
        {subtitle && <p className={`text-[10px] font-medium ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{subtitle}</p>}
      </div>
      <div className={`p-2.5 rounded-xl border shrink-0 flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
}