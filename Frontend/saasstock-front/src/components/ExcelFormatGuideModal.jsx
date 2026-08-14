import { useRef } from 'react';
import { Info, X, FileSpreadsheet } from 'lucide-react';
import { useTheme } from '../components/DashboardLayout';

export default function ExcelFormatGuideModal({
  isOpen,
  onClose,
  onFileSelected
}) {
  const { darkMode } = useTheme();
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelected(file); 
      e.target.value = null; // Limpiar input
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`border p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Info className="w-4 h-4 text-[#5BA535]" />
            Formato esperado para la Importación de Excel
          </h3>
          <button 
            onClick={onClose}
            className={`p-1 rounded-lg ${darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <p className={`text-[11px] ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
          El archivo Excel debe contener las siguientes columnas en su primera fila (Cabecera) para que el sistema pueda procesarlo de forma correcta:
        </p>

        <div className={`border rounded-xl p-3 text-[11px] space-y-2 ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-[#5BA535]">barcode</strong> (Código de barras opcional/único)</li>
            <li><strong className="text-[#5BA535]">name</strong> (Nombre del producto - Obligatorio)</li>
            <li><strong className="text-[#5BA535]">description</strong> (Descripción del producto)</li>
            <li><strong className="text-[#5BA535]">price</strong> (Precio de venta unitario)</li>
            <li><strong className="text-[#5BA535]">stock</strong> (Cantidad inicial en inventario)</li>
            <li><strong className="text-[#5BA535]">minimumStock</strong> (Stock mínimo de alerta)</li>
            <li><strong className="text-[#5BA535]">categoria</strong> (Nombre de la categoría)</li>
          </ul>
        </div>

        {/* Input  para cargar el archivo */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".xlsx, .xls" 
          className="hidden" 
        />

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
          >
            Cancelar
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-[#5BA535] hover:bg-[#4b8c2c] text-white text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-[#5BA535]/20"
          >
            <FileSpreadsheet className="w-4 h-4" /> Seleccionar Archivo Excel
          </button>
        </div>
      </div>
    </div>
  );
}