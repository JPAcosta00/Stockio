import { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import apiClient from '../api/apiClient';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../components/DashboardLayout';

export default function ImportExcelModal({
  isOpen,
  onClose,
  archivoSeleccionado,
  productosPreview,
  darkMode,
  onImportSuccess
}) {
  const { darkMode } = useTheme();
  const { showAlert } = useAlert();
  const [actualizarExistentes, setActualizarExistentes] = useState(false);
  const [porcentaje, setPorcentaje] = useState(0);
  const [importando, setImportando] = useState(false);

  if (!isOpen) return null;

  const handleConfirmarImportacion = async () => {
    if (!archivoSeleccionado) return;

    try {
      setImportando(true);
      const formData = new FormData();
      formData.append("file", archivoSeleccionado);
      formData.append("updateExisting", actualizarExistentes);
      formData.append("percentage", Number(porcentaje) || 0);

      await apiClient.post('/products/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showAlert("Inventario importado/actualizado con éxito", "success");
      onClose();
      if (onImportSuccess) onImportSuccess();
    } catch (error) {
      console.error("Error al confirmar importación:", error);
      showAlert("Hubo un error al procesar la importación del archivo.", "error");
    } finally {
      setImportando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`border p-5 rounded-2xl max-w-2xl w-full space-y-4 shadow-2xl ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'}`}>
        <div className="flex items-center justify-between border-b pb-3 border-zinc-700/50">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#5BA535]" />
            Previsualización de Importación de Excel
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <p className={darkMode ? 'text-zinc-400' : 'text-slate-600'}>
            Archivo seleccionado: <span className="font-semibold">{archivoSeleccionado?.name}</span> ({productosPreview.length} productos detectados)
          </p>

          <div className={`p-3 rounded-xl border space-y-3 ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input 
                type="checkbox" 
                checked={actualizarExistentes} 
                onChange={(e) => setActualizarExistentes(e.target.checked)}
                className="rounded border-zinc-700 text-[#5BA535] focus:ring-[#5BA535]"
              />
              <span>Actualizar productos existentes si ya se encuentran en el inventario</span>
            </label>

            <div className="flex items-center gap-3 pt-1">
              <span className="font-medium">Aplicar porcentaje extra al precio (%):</span>
              <input 
                type="number" 
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value)}
                className={`w-24 px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-[#5BA535] ${darkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              />
            </div>
          </div>

          <div className={`max-h-60 overflow-y-auto border rounded-xl ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
            <table className="w-full text-left border-collapse">
              <thead className={`sticky top-0 ${darkMode ? 'bg-zinc-950 text-zinc-400' : 'bg-slate-100 text-slate-600'}`}>
                <tr>
                  <th className="p-2 border-b border-zinc-800">Código</th>
                  <th className="p-2 border-b border-zinc-800">Nombre</th>
                  <th className="p-2 border-b border-zinc-800">Precio</th>
                  <th className="p-2 border-b border-zinc-800">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {productosPreview.slice(0, 10).map((prod, idx) => (
                  <tr key={idx} className={darkMode ? 'hover:bg-zinc-800/40' : 'hover:bg-slate-50'}>
                    <td className="p-2">{prod.barcode || '-'}</td>
                    <td className="p-2 font-medium">{prod.name}</td>
                    <td className="p-2">${prod.Price ?? prod.price ?? 0}</td>
                    <td className="p-2">{prod.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {productosPreview.length > 10 && (
              <p className={`p-2 text-center text-[10px] ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                Mostrando los primeros 10 productos de {productosPreview.length}...
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-700/50">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmarImportacion}
            disabled={importando}
            className="px-4 py-2 rounded-xl bg-[#5BA535] hover:bg-[#4b8c2c] text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {importando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Confirmar importación</span>
          </button>
        </div>
      </div>
    </div>
  );
}