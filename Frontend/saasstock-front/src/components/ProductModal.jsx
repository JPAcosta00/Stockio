import React from 'react';
import { useTheme } from '../components/DashboardLayout'; 
import { X } from 'lucide-react';

export default function ProductModal({ isOpen, mode, formData, setFormData, onClose, onSubmit, providers = [] }) {
  const { darkMode } = useTheme(); // <-- 2. Reemplazado el soporte estricto oscuro por el hook global

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed top-0 left-0 w-screen min-h-screen bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`border rounded-2xl w-full max-w-lg p-6 relative shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-150 transition-colors ${
          darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        <div className={`flex items-center justify-between pb-4 mb-4 border-b ${darkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
          <h3 className={`text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {mode === 'view' && 'Detalles del Producto'}
            {mode === 'edit' && 'Modificar Producto'}
            {mode === 'create' && 'Dar de Alta Nuevo Producto'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors font-bold cursor-pointer ${
              darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Cód. Barras (Barcode)</label>
              <input
                type="text"
                disabled={mode === 'view'}
                value={formData.barcode || ''}
                onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                className={`w-full border rounded-xl p-2.5 text-sm font-mono transition-all focus:outline-none focus:border-[#5BA535] focus:ring-2 focus:ring-[#5BA535]/20 disabled:opacity-50 ${
                  darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100 disabled:bg-zinc-900' : 'bg-slate-50 border-slate-200 text-slate-900 disabled:bg-slate-100'
                }`}
                required
              />
            </div>

            {/* Selector de Proveedor / Distribuidora */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Proveedor</label>
              <select
                disabled={mode === 'view'}
                value={formData.providerId || ''}
                onChange={(e) => setFormData({...formData, providerId: e.target.value ? e.target.value : null})}
                className={`w-full border rounded-xl p-2.5 text-sm transition-all cursor-pointer focus:outline-none focus:border-[#5BA535] focus:ring-2 focus:ring-[#5BA535]/20 disabled:opacity-50 ${
                  darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100 disabled:bg-zinc-900' : 'bg-slate-50 border-slate-200 text-slate-900 disabled:bg-slate-100'
                }`}
              >
                <option value="">Sin proveedor</option>
                {providers.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Nombre</label>
            <input
              type="text"
              disabled={mode === 'view'}
              value={formData.name || ''}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className={`w-full border rounded-xl p-2.5 text-sm transition-all focus:outline-none focus:border-[#5BA535] focus:ring-2 focus:ring-[#5BA535]/20 disabled:opacity-50 ${
                darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100 disabled:bg-zinc-900' : 'bg-slate-50 border-slate-200 text-slate-900 disabled:bg-slate-100'
              }`}
              required
            />
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Descripción</label>
            <textarea
              disabled={mode === 'view'}
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className={`w-full border rounded-xl p-2.5 text-sm h-20 resize-none transition-all focus:outline-none focus:border-[#5BA535] focus:ring-2 focus:ring-[#5BA535]/20 disabled:opacity-50 ${
                darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100 disabled:bg-zinc-900' : 'bg-slate-50 border-slate-200 text-slate-900 disabled:bg-slate-100'
              }`}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Precio ($)</label>
              <input
                type="number"
                step="0.01"
                disabled={mode === 'view'}
                value={formData.price ?? 0}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                className={`w-full border rounded-xl p-2.5 text-sm text-right font-mono transition-all focus:outline-none focus:border-[#5BA535] focus:ring-2 focus:ring-[#5BA535]/20 disabled:opacity-50 ${
                  darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100 disabled:bg-zinc-900' : 'bg-slate-50 border-slate-200 text-slate-900 disabled:bg-slate-100'
                }`}
                required
              />
            </div>
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Stock Act.</label>
              <input
                type="number"
                disabled={mode === 'view'}
                value={formData.stock ?? 0}
                onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                className={`w-full border rounded-xl p-2.5 text-sm text-center font-mono transition-all focus:outline-none focus:border-[#5BA535] focus:ring-2 focus:ring-[#5BA535]/20 disabled:opacity-50 ${
                  darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100 disabled:bg-zinc-900' : 'bg-slate-50 border-slate-200 text-slate-900 disabled:bg-slate-100'
                }`}
                required
              />
            </div>
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Stock Mín.</label>
              <input
                type="number"
                disabled={mode === 'view'}
                value={formData.minimumStock ?? 0}
                onChange={(e) => setFormData({...formData, minimumStock: parseInt(e.target.value) || 0})}
                className={`w-full border rounded-xl p-2.5 text-sm text-center font-mono transition-all focus:outline-none focus:border-[#5BA535] focus:ring-2 focus:ring-[#5BA535]/20 disabled:opacity-50 ${
                  darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100 disabled:bg-zinc-900' : 'bg-slate-50 border-slate-200 text-slate-900 disabled:bg-slate-100'
                }`}
              />
            </div>
          </div>

          <div className={`flex justify-end space-x-2.5 pt-4 mt-2 border-t ${darkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm cursor-pointer ${
                darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {mode === 'view' ? 'Cerrar' : 'Cancelar'}
            </button>
            
            {mode !== 'view' && (
              <button
                type="submit"
                className="bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-[#1C562A]/30 cursor-pointer"
              >
                Guardar Cambios
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}