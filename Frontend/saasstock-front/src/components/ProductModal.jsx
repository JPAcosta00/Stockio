import React from 'react';

export default function ProductModal({ isOpen, mode, formData, setFormData, onClose, onSubmit }) {
  if (!isOpen) return null;

  return (
    // 1. Al hacer clic en el fondo oscuro, se ejecuta onClose
    <div 
      onClick={onClose}
      className="fixed top-0 left-0 w-screen min-h-screen bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto"
    >
      {/* 2. e.stopPropagation() evita que el clic DENTRO del modal active el onClose del fondo */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-emerald-100 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl shadow-emerald-950/10 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <h3 className="text-xl font-extrabold text-[#1C562A] tracking-tight">
            {mode === 'view' && 'Detalles del Producto'}
            {mode === 'edit' && 'Modificar Producto'}
            {mode === 'create' && 'Dar de Alta Nuevo Producto'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-[#1C562A] flex items-center justify-center transition-colors font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Cód. Barras (Barcode)</label>
              <input
                type="text"
                disabled={mode === 'view'}
                value={formData.barcode}
                onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#1C562A] focus:ring-2 focus:ring-[#1C562A]/10 disabled:opacity-60 disabled:bg-slate-100 font-mono transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Nombre</label>
            <input
              type="text"
              disabled={mode === 'view'}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#1C562A] focus:ring-2 focus:ring-[#1C562A]/10 disabled:opacity-60 disabled:bg-slate-100 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Descripción</label>
            <textarea
              disabled={mode === 'view'}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-800 h-20 resize-none focus:outline-none focus:border-[#1C562A] focus:ring-2 focus:ring-[#1C562A]/10 disabled:opacity-60 disabled:bg-slate-100 transition-all"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Precio ($)</label>
              <input
                type="number"
                step="0.01"
                disabled={mode === 'view'}
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-800 text-right focus:outline-none focus:border-[#1C562A] focus:ring-2 focus:ring-[#1C562A]/10 disabled:opacity-60 disabled:bg-slate-100 font-mono transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Stock Act.</label>
              <input
                type="number"
                disabled={mode === 'view'}
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-800 text-center focus:outline-none focus:border-[#1C562A] focus:ring-2 focus:ring-[#1C562A]/10 disabled:opacity-60 disabled:bg-slate-100 font-mono transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Stock Mín.</label>
              <input
                type="number"
                disabled={mode === 'view'}
                value={formData.minimumStock}
                onChange={(e) => setFormData({...formData, minimumStock: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-800 text-center focus:outline-none focus:border-[#1C562A] focus:ring-2 focus:ring-[#1C562A]/10 disabled:opacity-60 disabled:bg-slate-100 font-mono transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2.5 pt-4 mt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              {mode === 'view' ? 'Cerrar' : 'Cancelar'}
            </button>
            
            {mode !== 'view' && (
              <button
                type="submit"
                className="bg-[#1C562A] hover:bg-[#154320] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-md shadow-[#1C562A]/20"
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