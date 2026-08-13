import { useState, useEffect } from 'react';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import apiClient from '../api/apiClient';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../components/DashboardLayout';

export default function ImportExcelModal({
  isOpen,
  onClose,
  archivoSeleccionado,
  productosPreview,
  onImportSuccess
}) {
  const { darkMode } = useTheme();
  const { showAlert } = useAlert();
  
  // Estado local para permitir edición manual
  const [listaProductos, setListaProductos] = useState([]);
  const [actualizarExistentes, setActualizarExistentes] = useState(false);
  const [porcentaje, setPorcentaje] = useState(0);
  const [importando, setImportando] = useState(false);

  // Lista de categorías disponibles (coincidiendo con las de tu backend)
  const categoriasDisponibles = [
    'Bebida', 
    'FrutaVerdura', 
    'Lacteo', 
    'SnackDulce', 
    'GranoCereal', 
    'EnlatadoConserva', 
    'Panaderia', 
    'Limpieza', 
    'CuidadoPersonal', 
    'Otros'
  ];

  // Inicializar estado local al abrir
  useEffect(() => {
    if (isOpen) {
      setListaProductos(productosPreview.map(p => {
        //  si la categoría es nula, indefinida, vacía, o el índice numérico 0 (Bebida)
        const catValida = (p.categoria !== undefined && p.categoria !== null && p.categoria !== '' && p.categoria !== 0) 
          ? p.categoria 
          : 'Otros';
      
        return { 
          ...p, 
          precioFinal: Number(p.price || p.Price || 0),
          nuevoStock: p.stock || 0,
          nuevoStockMin: p.minStock || 0,
          categoria: catValida 
        };
      }));
      document.body.style.overflow = 'hidden'; 
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

  // Función para procesar y confirmar la importación con el backend
  const handleConfirmarImportacion = async () => {
    setImportando(true);
    try {
      await apiClient.post('/products/import', {
        productos: listaProductos,
        actualizarExistentes: actualizarExistentes
      });

      showAlert('Productos importados correctamente', 'success');
      
      if (onImportSuccess) {
        onImportSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error(error);
      showAlert(error.response?.data?.message || 'Error al importar los productos', 'error');
    } finally {
      setImportando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in duration-200">
      <div className={`border p-6 rounded-3xl max-w-7xl w-full max-h-[85vh] flex flex-col shadow-2xl ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'}`}>
        
        {/* Header mejorado */}
        <div className="flex justify-between items-start border-b pb-4 mb-2 border-zinc-500/20">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#5BA535]" /> Previsualización de Importación
            </h3>
            <p className="text-xs opacity-60 mt-1">Revisa los datos y ajusta las categorías antes de confirmar la carga masiva.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-500/10 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabla con más aire */}
        <div className={`flex-1 overflow-y-auto pr-2 custom-scrollbar ${darkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}>
          <table className="w-full text-left border-collapse">
            <thead className={`sticky top-0 z-10 text-[10px] uppercase tracking-wider font-bold ${darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-50 text-slate-500'}`}>
              <tr>
                <th className="p-4 rounded-tl-lg">Estado</th>
                <th className="p-4">Código</th>
                <th className="p-4">Nombre del Producto</th>
                <th className="p-4">Categoría</th>
                <th className="p-4 text-right">Precio ($)</th>
                <th className="p-4 text-center">Stock</th>
                <th className="p-4 rounded-tr-lg text-center">Stock Mín.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-500/10 text-sm">
              {listaProductos.map((prod, idx) => (
                <tr key={idx} className={`group ${darkMode ? 'hover:bg-zinc-800/40' : 'hover:bg-slate-50'}`}>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${prod.isExisting ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                      {prod.isExisting ? 'EXISTENTE' : 'NUEVO'}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs opacity-70">{prod.barcode}</td>
                  <td className="p-3 font-medium">{prod.name}</td>
                  
                  {/* Selector de Categoría añadido */}
                  <td className="p-3">
                    <select
                      value={prod.categoria}
                      onChange={(e) => handleManualChange(idx, 'categoria', e.target.value)}
                      className={`w-full px-2 py-1 border rounded text-xs focus:outline-none focus:border-[#5BA535] cursor-pointer ${
                        darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    >
                      {categoriasDisponibles.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-3 text-right font-semibold">$ {prod.precioFinal}</td>
                  <td className="p-3 text-center">
                    <input type="number" value={prod.nuevoStock} onChange={(e) => handleManualChange(idx, 'nuevoStock', e.target.value)} 
                      className="w-20 px-2 py-1 bg-transparent border border-zinc-500/30 rounded focus:border-[#5BA535] focus:outline-none text-center" />
                  </td>
                  <td className="p-3 text-center">
                    <input type="number" value={prod.nuevoStockMin} onChange={(e) => handleManualChange(idx, 'nuevoStockMin', e.target.value)} 
                      className="w-20 px-2 py-1 bg-transparent border border-zinc-500/30 rounded focus:border-[#5BA535] focus:outline-none text-center" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer mejorado */}
        <div className="mt-4 pt-4 border-t border-zinc-500/20 flex justify-between items-center">
            <div className="flex gap-6">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input type="checkbox" checked={actualizarExistentes} onChange={(e) => setActualizarExistentes(e.target.checked)} className="w-4 h-4 accent-[#5BA535]" />
                    Actualizar datos de existentes
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs opacity-60">Ajuste %:</span>
                  <input type="number" placeholder="0" onChange={(e) => handleCambioPorcentaje(e.target.value)} className="w-20 px-3 py-1 bg-zinc-800/20 border border-zinc-500/20 rounded-lg text-xs focus:outline-none focus:border-[#5BA535]" />
                </div>
            </div>
            <button 
              onClick={handleConfirmarImportacion} 
              disabled={importando}
              className="px-6 py-2.5 bg-[#5BA535] hover:bg-[#4a8a2b] transition-all text-white rounded-xl text-sm font-bold shadow-lg shadow-[#5BA535]/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {importando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                </>
              ) : (
                "Confirmar Importación"
              )}
            </button>
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