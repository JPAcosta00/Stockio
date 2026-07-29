import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/apiClient';
import VentaDetalleModal from '../components/VentaDetalleModal';

export default function Ventas() {
  // Estados de datos 
  const [carrito, setCarrito] = useState(() => {
    const carritoGuardado = localStorage.getItem('carrito_mostrador');
    return carritoGuardado ? JSON.parse(carritoGuardado) : [];
  });
  const [historialVentas, setHistorialVentas] = useState([]);
  
  // Modal de detalle
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  // Estados de UI
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [buscandoProducto, setBuscandoProducto] = useState(false);

  // --- NUEVO: AUTOCOMPLETE PARA MOSTRADOR ---
  const [barcodeInput, setBarcodeInput] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [buscandoSugerencias, setBuscandoSugerencias] = useState(false);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  // --- NUEVO: FILTRO EN HISTORIAL ---
  const [busquedaHistorial, setBusquedaHistorial] = useState('');

  // Referencias UI
  const barcodeRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    obtenerHistorialVentas();
  }, []);

  useEffect(() => {
    localStorage.setItem('carrito_mostrador', JSON.stringify(carrito));
    if (barcodeRef.current) barcodeRef.current.focus();
  }, [carrito]);

  // Cierra el dropdown del autocomplete si se hace click fuera del componente
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMostrarDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce para autocomplete de productos 
  useEffect(() => {
    const query = barcodeInput.trim().toLowerCase();
    if (query.length < 2) {
      setSugerencias([]);
      setMostrarDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setBuscandoSugerencias(true);
        const res = await apiClient.get('/products', { params: { search: query } });
        const listaProductos = res.data || [];

        // FILTRO EN FRONTEND: descarta lo que no coincida exactamente con la búsqueda
        const filtrados = listaProductos.filter(prod => {
          const nombreCoincide = prod.name?.toLowerCase().includes(query);
          const codigoCoincide = prod.barcode?.toLowerCase().includes(query);
          return nombreCoincide || codigoCoincide;
        });

        setSugerencias(filtrados);
        setMostrarDropdown(true);
      } catch (err) {
        console.error("Error al buscar sugerencias:", err);
      } finally {
        setBuscandoSugerencias(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [barcodeInput]);

  // Cargar historial
  const obtenerHistorialVentas = async () => {
    try {
      setLoadingHistorial(true);
      const response = await apiClient.get('/sales');
      setHistorialVentas(response.data);
    } catch (error) {
      console.error("Error al cargar historial de ventas:", error);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const abrirDetalleVenta = async (venta) => {
    try {
      setLoadingDetalle(true);
      const response = await apiClient.get(`/sales/${venta.id}`);
      setVentaSeleccionada(response.data);
    } catch (error) {
      console.error("Error al obtener el detalle de la venta:", error);
      alert("No se pudo cargar el detalle de esta venta.");
    } finally {
      setLoadingDetalle(false);
    }
  };

  const limpiarMostrador = () => {
    if (window.confirm("¿Estás seguro de que querés vaciar todo el mostrador actual?")) {
      setCarrito([]);
    }
  };

  // Helper para añadir un producto (utilizado tanto por escáner como por el autocomplete)
  const agregarProductoAlCarrito = (prod) => {
    if (!prod) return;

    if (prod.stock <= 0) {
      alert(`El producto "${prod.name}" no tiene stock disponible.`);
      return;
    }

    const existeEnCarrito = carrito.find(item => item.productId === prod.id);
    
    if (existeEnCarrito) {
      if (existeEnCarrito.quantity + 1 > prod.stock) {
        alert(`No podés agregar más unidades de "${prod.name}". Stock máximo: ${prod.stock} un.`);
        return;
      }
      setCarrito(carrito.map(item =>
        item.productId === prod.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCarrito([...carrito, {
        productId: prod.id,
        name: prod.name,
        barcode: prod.barcode,
        quantity: 1,
        unitPrice: prod.price,
        maxStock: prod.stock 
      }]);
    }

    setBarcodeInput('');
    setSugerencias([]);
    setMostrarDropdown(false);
  };

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    const codigoLimpio = barcodeInput.trim();
    if (!codigoLimpio) return;

    try {
      setBuscandoProducto(true);
      const response = await apiClient.get(`/products/barcode/${codigoLimpio}`);
      agregarProductoAlCarrito(response.data);
    } catch (error) {
      console.error("Error al buscar por código:", error);
      alert(error.response?.data?.message || "El producto no existe o hubo un error en el servidor.");
    } finally {
      setBuscandoProducto(false);
      if (barcodeRef.current) barcodeRef.current.focus();
    }
  };

  const modificarCantidad = (productId, nuevaCantidad) => {
    const item = carrito.find(i => i.productId === productId);
    if (!item) return;

    if (nuevaCantidad > item.maxStock) {
      alert(`Stock máximo disponible en inventario: ${item.maxStock} un.`);
      return;
    }

    if (nuevaCantidad <= 0) {
      quitarDelCarrito(productId);
      return;
    }

    setCarrito(carrito.map(i =>
      i.productId === productId ? { ...i, quantity: nuevaCantidad } : i
    ));
  };

  const quitarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.productId !== id));
  };

  const totalVenta = carrito.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  const confirmarVenta = async () => {
    if (carrito.length === 0) return;

    try {
      setEnviando(true);
      const payload = {
        items: carrito.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      };

      await apiClient.post('/sales', payload);
      alert("¡Venta registrada con éxito!");
      setCarrito([]);
      await obtenerHistorialVentas();
    } catch (error) {
      console.error("Error al registrar venta:", error);
      alert(error.response?.data?.message || "Error al guardar la venta.");
    } finally {
      setEnviando(false);
      if (barcodeRef.current) barcodeRef.current.focus();
    }
  };

  // Filtrado de historial por ID o Código de Barras
  const historialFiltrado = historialVentas.filter(v => {
    const q = busquedaHistorial.trim().toLowerCase();
    if (!q) return true;
    
    const coincideId = v.id?.toString().includes(q);
    const coincideBarcodeItem = v.items?.some(item => 
      item.barcode?.toLowerCase().includes(q) || item.product?.barcode?.toLowerCase().includes(q)
    );

    return coincideId || coincideBarcodeItem;
  });

  return (
    <div className="p-6 bg-zinc-950 text-zinc-100 min-h-screen space-y-6">
      {/* CABECERA */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Terminal de Ventas</h1>
        <p className="text-xs text-zinc-400">Punto de venta y registro de operaciones en tiempo real.</p>
      </div>

      {/* BLOQUE SUPERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* INGRESO MANUAL / ESCANER CON AUTOCOMPLETE */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl h-fit space-y-3 relative" ref={dropdownRef}>
          <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Ingreso de Artículo</h2>
          
          <form onSubmit={handleBarcodeSubmit} className="space-y-3">
            <div className="relative">
              <label className="block text-xs text-zinc-400 font-medium mb-1">
                Código de Barras o Nombre:
              </label>
              <div className="flex gap-2">
                <input
                  ref={barcodeRef}
                  type="text"
                  placeholder="Escaneá o buscá un producto..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onFocus={() => sugerencias.length > 0 && setMostrarDropdown(true)}
                  disabled={enviando || buscandoProducto}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-emerald-500 font-mono tracking-wider"
                />
                <button
                  type="submit"
                  disabled={!barcodeInput.trim() || buscandoProducto || enviando}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 rounded-lg text-xs font-semibold transition-colors disabled:opacity-30"
                >
                  {buscandoProducto ? '...' : 'Añadir'}
                </button>
              </div>

              {/* DROPDOWN DE SUGERENCIAS */}
              {mostrarDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-zinc-800">
                  {buscandoSugerencias ? (
                    <div className="p-3 text-xs text-zinc-500 text-center">Buscando productos...</div>
                  ) : sugerencias.length === 0 ? (
                    <div className="p-3 text-xs text-zinc-500 text-center">Sin coincidencias.</div>
                  ) : (
                    sugerencias.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => agregarProductoAlCarrito(prod)}
                        className="w-full text-left p-2.5 hover:bg-zinc-800 flex justify-between items-center transition-colors group"
                      >
                        <div>
                          <p className="text-xs font-medium text-zinc-200 group-hover:text-emerald-400">{prod.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{prod.barcode || 'Sin código'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono font-bold text-zinc-300">${prod.price?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                          <span className={`text-[9px] ${prod.stock > 0 ? 'text-zinc-400' : 'text-red-400'}`}>
                            Stock: {prod.stock}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 italic">
              💡 Podés escanear con la lectora o escribir para buscar por nombre.
            </p>
          </form>
        </div>

        {/* DETALLE DEL CARRITO */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between min-h-[260px]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Mostrador Actual</h2>
              {carrito.length > 0 && (
                <button 
                  type="button" 
                  onClick={limpiarMostrador} 
                  className="text-xs bg-red-950/40 border border-red-800/50 hover:bg-red-900/60 text-red-300 font-medium py-1 px-3 rounded-lg flex items-center gap-1.5 transition-all duration-200"
                >
                  🗑️ Vaciar
                </button>
              )}
            </div>

            {carrito.length === 0 ? (
              <div className="text-center py-12 text-zinc-600 text-xs">
                Mostrador vacío. Escaneá un código de barras para comenzar.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase">
                      <th className="pb-2">Detalle</th>
                      <th className="pb-2 text-center">Cant.</th>
                      <th className="pb-2 text-right">Unitario</th>
                      <th className="pb-2 text-right">Subtotal</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {carrito.map((item) => (
                      <tr key={item.productId} className="hover:bg-zinc-950/20">
                        <td className="py-2.5 font-medium text-zinc-300">
                          {item.name} <span className="block text-[10px] text-zinc-500 font-mono">{item.barcode}</span>
                        </td>
                        <td className="py-2.5 text-center">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => modificarCantidad(item.productId, parseInt(e.target.value) || 0)}
                            className="w-12 text-center bg-zinc-950 border border-zinc-800 rounded p-1 font-mono text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className="py-2.5 text-right font-mono">${item.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 text-right font-mono">${(item.quantity * item.unitPrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => quitarDelCarrito(item.productId)}
                            className="text-red-400 hover:text-red-300 px-2 text-sm"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* TOTALES */}
          <div className="mt-4 border-t border-zinc-800 pt-4 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-zinc-400">TOTAL FACTURADO:</span>
              <span className="text-lg font-mono font-bold text-emerald-400">
                ${totalVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <button
              onClick={confirmarVenta}
              disabled={carrito.length === 0 || enviando}
              className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold py-2.5 rounded-lg text-xs transition-colors disabled:opacity-20"
            >
              {enviando ? '⏳ Guardando Venta...' : '⚡ Confirmar Registro'}
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: HISTORIAL DE VENTAS */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">📋 Registro Histórico de Ventas</h2>
          
          {/* LUPA / FILTRO DE BÚSQUEDA */}
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-2 text-zinc-500 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Buscar por ID o Código de Barras..."
              value={busquedaHistorial}
              onChange={(e) => setBusquedaHistorial(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        {loadingHistorial ? (
          <p className="text-center py-6 text-zinc-500 text-xs">Cargando historial...</p>
        ) : historialFiltrado.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-xs">
            {busquedaHistorial ? 'No se encontraron ventas con esa coincidencia.' : 'No se registran transacciones previas.'}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs divide-y divide-zinc-800">
              <thead>
                <tr className="text-zinc-500 font-semibold uppercase">
                  <th className="pb-3">ID Venta</th>
                  <th className="pb-3">Fecha y Hora</th>
                  <th className="pb-3 text-right">Monto Total</th>
                  <th className="pb-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {historialFiltrado.map((v) => (
                  <tr 
                    key={v.id} 
                    onClick={() => abrirDetalleVenta(v)}
                    className="hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 font-mono text-emerald-500 text-[11px] group-hover:underline">
                      #{v.id}
                    </td>
                    <td className="py-3 text-zinc-300">
                      {new Date(v.createdAt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} hs.
                    </td>
                    <td className="py-3 text-right font-mono text-zinc-100 font-bold text-sm">
                      ${v.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-center text-xs text-zinc-500 group-hover:text-zinc-300">
                      🔍 Ver Detalle
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE VENTAS */}
      <VentaDetalleModal 
        venta={ventaSeleccionada} 
        loading={loadingDetalle}
        onClose={() => setVentaSeleccionada(null)} 
      />
    </div>
  );
}