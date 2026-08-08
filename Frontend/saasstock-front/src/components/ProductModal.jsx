import React from 'react';

export default function ProductModal({ isOpen, mode, formData, setFormData, onClose, onSubmit, providers = [] }) {
  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed top-0 left-0 w-screen min-h-screen bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
          <h3 className="text-xl font-extrabold text-white tracking-tight">
            {mode === 'view' && 'Detalles del Producto'}
            {mode === 'edit' && 'Modificar Producto'}
            {mode === 'create' && 'Dar de Alta Nuevo Producto'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Cód. Barras (Barcode)</label>
              <input
                type="text"
                disabled={mode === 'view'}
                value={formData.barcode || ''}
                onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-[#5BA535] focus:ring-2 focus:ring-[#5BA535]/20 disabled:opacity-50 disabled:bg-zinc-900 font-mono transition-all"
                required
              />
            </div>

            {/* Selector de Proveedor / Distribuidora */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Proveedor</label>
              <select
                disabled={mode === 'view'}
                value={formData.providerId || ''}
                onChange={(e) => setFormData({...formData, providerId: e.target.value ? e.target.value : null})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-[#5BA535] focus:ring-2 focus:ring-[#5BA535]/20 disabled:opacity-50 disabled:bg-zinc-900 transition-all"
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
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Nombre</label>
            <input
              type="text"
              disabled={mode === 'view'}
              value={formData.name || ''}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-[#5BA535] focus:ring-2 focus:ring-[#5BA535]/20 disabled:opacity-50 disabled:bg-zinc-900 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Descripción</label>
            <textarea
              disabled={mode === 'view'}
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 h-20 resize-none focus:outline-none focus:border-[#5BA535] focus:ring-2 focus:ring-[#5BA535]/20 disabled:opacity-50 disabled:bg-zinc-900 transition-all"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Precio ($)</label>
              <input
                type="number"
                step="0.01"
                disabled={mode === 'view'}
                value={formData.price ?? 0}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 text-right focus:outline-none focus:border-[#5BA535] focus:ring-2 focus:ring-[#5BA535]/20 disabled:opacity-50 disabled:bg-zinc-900 font-mono transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Stock Act.</label>
              <input
                type="number"
                disabled={mode === 'view'}
                value={formData.stock ?? 0}
                onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 text-center focus:outline-none focus:border-[#5BA535] focus:ring-2 focus:ring-[#5BA535]/20 disabled:opacity-50 disabled:bg-zinc-900 font-mono transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Stock Mín.</label>
              <input
                type="number"
                disabled={mode === 'view'}
                value={formData.minimumStock ?? 0}
                onChange={(e) => setFormData({...formData, minimumStock: parseInt(e.target.value) || 0})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 text-center focus:outline-none focus:border-[#5BA535] focus:ring-2 focus:ring-[#5BA535]/20 disabled:opacity-50 disabled:bg-zinc-900 font-mono transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2.5 pt-4 mt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm cursor-pointer"
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