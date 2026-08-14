import React from 'react';
import { useTheme } from '../components/DashboardLayout'; 
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function SalesTimelineChart({ data = [] }) {
  const { darkMode } = useTheme(); 

  if (!data || data.length === 0) {
    return (
      <div className={`p-6 rounded-2xl border text-center shadow-lg transition-colors ${
        darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <h3 className={`font-bold text-base mb-2 ${darkMode ? 'text-zinc-100' : 'text-slate-900'}`}>Evolución Temporal de Ventas</h3>
        <p className={`text-sm py-8 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>No hay suficientes datos registrados para mostrar la tendencia en este período.</p>
      </div>
    );
  }

  // Definición de colores del grafico
  const strokeColorGrid = darkMode ? '#27272a' : '#e2e8f0';
  const strokeColorAxis = darkMode ? '#71717a' : '#64748b';

  return (
    <div className={`p-6 rounded-2xl border shadow-xl space-y-4 transition-colors ${
      darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#1C562A]/40 border border-[#5BA535]/30">
            <TrendingUp className="w-5 h-5 text-[#5BA535]" />
          </div>
          <div>
            <h3 className={`font-extrabold text-base tracking-tight ${darkMode ? 'text-zinc-100' : 'text-slate-900'}`}>Evolución Temporal de Ventas</h3>
            <p className={`text-xs font-medium ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Tendencia de facturación según los filtros aplicados</p>
          </div>
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5BA535" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#1C562A" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={strokeColorGrid} vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke={strokeColorAxis} 
              fontSize={11} 
              tickLine={false}
              axisLine={false}
              dy={8}
            />
            <YAxis 
              stroke={strokeColorAxis} 
              fontSize={11} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${val}`}
              dx={-4}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: darkMode ? '#18181b' : '#ffffff', 
                borderColor: darkMode ? '#27272a' : '#e2e8f0', 
                borderRadius: '12px', 
                color: darkMode ? '#fff' : '#0f172a', 
                boxShadow: darkMode ? '0 10px 15px -3px rgb(0 0 0 / 0.5)' : '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
              }}
              formatter={(value) => [`$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 'Total Ventas']}
              labelFormatter={(label) => `Período / Hora: ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="#5BA535" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorTotal)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}