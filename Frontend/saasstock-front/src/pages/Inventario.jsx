import { useState, useEffect } from 'react';
import { exportarAExcel, exportarAPDF, importarArchivoExcel } from '../utils/excelPdfUtils';
import apiClient from '../api/apiClient';
import InventarioTable from '../components/InventarioTable';
import ProductModal from '../components/ProductModal';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de los inputs de filtro 
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState(''); 

  const [filtrosActivos, setFiltrosActivos] = useState({ Name: '', Period: '' });
  
  const [cargandoImportacion, setCargandoImportacion] = useState(false);

  //para limitar la cantidad de productos
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 15;

  // Estados del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [formData, setFormData] = useState({
    id: '', barcode: '', name: '', description: '', price: 0, stock: 0, minimumStock: 0
  });

  // 1. Cargar inventario INICIAL (se trae al montar el componente)
  const cargarInventario = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/products');
      setProductos(response.data);
    } catch (error) {
      console.error("Error al cargar el inventario:", error);
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
      
      // Se arma el objeto con los filtros actuales
      const nuevosFiltros = {
        Name: filtroNombre.trim(),
        Period: filtroPeriodo
      };

      // Se guardan los filtros activos para usar en la exportacion de productos
      setFiltrosActivos(nuevosFiltros);

      const response = await apiClient.get('/products', { params: nuevosFiltros });
      setProductos(response.data); // Actualiza la tabla con los resultados filtrados
    } catch (error) {
      console.error("Error al filtrar los productos:", error);
      alert("Hubo un error al realizar la búsqueda.");
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
        alert("Producto eliminado con éxito");
        cargarInventario();
      } catch (error) {
        alert("No se pudo eliminar el producto");
      }
    }
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await apiClient.post('/products', formData);
      } else if (modalMode === 'edit') {
        console.log("Enviando a editar:", formData.id, formData);
        await apiClient.put(`/products/${formData.id}`, formData);
      }
      setIsModalOpen(false);
      cargarInventario();
    } catch (error) {
      alert("Hubo un error al procesar la solicitud.");
    }
  };

  const manejarImportacion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCargandoImportacion(true);
    try {
      const resultado = await importarArchivoExcel(file);
      alert(resultado.message);
      cargarInventario();
    } catch (error) {
      alert(error.response?.data || "Error inesperado al subir.");
    } finally {
      setCargandoImportacion(false);
      e.target.value = ''; 
    }
  };

  // Calculo de los indices
  const ultimoIndice = paginaActual * productosPorPagina;
  const primerIndice = ultimoIndice - productosPorPagina;

  // Array que muestra el limite de la pagina
  const productosPaginados = productos.slice(primerIndice, ultimoIndice);

  // Calculo del total de paginas 
  const totalPaginas = Math.ceil(productos.length / productosPorPagina);

  return (
    <div className="space-y-6">
      {/* ENCABEZADO */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Control de Stock</h1>
          <p className="text-zinc-400 mt-2">Gestión integral del catálogo de mercadería.</p>
        </div>
        <button onClick={handleOpenCreate} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-lg transition-colors">
          + Nuevo Producto
        </button>
      </div>

      {/* SECCIÓN DE FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col md:flex-row items-end gap-4 bg-zinc-900/40 p-5 rounded-xl border border-zinc-800/60">
        <div className="flex-1 w-full">
          <label className="block text-xs text-zinc-400 mb-1 font-medium">Buscar por Nombre</label>
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
            className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder-zinc-600" 
          />
        </div>
        
        <div className="w-full md:w-48">
          <label className="block text-xs text-zinc-400 mb-1 font-medium">Filtrar Período</label>
          <select 
            value={filtroPeriodo} 
            onChange={(e) => setFiltroPeriodo(e.target.value)} 
            className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer" 
          >
            <option value="">Todos los registros</option>
            <option value="hoy">Hoy</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
            <option value="anio">Este Año</option>
          </select>
        </div>

        {/* BOTÓN BUSCAR */}
        <button 
          onClick={handleBuscar}
          className="w-full md:w-auto bg-zinc-100 hover:bg-white text-zinc-950 font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors shadow-md"
        >
           Buscar
        </button>
      </div>

      {/* ACCIONES EXPORT / IMPORT (Exporta los productos de todo el inventario) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-3">
          <label className={`cursor-pointer bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${cargandoImportacion ? 'opacity-50 pointer-events-none' : ''}`}>
            {cargandoImportacion ? '⏳ Procesando...' : '📊 Importar Excel'}
            <input type="file" accept=".xlsx, .xls" onChange={manejarImportacion} className="hidden" disabled={cargandoImportacion} />
          </label>
          
          {/* exporta lo que se ve en la grilla */}
          <button onClick={() => exportarAExcel(filtrosActivos)} className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            🟢 Exportar Excel (Vista)
          </button>
          
          <button onClick={() => exportarAPDF(filtrosActivos)} className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            🛑 Exportar PDF (Vista)
          </button>
        </div>

        {/* Botón rápido para restablecer la vista */}
        {(filtroNombre || filtroPeriodo) && (
          <button 
            onClick={() => {
              setFiltroNombre('');
              setFiltroPeriodo('');
              cargarInventario();
            }}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Limpiar filtros ×
          </button>
        )}
      </div>

      {/* TABLA MODULAR */}
      {loading ? (
        <p className="text-zinc-400 font-medium py-10 text-center">Procesando consulta...</p>
      ) : (
        <InventarioTable productos={productosPaginados} onOpenRow={handleOpenRow} onDelete={handleDelete} />
      )}

      {/* MODAL MODULAR */}
      <ProductModal isOpen={isModalOpen} mode={modalMode} formData={formData} setFormData={setFormData} onClose={() => setIsModalOpen(false)} onSubmit={handleSaveSubmit} />
      
      {/* CONTROLES DE PAGINACIÓN */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-4 sm:px-6 mt-4">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
              disabled={paginaActual === 1}
              className="relative inline-flex items-center rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
             Anterior
            </button>
            <button
              onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
              className="relative ml-3 inline-flex items-center rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
            Siguiente
            </button>
          </div>
    
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-zinc-400">
                Mostrando <span className="font-semibold text-zinc-200">{primerIndice + 1}</span> a{' '}
                <span className="font-semibold text-zinc-200">
                  {Math.min(ultimoIndice, productos.length)}
                </span>{' '}
                de <span className="font-semibold text-zinc-200">{productos.length}</span> productos
              </p>
            </div>
      
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                {/* Botón Anterior */}
                <button
                  onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                  disabled={paginaActual === 1}
                  className="relative inline-flex items-center rounded-l-md px-3 py-2 text-zinc-400 ring-1 ring-inset ring-zinc-800 hover:bg-zinc-800 focus:z-20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                  <span className="sr-only">Anterior</span>
                  ‹
                </button>

                {/* Números de Página */}
                {[...Array(totalPaginas)].map((_, index) => {
                  const numeroPagina = index + 1;
                  const esActiva = numeroPagina === paginaActual;
                  return (
                    <button
                      key={numeroPagina}
                      onClick={() => setPaginaActual(numeroPagina)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 transition-colors ${
                        esActiva
                          ? 'z-10 bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/30'
                          : 'text-zinc-400 ring-1 ring-inset ring-zinc-800 hover:bg-zinc-800'
                      }`}
                    >
                      {numeroPagina}
                    </button>
                  );
                })}

                {/* Botón Siguiente */}
                <button
                  onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                  className="relative inline-flex items-center rounded-r-md px-3 py-2 text-zinc-400 ring-1 ring-inset ring-zinc-800 hover:bg-zinc-800 focus:z-20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
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