import React from 'react';

export default function ProductModal({ isOpen, mode, formData, setFormData, onClose, onSubmit }) {
  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed top-0 left-0 w-screen min-h-screen bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        <h3 className="text-xl font-bold text-white mb-4">
          {mode === 'view' && 'Detalles del Producto'}
          {mode === 'edit' && 'Modificar Producto'}
          {mode === 'create' && 'Dar de Alta Nuevo Producto'}
        </h3>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Cód. Barras (Barcode)</label>
              <input
                type="text"
                disabled={mode === 'view'}
                value={formData.barcode}
                onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Nombre</label>
            <input
              type="text"
              disabled={mode === 'view'}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Descripción</label>
            <textarea
              disabled={mode === 'view'}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white h-20 resize-none focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Precio ($)</label>
              <input
                type="number"
                step="0.01"
                disabled={mode === 'view'}
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white text-right focus:outline-none focus:border-emerald-500 disabled:opacity-50 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Stock Act.</label>
              <input
                type="number"
                disabled={mode === 'view'}
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white text-center focus:outline-none focus:border-emerald-500 disabled:opacity-50 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Stock Mín.</label>
              <input
                type="number"
                disabled={mode === 'view'}
                value={formData.minimumStock}
                onChange={(e) => setFormData({...formData, minimumStock: parseInt(e.target.value) || 0})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white text-center focus:outline-none focus:border-emerald-500 disabled:opacity-50 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {mode === 'view' ? 'Cerrar' : 'Cancelar'}
            </button>
            
            {mode !== 'view' && (
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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