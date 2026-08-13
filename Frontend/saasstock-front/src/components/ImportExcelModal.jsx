import { useState, useEffect } from 'react';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import apiClient from '../api/apiClient';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../components/DashboardLayout';

export default function ImportExcelModal({
  isOpen,
  onClose,
  archivoSeleccionado,
  productosPreview, // Se asume que viene con una propiedad 'existe' (boolean)
  onImportSuccess
}) {
  const { darkMode } = useTheme();
  const { showAlert } = useAlert();
  
  // Estado local para permitir edición manual
  const [listaProductos, setListaProductos] = useState([]);
  const [actualizarExistentes, setActualizarExistentes] = useState(false);
  const [porcentaje, setPorcentaje] = useState(0);
  const [importando, setImportando] = useState(false);

  // Inicializar estado local al abrir
  useEffect(() => {
    if (isOpen) {
      setListaProductos(productosPreview.map(p => ({ 
        ...p, 
        precioFinal: Number(p.price || p.Price || 0),
        nuevoStock: p.stock || 0,
        nuevoStockMin: p.minStock || 0
      })));
      document.body.style.overflow = 'hidden'; // Bloquear scroll fondo
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, productosPreview]);

  // Aplicar porcentaje
  const handleCambioPorcentaje = (val) => {
    const p = Number(val);
    setPorcentaje(p);
    setListaProductos(prev => prev.map(prod => ({
      ...prod,
      precioFinal: (Number(prod.price || prod.Price || 0) * (1 + p / 100)).toFixed(2)
    })));
  };

  const handleManualChange = (index, field, value) => {
    const nuevaLista = [...listaProductos];
    nuevaLista[index][field] = value;
    setListaProductos(nuevaLista);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`border p-5 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'}`}>
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4 border-zinc-700/50">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#5BA535]" /> Previsualización de Importación
            </h3>
            <p className="text-[10px] opacity-70">Asegúrate de que el Excel tenga columnas: Codigo, Nombre, Precio, Stock, StockMin.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* Scrollable area con estilo personalizado */}
        <div className={`flex-1 overflow-y-auto pr-2 custom-scrollbar ${darkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}>
          <table className="w-full text-left text-[11px]">
            <thead className={`sticky top-0 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <tr>
                <th className="p-2">Estado</th>
                <th className="p-2">Código</th>
                <th className="p-2">Nombre</th>
                <th className="p-2">Precio (Calculado)</th>
                <th className="p-2">Stock</th>
                <th className="p-2">Stock Mínimo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {listaProductos.map((prod, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/20">
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${prod.existe ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {prod.existe ? 'EXISTENTE' : 'NUEVO'}
                    </span>
                  </td>
                  <td className="p-2">{prod.barcode}</td>
                  <td className="p-2 font-medium">{prod.name}</td>
                  <td className="p-2">$ {prod.precioFinal}</td>
                  <td className="p-2">
                    <input type="number" value={prod.nuevoStock} onChange={(e) => handleManualChange(idx, 'nuevoStock', e.target.value)} className="w-16 bg-transparent border-b border-zinc-600 focus:outline-none" />
                  </td>
                  <td className="p-2">
                    <input type="number" value={prod.nuevoStockMin} onChange={(e) => handleManualChange(idx, 'nuevoStockMin', e.target.value)} className="w-16 bg-transparent border-b border-zinc-600 focus:outline-none" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-zinc-700/50 flex justify-between items-center">
            <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={actualizarExistentes} onChange={(e) => setActualizarExistentes(e.target.checked)} />
                    Actualizar existentes
                </label>
                <input type="number" placeholder="% Precio" onChange={(e) => handleCambioPorcentaje(e.target.value)} className="w-20 px-2 py-1 bg-zinc-800 rounded text-xs" />
            </div>
            <button onClick={onClose} className="px-4 py-2 bg-[#5BA535] text-white rounded-xl text-xs font-bold">Confirmar Importación</button>
        </div>
      </div>
      
      {/* Estilos para el scroll personalizado */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .scrollbar-dark::-webkit-scrollbar-track { background: #18181b; }
        .scrollbar-dark::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
        .scrollbar-light::-webkit-scrollbar-track { background: #f1f5f9; }
        .scrollbar-light::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}