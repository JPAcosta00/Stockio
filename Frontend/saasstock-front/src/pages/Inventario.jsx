import { useState, useEffect, useRef } from 'react';
import { exportarAExcel, exportarAPDF, importarArchivoExcel } from '../utils/excelPdfUtils';
import apiClient from '../api/apiClient';
import InventarioTable from '../components/InventarioTable';
import ProductModal from '../components/ProductModal';
import CreatePurchaseInvoiceModal from '../components/CreatePurchaseInvoiceModal';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../components/DashboardLayout'; 
import {
  Package,
  Search,
  FileSpreadsheet,
  FileText,
  Upload,
  Loader2,
  Plus,
  Info,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Inventario() {
  const { showAlert } = useAlert();
  const { darkMode } = useTheme(); 

  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtrosActivos, setFiltrosActivos] = useState({ 
    Name: '', 
    Period: '',
    IsCriticalStock: false,
    ProviderId: ''
  });

  const [modalImportarAbierto, setModalImportarAbierto] = useState(false);
  const [productosPreview, setProductosPreview] = useState([]);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [importando, setImportando] = useState(false);
  
  const [cargandoImportacion, setCargandoImportacion] = useState(false);
  const [isExcelFormatModalOpen, setIsExcelFormatModalOpen] = useState(false);
  const [actualizarExistentes, setActualizarExistentes] = useState(false);
  const [isPurchaseInvoiceModalOpen, setIsPurchaseInvoiceModalOpen] = useState(false);

  const excelInputRef = useRef(null);

  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 15;

  const [productoAEliminar, setProductoAEliminar] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [formData, setFormData] = useState({
    id: '', barcode: '', name: '', description: '', price: 0, stock: 0, minimumStock: 0, providerId: ''
  });

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

  const cargarProveedores = async () => {
    try {
      const response = await apiClient.get('/providers');
      setProveedores(response.data);
    } catch (error) {
      console.error("Error al cargar los proveedores:", error);
    }
  };

  useEffect(() => {
    cargarInventario();
    cargarProveedores();
  }, []);


  // para filtrar en tiempo real (con debounce de 400ms)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleBuscar();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [filtroNombre, filtroProveedor, filtroPeriodo]);

  const handleBuscar = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setPaginaActual(1);
      
      // Declaramos la variable que faltaba basada en tu filtro de período
      const esStockCritico = filtroPeriodo === 'critico';

      const params = {};
      
      if (filtroNombre && filtroNombre.trim() !== "") {
        params.query = filtroNombre.trim();
      }
      
      if (filtroProveedor && filtroProveedor !== "") {
        params.providerId = filtroProveedor;
      }

      if (esStockCritico) {
        params.isCriticalStock = true;
      } else if (filtroPeriodo && filtroPeriodo !== "") {
        params.period = filtroPeriodo;
      }

      setFiltrosActivos(params);

      const response = await apiClient.get('/products/search', { params });
      setProductos(response.data);
    } catch (error) {
      console.error("Error al filtrar los productos:", error);
      showAlert("Hubo un error al realizar la búsqueda.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({ id: '', barcode: '', name: '', description: '', price: 0, stock: 0, minimumStock: 0, providerId: '',categoria: 'Otros' });
    setIsModalOpen(true);
  };

  const handleOpenRow = (prod, mode = 'view') => {
    // Mapa de número a nombre (debe coincidir con los values de tu <select> en el modal)
    const mapaCategorias = {
      0: 'Bebida', 1: 'FrutaVerdura', 2: 'Lacteo', 3: 'SnackDulce',
      4: 'GranoCereal', 5: 'EnlatadoConserva', 6: 'Panaderia',
      7: 'Limpieza', 8: 'CuidadoPersonal', 9: 'Otros'
    };
  
    setModalMode(mode);
    setFormData({
      id: prod.id || '', 
      barcode: prod.barcode || '', 
      name: prod.name || '',
      description: prod.description || '', 
      price: prod.price ?? 0, 
      stock: prod.stock ?? 0, 
      minimumStock: prod.minimumStock ?? 0,
      providerId: prod.providerId || '',
      // Si prod.categoria es un número, usamos el mapa. Si ya es string, usamos ese.
      categoria: typeof prod.categoria === 'number' 
        ? (mapaCategorias[prod.categoria] || 'Otros') 
        : (prod.categoria || 'Otros')
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id, name) => {
    setProductoAEliminar({ id, name });
  };

  const confirmarEliminacion = async () => {
    if (!productoAEliminar) return;
    try {
      await apiClient.delete(`/products/${productoAEliminar.id}`);
      showAlert(`Producto "${productoAEliminar.name}" eliminado con éxito`, "success");
      cargarInventario();
    } catch (error)  {
      console.error("Error al eliminar:", error);
      showAlert("No se pudo eliminar el producto", "error");
    } finally {
      setProductoAEliminar(null);
    }
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    try {
      const mapaEnumNumerico = {
        'Bebida': 0, 'FrutaVerdura': 1, 'Lacteo': 2, 'SnackDulce': 3, 
        'GranoCereal': 4, 'EnlatadoConserva': 5, 'Panaderia': 6, 
        'Limpieza': 7, 'CuidadoPersonal': 8, 'Otros': 9
      };
    
      // Objeto alineado a [JsonPropertyName] de C#
      const datosParaEnviar = {
        name: formData.name || '',
        barcode: formData.barcode || '',
        price: Number(formData.price) || 0,
        stock: Number(formData.stock) || 0,           // clave "stock"
        minimumStock: Number(formData.minimumStock) || 0, // clave "minimumStock"
        providerId: formData.providerId || null,
        categoria: typeof formData.categoria === 'string' && mapaEnumNumerico[formData.categoria] !== undefined
          ? mapaEnumNumerico[formData.categoria]
          : (formData.categoria ?? 9),
        description: formData.description || '',
        state: formData.state !== undefined ? formData.state : true
      };
    
      if (modalMode === 'create') {
        await apiClient.post('/products', datosParaEnviar);
        showAlert("Producto creado correctamente", "success");
      } else if (modalMode === 'edit') {
        await apiClient.put(`/products/${formData.id}`, datosParaEnviar);
        showAlert("Producto actualizado correctamente", "success");
      }
      setIsModalOpen(false);
      cargarInventario();
    } catch (error) {
      console.error("Error al guardar:", error.response?.data || error);
      showAlert("Error al guardar el producto. Revisa los datos.", "error");
    }
  };

  const handleArchivoSeleccionado = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setArchivoSeleccionado(file);
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const response = await apiClient.post('/products/preview-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setProductosPreview(response.data); // Llena la lista para el modal
      setModalImportarAbierto(true);      // Abre el modal de confirmación
    } catch (error) {
      console.error("Error al previsualizar el Excel:", error);
      showAlert("El archivo Excel tiene un formato inválido o está vacío.", "error");
    } finally {
      setLoading(false);
      e.target.value = null; // Limpia el input para permitir re-subir el archivo si es necesario
    }
  };

  const confirmarImportacionMasiva = async () => {
    try {
      setImportando(true);
      const formData = new FormData();
      formData.append("file", archivoSeleccionado);
      // Enviamos la preferencia del usuario exactamente con el nombre que espera el C# ([FromForm] bool updateExisting)
      formData.append("updateExisting", actualizarExistentes);

      // Apuntamos al endpoint POST api/products/import que creamos recién
      const response = await apiClient.post('/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showAlert(response.data.Message || "¡Importación procesada con éxito!", "success");
      
      setModalImportarAbierto(false);
      setProductosPreview([]);
      setArchivoSeleccionado(null);
      cargarInventario(); // Recarga la tabla de productos
    } catch (error) {
      console.error("Error al importar:", error);
      showAlert(error.response?.data || "Hubo un error al procesar la importación.", "error");
    } finally {
      setImportando(false);
    }
  };

  const ultimoIndice = paginaActual * productosPorPagina;
  const primerIndice = ultimoIndice - productosPorPagina;
  const productosPaginados = productos.slice(primerIndice, ultimoIndice);
  const totalPaginas = Math.ceil(productos.length / productosPorPagina);

  return (
    <div className={`w-full max-w-full space-y-4 px-2 sm:px-3 lg:px-4 transition-colors duration-200 min-h-screen text-xs ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-800'}`}>
    
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border p-4 sm:p-5 rounded-2xl shadow-sm transition-colors ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#1C562A]/40 border border-[#5BA535]/30 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-[#5BA535]" />
          </div>
          <div>
            <h1 className={`text-lg sm:text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Control de Stock</h1>
            <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Gestión integral del catálogo de mercadería.</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-[#5BA535] hover:bg-[#4b8c2c] text-white px-3.5 py-2 rounded-xl font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      <div className={`border p-4 sm:p-5 rounded-2xl shadow-sm space-y-3.5 transition-colors ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">

          <div className="w-full">
            <label className={`block text-[10px] uppercase tracking-wider mb-1 font-semibold ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
              Buscar por Nombre
            </label>
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`} />
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
                className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-[#5BA535] transition-colors ${
                  darkMode 
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600' 
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          <div className="w-full">
            <label className={`block text-[10px] uppercase tracking-wider mb-1 font-semibold ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
              Filtrar por Categoría
            </label>
            <select
              value={filtroCategoria || ''}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-[#5BA535] cursor-pointer transition-colors ${
                darkMode 
                  ? 'bg-zinc-950 border-zinc-800 text-white' 
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="">Todas las categorías</option>
              <option value="Bebida">Bebida</option>
              <option value="FrutaVerdura">Fruta/Verdura</option>
              <option value="Lacteo">Lácteo</option>
              <option value="SnackDulce">Snack/Dulce</option>
              <option value="GranoCereal">Grano/Cereal</option>
              <option value="EnlatadoConserva">Enlatado/Conserva</option>
              <option value="Panaderia">Panadería</option>
              <option value="Limpieza">Limpieza</option>
              <option value="CuidadoPersonal">Cuidado Personal</option>
              <option value="Otros">Otros</option>
            </select>
          </div>

          <div className="w-full">
            <label className={`block text-[10px] uppercase tracking-wider mb-1 font-semibold ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
              Filtrar por Proveedor
            </label>
            <select
              value={filtroProveedor}
              onChange={(e) => setFiltroProveedor(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-[#5BA535] cursor-pointer transition-colors ${
                darkMode 
                  ? 'bg-zinc-950 border-zinc-800 text-white' 
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="">Todos los proveedores</option>
              {proveedores.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {prov.name}
                </option>
              ))}
            </select>
          </div>
            
          <div className="w-full">
            <label className={`block text-[10px] uppercase tracking-wider mb-1 font-semibold ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
              Filtrar Período
            </label>
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-[#5BA535] cursor-pointer transition-colors ${
                darkMode 
                  ? 'bg-zinc-950 border-zinc-800 text-white' 
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
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
            className={`w-full font-semibold px-4 py-2 rounded-xl text-xs transition-colors border cursor-pointer shadow-sm ${
              darkMode 
                ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            Buscar
          </button>

        </div>

        <div className={`flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t ${darkMode ? 'border-zinc-800/80' : 'border-slate-100'}`}>
          <div className="flex flex-wrap items-center gap-2">
          
           <button
             type="button"
             onClick={() => setIsExcelFormatModalOpen(true)}
             className={`border px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
               darkMode 
                 ? 'bg-zinc-950 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300' 
                 : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
             } ${importando ? 'opacity-50 pointer-events-none' : ''}`}
           >
             <Upload className="w-3.5 h-3.5 text-[#5BA535]" />
             <span>{importando ? 'Procesando...' : 'Importar Excel'}</span>
           </button>
             
            <input 
              type="file" 
              ref={excelInputRef}
              accept=".xlsx, .xls" 
              onChange={handleArchivoSeleccionado} 
              className="hidden" 
              disabled={importando} 
            />

            <button
              onClick={() => setIsPurchaseInvoiceModalOpen(true)}
              className={`border px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                darkMode 
                  ? 'bg-zinc-950 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300' 
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#5BA535]" />
              <span>Factura Proveedor</span>
            </button>
            
            <button onClick={() => exportarAExcel({})} className={`border px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              darkMode 
                ? 'bg-zinc-950 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#5BA535]" />
              <span>Exportar Excel</span>
            </button>
          
            <button onClick={() => exportarAPDF({})} className={`border px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              darkMode 
                ? 'bg-zinc-950 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              <FileText className="w-3.5 h-3.5 text-red-400" />
              <span>Exportar PDF</span>
            </button>
          </div>

          {productoAEliminar && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className={`border p-5 rounded-2xl max-w-sm w-full space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Confirmar eliminación</h3>
                <p className={`text-[11px] ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                  ¿Estás seguro de que querés eliminar el producto <span className={`font-semibold ${darkMode ? 'text-zinc-200' : 'text-slate-900'}`}>"{productoAEliminar.name}"</span>?
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setProductoAEliminar(null)}
                    className={`px-3.5 py-1.5 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer ${
                      darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarEliminacion}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Sí, eliminar
                  </button>
                </div>
              </div>
            </div>
          )}

          {(filtroNombre || filtroPeriodo || filtroProveedor || filtroCategoria) && (
            <button
              onClick={() => {
                setFiltroNombre('');
                setFiltroPeriodo('');
                setFiltroProveedor('');
                setFiltroCategoria('');
                cargarInventario();
              }}
              className={`text-[11px] transition-colors cursor-pointer font-medium ${darkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Limpiar filtros ×
            </button>
          )}
        </div>
      </div>

      {/* MODAL 1: Formato requerido para el Excel */}
      {isExcelFormatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`border p-5 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
            <div className={`flex items-center justify-between border-b pb-2.5 ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
              <h3 className={`text-xs font-bold flex items-center gap-1.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <Info className="w-3.5 h-3.5 text-[#5BA535]" /> Formato requerido para el archivo Excel
              </h3>
              <button 
                onClick={() => setIsExcelFormatModalOpen(false)}
                className={`text-xs font-semibold cursor-pointer ${darkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 text-[11px]">
              <p className={`leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                Para que la importación funcione correctamente, asegurate de que tu archivo Excel (`.xlsx` o `.xls`) contenga las siguientes columnas en la primera fila:
              </p>

              <div className={`border rounded-xl p-2.5 space-y-1.5 font-mono text-[10px] ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`flex justify-between border-b pb-1 font-semibold ${darkMode ? 'border-zinc-800/60 text-zinc-400' : 'border-slate-200 text-slate-500'}`}>
                  <span>Columna / Cabecera</span>
                  <span>Descripción</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5BA535]">barcode</span>
                  <span className={darkMode ? 'text-zinc-400' : 'text-slate-600'}>Código de barras (Texto/Núm)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5BA535]">name</span>
                  <span className={darkMode ? 'text-zinc-400' : 'text-slate-600'}>Nombre del producto (Obligatorio)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5BA535]">categoria</span>
                  <span className={darkMode ? 'text-zinc-400' : 'text-slate-600'}>Categoría del producto</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5BA535]">price</span>
                  <span className={darkMode ? 'text-zinc-400' : 'text-slate-600'}>Precio de venta</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5BA535]">stock</span>
                  <span className={darkMode ? 'text-zinc-400' : 'text-slate-600'}>Cantidad actual en stock</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5BA535]">minimumStock</span>
                  <span className={darkMode ? 'text-zinc-400' : 'text-slate-600'}>Stock mínimo de alerta</span>
                </div>
              </div>
            </div>

            <div className={`flex justify-end gap-2 pt-2.5 border-t ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
              <button
                onClick={() => setIsExcelFormatModalOpen(false)}
                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer ${
                  darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setIsExcelFormatModalOpen(false);
                  if (excelInputRef.current) {
                    excelInputRef.current.click();
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#5BA535] hover:bg-[#4b8c2c] text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <span>Continuar y seleccionar archivo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className={`flex flex-col items-center justify-center py-16 border rounded-2xl w-full ${darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'}`}>
          <Loader2 className="w-7 h-7 animate-spin text-[#5BA535] mb-2.5" />
          <p className={`text-[11px] font-medium ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Procesando consulta...</p>
        </div>
      ) : (
        <div className={`border rounded-2xl overflow-hidden shadow-sm w-full ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
          <InventarioTable productos={productosPaginados} onOpenRow={handleOpenRow} onDelete={handleDelete} providers={proveedores} darkMode={darkMode} />
        </div>
      )}

      <ProductModal 
        isOpen={isModalOpen} 
        mode={modalMode} 
        formData={formData} 
        setFormData={setFormData} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSaveSubmit} 
        providers={proveedores}
        darkMode={darkMode}
      />

      <CreatePurchaseInvoiceModal
        isOpen={isPurchaseInvoiceModalOpen}
        onClose={() => setIsPurchaseInvoiceModalOpen(false)}
        onInvoiceCreated={() => {
          cargarInventario();
        }}
        darkMode={darkMode}
      />

      {/* Paginación con índice numérico interactivo y responsiva */}
      {totalPaginas > 1 && (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 border px-3 py-2.5 sm:px-5 rounded-2xl shadow-sm w-full ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>

          <div className={`text-[11px] ${darkMode ? 'text-zinc-400' : 'text-slate-600'} sm:hidden`}>
            Página <strong className={darkMode ? 'text-white' : 'text-slate-900'}>{paginaActual}</strong> de <strong className={darkMode ? 'text-white' : 'text-slate-900'}>{totalPaginas}</strong>
          </div>

          <div className="hidden sm:block text-[11px] font-medium">
            Mostrando <span className={darkMode ? 'text-white font-bold' : 'text-slate-900 font-bold'}>{primerIndice + 1}</span> a <span className={darkMode ? 'text-white font-bold' : 'text-slate-900 font-bold'}>{Math.min(ultimoIndice, productos.length)}</span> de <span className={darkMode ? 'text-white font-bold' : 'text-slate-900 font-bold'}>{productos.length}</span> resultados
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
              disabled={paginaActual === 1}
              className={`inline-flex items-center justify-center p-1.5 rounded-xl border text-xs font-medium disabled:opacity-40 transition-colors cursor-pointer ${
                darkMode ? 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((numero) => {
              const esActual = paginaActual === numero;
              return (
                <button
                  key={numero}
                  onClick={() => setPaginaActual(numero)}
                  className={`w-7 h-7 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer flex items-center justify-center border ${
                    esActual
                      ? 'bg-[#5BA535] border-[#5BA535] text-white shadow-sm'
                      : darkMode 
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {numero}
                </button>
              );
            })}

            <button
              onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
              className={`inline-flex items-center justify-center p-1.5 rounded-xl border text-xs font-medium disabled:opacity-40 transition-colors cursor-pointer ${
                darkMode ? 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}

      {/* MODAL 2: Previsualización de productos antes de confirmar importación */}
      {modalImportarAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-2xl rounded-2xl border p-5 shadow-2xl ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>

            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold">Confirmar Importación Masiva</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-600'}`}>
                Total en archivo: {productosPreview.length} productos
              </span>
            </div>

            <p className={`text-[11px] mb-3 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
              Revisa los datos obtenidos del archivo. Algunos productos pueden ya encontrarse registrados en tu inventario.
            </p>

            {/* Opción para actualizar existentes */}
            <div className={`flex items-center gap-2.5 p-3 rounded-xl border mb-3 ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
              <input
                type="checkbox"
                id="chkActualizar"
                checked={actualizarExistentes}
                onChange={(e) => setActualizarExistentes(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-zinc-700 text-[#5BA535] focus:ring-[#5BA535] cursor-pointer"
              />
              <label htmlFor="chkActualizar" className="text-[11px] font-medium cursor-pointer select-none">
                <strong>Actualizar productos existentes:</strong> Si el código de barras ya figura en el sistema, se sobrescribirán sus datos.
              </label>
            </div>

            <div className={`max-h-52 overflow-y-auto rounded-xl border mb-4 ${darkMode ? 'border-zinc-800 bg-zinc-950' : 'border-slate-200 bg-slate-50'}`}>
              <table className="w-full text-left text-[11px]">
                <thead className={`sticky top-0 ${darkMode ? 'bg-zinc-900 text-zinc-400' : 'bg-slate-100 text-slate-600'}`}>
                  <tr>
                    <th className="p-2.5">Código</th>
                    <th className="p-2.5">Nombre</th>
                    <th className="p-2.5">Precio</th>
                    <th className="p-2.5">Stock</th>
                    <th className="p-2.5">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {productosPreview.map((prod, index) => (
                    <tr key={index} className={darkMode ? 'hover:bg-zinc-900/50' : 'hover:bg-slate-100/50'}>
                      <td className="p-2.5 font-mono">{prod.barcode || '-'}</td>
                      <td className="p-2.5 font-medium">{prod.name}</td>
                      <td className="p-2.5">${prod.price}</td>
                      <td className="p-2.5">{prod.stock}</td>
                      <td className="p-2.5">
                        {prod.isExisting ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Ya existe
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#5BA535]/10 text-[#5BA535] border border-[#5BA535]/20">
                            Nuevo
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
                
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalImportarAbierto(false);
                  setProductosPreview([]);
                  setArchivoSeleccionado(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer ${darkMode ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'}`}
              >
                Cancelar
              </button>
              
              <button
                type="button"
                disabled={importando}
                onClick={confirmarImportacionMasiva}
                className="px-4 py-1.5 rounded-xl text-[11px] font-semibold bg-[#5BA535] hover:bg-[#4d8d2d] text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {importando ? "Guardando..." : "Confirmar e Importar"}
              </button>
            </div>
              
          </div>
        </div>
      )}

    </div>
  );
}