import { useState, useEffect, useRef } from 'react';
import { exportarAExcel, exportarAPDF, importarArchivoExcel } from '../utils/excelPdfUtils';
import apiClient from '../api/apiClient';
import InventarioTable from '../components/InventarioTable';
import ProductModal from '../components/ProductModal';
import CreatePurchaseInvoiceModal from '../components/CreatePurchaseInvoiceModal';
import { useAlert } from '../context/AlertContext';
import {
  Package,
  Search,
  FileSpreadsheet,
  FileText,
  Upload,
  AlertTriangle,
  Loader2,
  Plus,
  Barcode,
  Info,
  X
} from 'lucide-react';

export default function Inventario() {
  const { showAlert } = useAlert();

  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('');
  const [filtrosActivos, setFiltrosActivos] = useState({ Name: '', Period: '' });
  
  const [cargandoImportacion, setCargandoImportacion] = useState(false);
  const [isExcelFormatModalOpen, setIsExcelFormatModalOpen] = useState(false);

  // Estados para el flujo OCR y Facturas
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [cargandoOcr, setCargandoOcr] = useState(false);
  const [archivoOcrActual, setArchivoOcrActual] = useState(null);
  const [datosOcrDetectados, setDatosOcrDetectados] = useState(null);
  const [margenGanancia, setMargenGanancia] = useState(30);

  const [isPurchaseInvoiceModalOpen, setIsPurchaseInvoiceModalOpen] = useState(false);

  const barcodeInputsRef = useRef([]);
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

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({ id: '', barcode: '', name: '', description: '', price: 0, stock: 0, minimumStock: 0, providerId: '' });
    setIsModalOpen(true);
  };

  const handleOpenRow = (prod, mode = 'view') => {
    setModalMode(mode);
    setFormData({
      id: prod.id || '', 
      barcode: prod.barcode || '', 
      name: prod.name || '',
      description: prod.description || '', 
      price: prod.price ?? 0, 
      stock: prod.stock ?? 0, 
      minimumStock: prod.minimumStock ?? 0,
      providerId: prod.providerId || ''
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

  const manejarSubidaFacturaOcr = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setArchivoOcrActual(file);
    setCargandoOcr(true);
    setIsOcrModalOpen(true);

    try {
      const formDataOcr = new FormData();
      formDataOcr.append('file', file);

      const response = await apiClient.post('/ocr/scan-invoice', formDataOcr, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setDatosOcrDetectados(response.data.items || []);
      showAlert("¡Factura procesada con éxito!", "success");
    } catch (error) {
      console.error("Error en OCR:", error);
      showAlert(error.response?.data?.message || "No se pudo leer la factura. Verificá el servicio OCR.", "error");
      setIsOcrModalOpen(false);
    } finally {
      setCargandoOcr(false);
      e.target.value = '';
    }
  };

  const handleOcrBarcodeChange = (index, value) => {
    setDatosOcrDetectados((prev) => {
      const actualizados = [...prev];
      actualizados[index].barcode = value;
      return actualizados;
    });
  };

  const handleBarcodeKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (barcodeInputsRef.current[index + 1]) {
        barcodeInputsRef.current[index + 1].focus();
      }
    }
  };

  const confirmarCargaMasivaOcr = async () => {
    if (!archivoOcrActual) return;

    try {
      setLoading(true);
    
      const formDataOcr = new FormData();
      formDataOcr.append('file', archivoOcrActual);
      formDataOcr.append('margenGanancia', margenGanancia);

      await apiClient.post('/ocr/guardar-inventario', formDataOcr, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    
      showAlert("¡Inventario actualizado y sincronizado por OCR con éxito!", "success");
      setIsOcrModalOpen(false);
      setDatosOcrDetectados(null);
      setArchivoOcrActual(null);
      cargarInventario();
    } catch (error) {
      console.error("Error al registrar productos por OCR:", error);
      showAlert("Hubo un error al guardar los productos en el inventario.", "error");
    } finally {
      setLoading(false);
    }
  };

  const ultimoIndice = paginaActual * productosPorPagina;
  const primerIndice = ultimoIndice - productosPorPagina;
  const productosPaginados = productos.slice(primerIndice, ultimoIndice);
  const totalPaginas = Math.ceil(productos.length / productosPorPagina);

  return (
    <div className="space-y-6">
     
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#1C562A]/40 border border-[#5BA535]/30 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-[#5BA535]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Control de Stock</h1>
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

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-2">
           
            <button
              type="button"
              onClick={() => setIsExcelFormatModalOpen(true)}
              className={`bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 transition-colors flex items-center gap-2 cursor-pointer ${cargandoImportacion ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Upload className="w-3.5 h-3.5 text-[#5BA535]" />
              <span>{cargandoImportacion ? 'Procesando...' : 'Importar Excel'}</span>
            </button>
            <input 
              type="file" 
              ref={excelInputRef}
              accept=".xlsx, .xls" 
              onChange={manejarImportacion} 
              className="hidden" 
              disabled={cargandoImportacion} 
            />

            <label className="cursor-pointer bg-[#1C562A]/30 hover:bg-[#1C562A]/50 border border-[#5BA535]/40 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#5BA535] transition-colors flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" />
              <span>Escanear Factura (IA)</span>
              <input 
                type="file" 
                accept="image/*, application/pdf" 
                onChange={manejarSubidaFacturaOcr} 
                className="hidden" 
              />
            </label>

            <button
              onClick={() => setIsPurchaseInvoiceModalOpen(true)}
              className="bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#5BA535]" />
              <span>Factura Proveedor</span>
            </button>
           
            <button onClick={() => exportarAExcel({})} className="bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 transition-colors flex items-center gap-2 cursor-pointer">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#5BA535]" />
              <span>Exportar Excel</span>
            </button>
           
            <button onClick={() => exportarAPDF({})} className="bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 transition-colors flex items-center gap-2 cursor-pointer">
              <FileText className="w-3.5 h-3.5 text-red-400" />
              <span>Exportar PDF</span>
            </button>
          </div>

          {productoAEliminar && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-sm font-bold text-white">Confirmar eliminación</h3>
                <p className="text-xs text-zinc-400">
                  ¿Estás seguro de que querés eliminar el producto <span className="text-zinc-200 font-semibold">"{productoAEliminar.name}"</span>?
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setProductoAEliminar(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarEliminacion}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Sí, eliminar
                  </button>
                </div>
              </div>
            </div>
          )}

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

      {/* Modal Guía Formato Excel */}
      {isExcelFormatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-[#5BA535]" /> Formato requerido para el archivo Excel
              </h3>
              <button 
                onClick={() => setIsExcelFormatModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <p className="text-zinc-400 leading-relaxed">
                Para que la importación funcione correctamente, asegurate de que tu archivo Excel (`.xlsx` o `.xls`) contenga las siguientes columnas en la primera fila:
              </p>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between border-b border-zinc-800/60 pb-1.5 text-zinc-400 font-semibold">
                  <span>Columna / Cabecera</span>
                  <span>Descripción</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5BA535]">barcode</span>
                  <span className="text-zinc-400">Código de barras (Texto/Núm)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5BA535]">name</span>
                  <span className="text-zinc-400">Nombre del producto (Obligatorio)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5BA535]">price</span>
                  <span className="text-zinc-400">Precio de venta</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5BA535]">stock</span>
                  <span className="text-zinc-400">Cantidad actual en stock</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5BA535]">minimumStock</span>
                  <span className="text-zinc-400">Stock mínimo de alerta</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setIsExcelFormatModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
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
                className="px-4 py-2 rounded-xl bg-[#5BA535] hover:bg-[#4b8c2c] text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <span>Continuar y seleccionar archivo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal OCR Factura (Fondo sólido corregido) */}
      {isOcrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-2xl w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🧾</span> Procesamiento Inteligente OCR 
              </h3>
              <button 
                onClick={() => { setIsOcrModalOpen(false); setDatosOcrDetectados(null); }}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {cargandoOcr ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#5BA535]" />
                  <p className="text-xs text-zinc-400 font-medium">Analizando imagen de la factura...</p>
                </div>
              ) : datosOcrDetectados ? (
                <div className="space-y-4">
                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-xs text-zinc-300">Margen de ganancia aplicado:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={margenGanancia}
                        onChange={(e) => setMargenGanancia(Number(e.target.value))}
                        className="w-16 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white text-center focus:outline-none focus:border-[#5BA535]"
                      />
                      <span className="text-xs text-[#5BA535] font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                        Productos Detectados ({datosOcrDetectados.length}):
                      </p>
                      <span className="text-[10px] text-zinc-500">Verificá los ítems extraídos antes de guardar</span>
                    </div>

                    <div className="space-y-2">
                      {datosOcrDetectados.map((item, idx) => {
                        const precioVentaCalculado = Math.round(item.price * (1 + margenGanancia / 100));
                        return (
                          <div key={idx} className="bg-zinc-950 border border-zinc-800/80 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex-1">
                              <p className="text-white font-medium">{item.name}</p>
                              <p className="text-zinc-400 text-[11px]">Costo: ${item.price} | Cantidad: {item.stock} | <span className="text-[#5BA535] font-semibold">Venta (Sugerido): ${precioVentaCalculado}</span></p>
                            </div>

                            <div className="relative min-w-[190px]">
                              <Barcode className="w-4 h-4 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                              <input
                                ref={(el) => (barcodeInputsRef.current[idx] = el)}
                                type="text"
                                placeholder="Código de barras"
                                value={item.barcode || ''}
                                onChange={(e) => handleOcrBarcodeChange(idx, e.target.value)}
                                onKeyDown={(e) => handleBarcodeKeyDown(e, idx)}
                                className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#5BA535] placeholder-zinc-600 transition-colors"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {!cargandoOcr && datosOcrDetectados && (
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800 shrink-0">
                <button
                  onClick={() => { setIsOcrModalOpen(false); setDatosOcrDetectados(null); }}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarCargaMasivaOcr}
                  className="px-4 py-2 rounded-xl bg-[#5BA535] hover:bg-[#4b8c2c] text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  Confirmar e ingresar al stock
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-[#5BA535] mb-3" />
          <p className="text-xs font-medium text-zinc-400">Procesando consulta...</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <InventarioTable productos={productosPaginados} onOpenRow={handleOpenRow} onDelete={handleDelete} providers={proveedores} />
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
      />

      <CreatePurchaseInvoiceModal
        isOpen={isPurchaseInvoiceModalOpen}
        onClose={() => setIsPurchaseInvoiceModalOpen(false)}
        onInvoiceCreated={() => {
          cargarInventario();
        }}
      />
      
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