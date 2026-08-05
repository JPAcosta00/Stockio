import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';


export default function SalesTimelineChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 text-center">
        <h3 className="font-bold text-zinc-100 text-base mb-2">Evolución Temporal de Ventas</h3>
        <p className="text-zinc-500 text-sm py-8">No hay suficientes datos registrados para mostrar la tendencia en este período.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/50">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-100 text-base">Evolución Temporal de Ventas</h3>
            <p className="text-xs text-zinc-500">Tendencia de facturación según los filtros aplicados</p>
          </div>
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#71717a" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#71717a" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
              formatter={(value) => [`$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 'Total Ventas']}
              labelFormatter={(label) => `Período / Hora: ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="#10b981" 
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