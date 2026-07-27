import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { QRCodeSVG } from 'qrcode.react';
import { Search, Calendar, Loader2, DollarSign, ShoppingBag, Package, AlertTriangle } from 'lucide-react';

export default function Estadisticas() {
  const [name, setName] = useState('');
  const [period, setPeriod] = useState('');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Recuperamos el Token de la sesión actual de la PC
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');

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

  // Construcción de la URL que leerá la cámara del celular
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:7046';
  const qrDownloadUrl = token 
    ? `${baseUrl}/api/Stats/download-pdf?token=${encodeURIComponent(token)}${name ? `&name=${encodeURIComponent(name)}` : ''}${period ? `&period=${encodeURIComponent(period)}` : ''}`
    : '';

  return (
    <div className="p-6 bg-zinc-950 min-h-screen space-y-6 text-zinc-100">
      
      {/* Encabezado */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Rendimiento del Inventario</h1>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o código de barras..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500 pointer-events-none" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer"
            >
              <option value="">Cualquier fecha de actualización</option>
              <option value="hoy">Actualizados Hoy</option>
              <option value="semana">Actualizados esta Semana</option>
              <option value="mes">Actualizados este Mes</option>
              <option value="anio">Actualizados este Año</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-zinc-500 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          <span>Procesando métricas de inventario...</span>
        </div>
      ) : error ? (
        <div className="bg-red-950/20 border border-red-900/50 text-red-400 p-4 rounded-xl text-center text-sm">
          {error}
        </div>
      ) : data ? (
        <>
          {/* Métricas KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard 
              title="Ventas del Grupo" 
              value={`$${data.metrics.totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`} 
              icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
              colorClass="bg-emerald-950/30 border-emerald-900/50"
            />
            <KpiCard 
              title="Unidades Vendidas" 
              value={data.metrics.totalSalesCount} 
              icon={<ShoppingBag className="w-5 h-5 text-blue-400" />}
              colorClass="bg-blue-950/30 border-blue-900/50"
            />
            <KpiCard 
              title="Variedad de Productos" 
              value={data.metrics.activeProductsCount} 
              icon={<Package className="w-5 h-5 text-indigo-400" />}
              colorClass="bg-indigo-950/30 border-indigo-900/50"
              subtitle="Coincidentes con tu filtro"
            />
            <KpiCard 
              title="Stock Crítico en Filtro" 
              value={data.metrics.lowStockAlertsCount} 
              icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
              colorClass="bg-amber-950/30 border-amber-900/50"
              subtitle="Por debajo del mínimo"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tabla Productos */}
            <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-xl border border-zinc-800 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-zinc-100 text-base mb-4">Productos más vendidos bajo este filtro</h3>
                {data.topProducts.length === 0 ? (
                  <p className="text-zinc-500 text-sm py-8 text-center">No se registran ventas para los productos de este filtro en los últimos 30 días.</p>
                ) : (
                  <div className="space-y-4">
                    {data.topProducts.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-800/40 last:border-none">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-200 truncate">{p.productName}</p>
                          <p className="text-xs text-zinc-500">{p.salesCount} unidades despachadas</p>
                        </div>
                        <span className="text-sm font-bold text-zinc-100 shrink-0">
                          {`$${p.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Widget QR para Celular */}
            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="lg:col-span-1 flex flex-col items-center text-center space-y-3">
                  <h3 className="text-white font-semibold text-lg">Descargar Reporte</h3>

                  <div className="p-3 bg-white rounded-lg shadow-md border border-zinc-700 flex items-center justify-center min-h-[160px] min-w-[160px]">
                    {qrDownloadUrl ? (
                      <QRCodeSVG 
                        value={qrDownloadUrl}
                        size={160}
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                        level="M"
                      />
                    ) : (
                      <span className="text-xs text-zinc-500">Sesión no válida</span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium pt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Listo para escanear
                  </span>
                </div>
              </div>
            </div>

          </div>
        </>
      ) : null}
    </div>
  );
}

function KpiCard({ title, value, icon, colorClass, subtitle }) {
  return (
    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-sm flex justify-between items-start">
      <div className="space-y-1">
        <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">{title}</span>
        <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
        {subtitle && <p className="text-[10px] text-zinc-500">{subtitle}</p>}
      </div>
      <div className={`p-2.5 rounded-lg border ${colorClass}`}>{icon}</div>
    </div>
  );
}