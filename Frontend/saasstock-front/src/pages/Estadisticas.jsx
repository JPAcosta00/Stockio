import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useAlert } from '../context/AlertContext'; // Importado
import { Search, Calendar, Loader2, DollarSign, ShoppingBag, Package, AlertTriangle, Download } from 'lucide-react';
import SalesTimelineChart from '../components/SalesTimelineChart.jsx';

export default function Estadisticas() {
  const { showAlert } = useAlert(); // Hook para alertas
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
    <div className="p-4 sm:p-8 bg-zinc-950 min-h-screen space-y-8 text-zinc-100 max-w-7xl mx-auto">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/80 backdrop-blur-sm shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Rendimiento del Inventario</h1>
          <p className="text-xs text-zinc-400 mt-1">Estadísticas y métricas generales del negocio hasta el momento.</p>
        </div>

        {/* Botón Descargar PDF */}
        <button
          onClick={() => handleDownloadPdf(name, period)}
          disabled={downloadingPdf || loading}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-90 text-white px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all shadow-md shadow-emerald-950/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 w-full sm:w-auto cursor-pointer"
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

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900/70 p-5 rounded-2xl border border-zinc-800 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o código de barras..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5BA535]/50 transition-all"
          />
        </div>

        <div className="relative">
          <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500 pointer-events-none" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#5BA535]/50 appearance-none cursor-pointer transition-all"
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
        <div className="flex h-64 items-center justify-center text-zinc-500 gap-3 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
          <Loader2 className="w-6 h-6 animate-spin text-[#5BA535]" />
          <span className="text-xs font-medium">Procesando métricas de inventario...</span>
        </div>
      ) : error ? (
        <div className="bg-red-950/20 border border-red-900/50 text-red-400 p-4 rounded-xl text-center text-xs font-medium">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Métricas KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard 
              title="Ventas del Grupo" 
              value={`$${data.metrics.totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`} 
              icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
              colorClass="bg-[#1C562A]/20 border-[#5BA535]/30 text-[#5BA535]"
            />
            <KpiCard 
              title="Unidades Vendidas" 
              value={data.metrics.totalSalesCount} 
              icon={<ShoppingBag className="w-5 h-5 text-blue-400" />}
              colorClass="bg-blue-950/30 border-blue-900/50 text-blue-400"
            />
            <KpiCard 
              title="Variedad de Productos" 
              value={data.metrics.activeProductsCount} 
              icon={<Package className="w-5 h-5 text-indigo-400" />}
              colorClass="bg-indigo-950/30 border-indigo-900/50 text-indigo-400"
              subtitle="Coincidentes con tu filtro"
            />
            <KpiCard 
              title="Stock Crítico en Filtro" 
              value={data.metrics.lowStockAlertsCount} 
              icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
              colorClass="bg-amber-950/30 border-amber-900/50 text-amber-400"
              subtitle="Por debajo del mínimo"
            />
          </div>

          {/* Gráfico de Línea de Tiempo */}
          <div className="bg-zinc-900/70 p-6 rounded-2xl border border-zinc-800 shadow-sm overflow-x-auto">
            <SalesTimelineChart data={data.salesTimeline} />
          </div>

          {/* Tabla Productos */}
          <div className="bg-zinc-900/70 p-6 rounded-2xl border border-zinc-800 shadow-sm">
            <h3 className="font-bold text-zinc-100 text-sm mb-4">Productos más vendidos bajo este filtro</h3>
            {data.topProducts.length === 0 ? (
              <p className="text-zinc-500 text-xs py-8 text-center">No se registran ventas para los productos de este filtro en los últimos 30 días.</p>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {data.topProducts.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 first:pt-0 last:pb-0 gap-4">
                    <div className="min-w-0 pr-4">
                      <p className="text-xs font-semibold text-zinc-200 truncate">{p.productName}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{p.salesCount} unidades despachadas</p>
                    </div>
                    <span className="text-xs font-bold text-zinc-100 shrink-0">
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

function KpiCard({ title, value, icon, colorClass, subtitle }) {
  return (
    <div className="bg-zinc-900/70 p-5 rounded-2xl border border-zinc-800 shadow-sm flex justify-between items-start transition-all hover:border-zinc-700">
      <div className="space-y-1 min-w-0 pr-2">
        <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase block">{title}</span>
        <h3 className="text-xl font-extrabold text-white tracking-tight truncate">{value}</h3>
        {subtitle && <p className="text-[10px] text-zinc-500 font-medium">{subtitle}</p>}
      </div>
      <div className={`p-2.5 rounded-xl border shrink-0 flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
}