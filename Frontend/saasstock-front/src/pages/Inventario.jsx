import { useState, useEffect } from 'react';
import { exportarAExcel, exportarAPDF, importarArchivoExcel } from '../utils/excelPdfUtils';
import apiClient from '../api/apiClient';
import InventarioTable from '../components/InventarioTable';
import ProductModal from '../components/ProductModal';
import { useAlert } from '../context/AlertContext'; // <-- Importamos tu hook de alertas
import {
  Package,
  Search,
  FileSpreadsheet,
  FileText,
  Upload,
  AlertTriangle,
  Loader2,
  Plus
} from 'lucide-react';

export default function Inventario() {
  const { showAlert } = useAlert(); // <-- Inicializamos la función showAlert

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
 
  // Estados de los inputs de filtro
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('');

  const [filtrosActivos, setFiltrosActivos] = useState({ Name: '', Period: '' });
 
  const [cargandoImportacion, setCargandoImportacion] = useState(false);

  // para limitar la cantidad de productos
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 15;

  // Estados del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [formData, setFormData] = useState({
    id: '', barcode: '', name: '', description: '', price: 0, stock: 0, minimumStock: 0
  });

  // 1. Cargar inventario INICIAL
  const cargarInventario = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/products');
      setProductos(response.data);
    } catch (error) {
      console.error("Error al cargar el inventario:", error);
      showAlert("Error al cargar el inventario.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarInventario();
  }, []);

  // 2. FUNCIÓN DE BÚSQUEDA EXCLUSIVA PARA LA PANTALLA
  const handleBuscar = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setPaginaActual(1);

      const esStockCritico = filtroPeriodo === 'critico';
     
      const nuevosFiltros = {
        Name: filtroNombre.trim(),
        Period: esStockCritico ? '' : filtroPeriodo,
        IsCriticalStock: esStockCritico
      };

      setFiltrosActivos(nuevosFiltros);

      const response = await apiClient.get('/products', { params: nuevosFiltros });
      setProductos(response.data);
    } catch (error) {
      console.error("Error al filtrar los productos:", error);
      showAlert("Hubo un error al realizar la búsqueda.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handlers CRUD
  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({ id: '', barcode: '', name: '', description: '', price: 0, stock: 0, minimumStock: 0 });
    setIsModalOpen(true);
  };

  const handleOpenRow = (prod, mode = 'view') => {
    setModalMode(mode);
    setFormData({
      id: prod.id || '', barcode: prod.barcode || '', name: prod.name || '',
      description: prod.description || '', price: prod.price ?? 0, stock: prod.stock ?? 0, minimumStock: prod.minimumStock ?? 0
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Estás seguro de que querés eliminar el producto "${name}"?`)) {
      try {
        await apiClient.delete(`/products/${id}`);
        showAlert(`Producto "${name}" eliminado con éxito`, "success");
        cargarInventario();
      } catch (error) {
        console.error("Error al eliminar:", error);
        showAlert("No se pudo eliminar el producto", "error");
      }
    }
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await apiClient.post('/products', formData);
        showAlert("Producto creado correctamente", "success");
      } else if (modalMode === 'edit') {
        await apiClient.put(`/products/${formData.id}`, formData);
        showAlert("Producto actualizado correctamente", "success");
      }
      setIsModalOpen(false);
      cargarInventario();
    } catch (error) {
      console.error("Error al guardar:", error);
      showAlert("Hubo un error al procesar la solicitud.", "error");
    }
  };

  const manejarImportacion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCargandoImportacion(true);
    try {
      const resultado = await importarArchivoExcel(file);
      showAlert(resultado.message || "Archivo importado con éxito", "success");
      cargarInventario();
    } catch (error) {
      console.error("Error al importar:", error);
      showAlert(error.response?.data || "Error inesperado al subir.", "error");
    } finally {
      setCargandoImportacion(false);
      e.target.value = '';
    }
  };

  // Cálculo de los índices
  const ultimoIndice = paginaActual * productosPorPagina;
  const primerIndice = ultimoIndice - productosPorPagina;
  const productosPaginados = productos.slice(primerIndice, ultimoIndice);
  const totalPaginas = Math.ceil(productos.length / productosPorPagina);

  return (
    <div className="space-y-6">
     
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#1C562A]/40 border border-[#5BA535]/30 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-[#5BA535]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Control de Stock</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Gestión integral del catálogo de mercadería.</p>
          </div>
        </div>
       
        <button
          onClick={handleOpenCreate}
          className="bg-[#5BA535] hover:bg-[#4b8c2c] text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* SECCIÓN DE FILTROS Y BÚSQUEDA */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-end gap-4">
         
          <div className="flex-1 w-full">
            <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5 font-semibold">Buscar por Nombre</label>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ej: Amortiguador..."
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleBuscar();
                    }
                }}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#5BA535] placeholder-zinc-600 transition-colors"
              />
            </div>
          </div>
         
          <div className="w-full md:w-56">
            <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5 font-semibold">Filtrar Período</label>
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#5BA535] cursor-pointer transition-colors"
            >
              <option value="">Todos los registros</option>
              <option value="critico">⚠️ Stock Crítico</option>
              <option value="hoy">Hoy</option>
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mes</option>
              <option value="anio">Este Año</option>
            </select>
          </div>

          <button
            onClick={handleBuscar}
            className="w-full md:w-auto bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition-colors border border-zinc-700 cursor-pointer shadow-sm"
          >
            Buscar
          </button>
        </div>

        {/* ACCIONES EXPORT / IMPORT & RESET */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-2">
           
            <label className={`cursor-pointer bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 transition-colors flex items-center gap-2 ${cargandoImportacion ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload className="w-3.5 h-3.5 text-[#5BA535]" />
              <span>{cargandoImportacion ? 'Procesando...' : 'Importar Excel'}</span>
              <input type="file" accept=".xlsx, .xls" onChange={manejarImportacion} className="hidden" disabled={cargandoImportacion} />
            </label>
           
            <button onClick={() => exportarAExcel({})} className="bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 transition-colors flex items-center gap-2 cursor-pointer">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#5BA535]" />
              <span>Exportar Excel (Vista)</span>
            </button>
           
            <button onClick={() => exportarAPDF({})} className="bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 transition-colors flex items-center gap-2 cursor-pointer">
              <FileText className="w-3.5 h-3.5 text-red-400" />
              <span>Exportar PDF (Vista)</span>
            </button>
          </div>

          {(filtroNombre || filtroPeriodo) && (
            <button
              onClick={() => {
                setFiltroNombre('');
                setFiltroPeriodo('');
                cargarInventario();
              }}
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer font-medium"
            >
              Limpiar filtros ×
            </button>
          )}
        </div>
      </div>

      {/* TABLA MODULAR */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-[#5BA535] mb-3" />
          <p className="text-xs font-medium text-zinc-400">Procesando consulta...</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <InventarioTable productos={productosPaginados} onOpenRow={handleOpenRow} onDelete={handleDelete} />
        </div>
      )}

      {/* MODAL MODULAR */}
      <ProductModal isOpen={isModalOpen} mode={modalMode} formData={formData} setFormData={setFormData} onClose={() => setIsModalOpen(false)} onSubmit={handleSaveSubmit} />
     
      {/* CONTROLES DE PAGINACIÓN */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 px-4 py-3 sm:px-6 rounded-2xl shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
              disabled={paginaActual === 1}
              className="relative inline-flex items-center rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              Anterior
            </button>
            <button
              onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
              className="relative ml-3 inline-flex items-center rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              Siguiente
            </button>
          </div>
   
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-zinc-400">
                Mostrando <span className="font-semibold text-zinc-200">{primerIndice + 1}</span> a{' '}
                <span className="font-semibold text-zinc-200">
                  {Math.min(ultimoIndice, productos.length)}
                </span>{' '}
                de <span className="font-semibold text-zinc-200">{productos.length}</span> productos
              </p>
            </div>
     
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm overflow-hidden border border-zinc-800" aria-label="Pagination">
                <button
                  onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                  disabled={paginaActual === 1}
                  className="relative inline-flex items-center px-3 py-2 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 focus:z-20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  <span className="sr-only">Anterior</span>
                  ‹
                </button>

                {[...Array(totalPaginas)].map((_, index) => {
                  const numeroPagina = index + 1;
                  const esActiva = numeroPagina === paginaActual;
                  return (
                    <button
                      key={numeroPagina}
                      onClick={() => setPaginaActual(numeroPagina)}
                      className={`relative inline-flex items-center px-3.5 py-2 text-xs font-semibold focus:z-20 transition-colors cursor-pointer ${
                        esActiva
                          ? 'z-10 bg-[#5BA535] text-white font-bold'
                          : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border-l border-zinc-800'
                      }`}
                    >
                      {numeroPagina}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                  className="relative inline-flex items-center px-3 py-2 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 focus:z-20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors border-l border-zinc-800 cursor-pointer"
                >
                  <span className="sr-only">Siguiente</span>
                  ›
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
     
    </div>
  );
}