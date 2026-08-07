import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function SalesTimelineChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm text-center">
        <h3 className="font-bold text-slate-800 text-base mb-2">Evolución Temporal de Ventas</h3>
        <p className="text-slate-400 text-sm py-8">No hay suficientes datos registrados para mostrar la tendencia en este período.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#1C562A]/10 border border-[#1C562A]/20">
            <TrendingUp className="w-5 h-5 text-[#1C562A]" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-base tracking-tight">Evolución Temporal de Ventas</h3>
            <p className="text-xs text-slate-500 font-medium">Tendencia de facturación según los filtros aplicados</p>
          </div>
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1C562A" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#1C562A" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false}
              axisLine={false}
              dy={8}
            />
            <YAxis 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${val}`}
              dx={-4}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0', borderRadius: '12px', color: '#0F172A', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              formatter={(value) => [`$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 'Total Ventas']}
              labelFormatter={(label) => `Período / Hora: ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="#1C562A" 
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