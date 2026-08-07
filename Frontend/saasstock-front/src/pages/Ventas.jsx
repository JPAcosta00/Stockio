import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/apiClient';
import VentaDetalleModal from '../components/VentaDetalleModal';
import CobroModal from '../components/CobroModal';
import {
  ShoppingCart,
  Search,
  Barcode,
  Trash2,
  CreditCard,
  FileText,
  Loader2,
  Eye,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

// Genera o recupera un ID único para la pestaña/sesión actual del navegador
const getCartStorageKey = () => {
  try {
    const token = localStorage.getItem('token');
    let userId = 'guest';

    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.UserId || payload.userId || payload.sub || 'guest';
    }

    let tabSessionId = sessionStorage.getItem('pos_session_id');
    if (!tabSessionId) {
      tabSessionId = Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('pos_session_id', tabSessionId);
    }

    return `carrito_${userId}_${tabSessionId}`;
  } catch (error) {
    return `carrito_guest_${Date.now()}`;
  }
};

export default function Ventas() {
  const cartKey = getCartStorageKey();

  // Estados de datos
  const [carrito, setCarrito] = useState(() => {
    const carritoGuardado = localStorage.getItem(cartKey);
    return carritoGuardado ? JSON.parse(carritoGuardado) : [];
  });

  const [historialVentas, setHistorialVentas] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [mostrarModalCobro, setMostrarModalCobro] = useState(false);

  // Estados de UI
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [buscandoProducto, setBuscandoProducto] = useState(false);

  // Sistema de Alertas UI personalizado y responsive
  const [alerta, setAlerta] = useState(null); // { type: 'success' | 'error' | 'warning', message: '' }
  const [mostrarConfirmarVaciar, setMostrarConfirmarVaciar] = useState(false);

  // Para autocompletar el mostrador
  const [barcodeInput, setBarcodeInput] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [buscandoSugerencias, setBuscandoSugerencias] = useState(false);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  // Filtros en el historial de ventas
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [filtroTiempo, setFiltroTiempo] = useState('todos');

  // Referencias UI
  const barcodeRef = useRef(null);
  const dropdownRef = useRef(null);

  // Función para mostrar alertas auto-dismiss o estáticas
  const mostrarAlerta = (message, type = 'error') => {
    setAlerta({ message, type });
    if (type === 'success') {
      setTimeout(() => {
        setAlerta((prev) => (prev?.message === message ? null : prev));
      }, 4000);
    }
  };

  useEffect(() => {
    obtenerHistorialVentas();
  }, []);

  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(carrito));
    if (barcodeRef.current) barcodeRef.current.focus();
  }, [carrito, cartKey]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMostrarDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        const filtrados = listaProductos.filter((prod) => {
          const nombreCoincide = prod.name?.toLowerCase().includes(query);
          const codigoCoincide = prod.barcode?.toLowerCase().includes(query);
          return nombreCoincide || codigoCoincide;
        });

        setSugerencias(filtrados);
        setMostrarDropdown(true);
      } catch (err) {
        console.error('Error al buscar sugerencias:', err);
      } finally {
        setBuscandoSugerencias(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [barcodeInput]);

  const obtenerHistorialVentas = async () => {
    try {
      setLoadingHistorial(true);
      const response = await apiClient.get('/sales');
      setHistorialVentas(response.data);
    } catch (error) {
      console.error('Error al cargar historial de ventas:', error);
      mostrarAlerta('No se pudo cargar el historial de ventas.', 'error');
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
      console.error('Error al obtener el detalle de la venta:', error);
      mostrarAlerta('No se pudo cargar el detalle de esta venta.', 'error');
    } finally {
      setLoadingDetalle(false);
    }
  };

  const limpiarMostrador = () => {
    setCarrito([]);
    setMostrarConfirmarVaciar(false);
    mostrarAlerta('Se ha vaciado el mostrador actual.', 'success');
  };

  const agregarProductoAlCarrito = (prod) => {
    if (!prod) return;

    if (prod.stock <= 0) {
      mostrarAlerta(`El producto "${prod.name}" no tiene stock disponible.`, 'warning');
      return;
    }

    const existeEnCarrito = carrito.find((item) => item.productId === prod.id);

    if (existeEnCarrito) {
      if (existeEnCarrito.quantity + 1 > prod.stock) {
        mostrarAlerta(`No podés agregar más unidades de "${prod.name}". Stock máximo: ${prod.stock} un.`, 'warning');
        return;
      }
      setCarrito(
        carrito.map((item) =>
          item.productId === prod.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCarrito([
        ...carrito,
        {
          productId: prod.id,
          name: prod.name,
          barcode: prod.barcode,
          quantity: 1,
          unitPrice: prod.price,
          maxStock: prod.stock,
        },
      ]);
    }

    setBarcodeInput('');
    setSugerencias([]);
    setMostrarDropdown(false);
    setAlerta(null);
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
      console.error('Error al buscar por código:', error);
      mostrarAlerta(error.response?.data?.message || 'El producto no existe o hubo un error.', 'error');
    } finally {
      setBuscandoProducto(false);
      if (barcodeRef.current) barcodeRef.current.focus();
    }
  };

  const modificarCantidad = (productId, nuevaCantidad) => {
    const item = carrito.find((i) => i.productId === productId);
    if (!item) return;

    if (nuevaCantidad > item.maxStock) {
      mostrarAlerta(`Stock máximo disponible: ${item.maxStock} un.`, 'warning');
      return;
    }

    if (nuevaCantidad <= 0) {
      quitarDelCarrito(productId);
      return;
    }

    setCarrito(
      carrito.map((i) => (i.productId === productId ? { ...i, quantity: nuevaCantidad } : i))
    );
    setAlerta(null);
  };

  const quitarDelCarrito = (id) => {
    setCarrito(carrito.filter((item) => item.productId !== id));
  };

  const totalVenta = carrito.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  const confirmarVenta = async (datosCobro) => {
    if (carrito.length === 0) return;

    try {
      setEnviando(true);
      const paymentMethodMap = {
        EFECTIVO: 1,
        TRANSFERENCIA: 2,
        DEBITO: 3,
        CREDITO: 4,
      };

      const payload = {
        items: carrito.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
        paymentMethod: paymentMethodMap[datosCobro?.medioPago] || 1,
        receivedAmount: Number(datosCobro?.montoRecibido || totalVenta),
        changeAmount: Number(datosCobro?.vuelto || 0),
      };

      await apiClient.post('/sales', payload);
      mostrarAlerta('¡Venta registrada con éxito!', 'success');
      setCarrito([]);
      setMostrarModalCobro(false);
      await obtenerHistorialVentas();
    } catch (error) {
      console.error('Error al registrar venta:', error);
      const mensajeBackend =
        error.response?.data?.message ||
        JSON.stringify(error.response?.data) ||
        'Error al guardar la venta.';
      mostrarAlerta('Error del servidor: ' + mensajeBackend, 'error');
    } finally {
      setEnviando(false);
      if (barcodeRef.current) barcodeRef.current.focus();
    }
  };

  const historialFiltrado = historialVentas.filter((v) => {
    const fechaVenta = new Date(v.createdAt);
    const ahora = new Date();

    if (filtroTiempo === 'hoy') {
      const esHoy =
        fechaVenta.getDate() === ahora.getDate() &&
        fechaVenta.getMonth() === ahora.getMonth() &&
        fechaVenta.getFullYear() === ahora.getFullYear();
      if (!esHoy) return false;
    } else if (filtroTiempo === 'semana') {
      const hace7Dias = new Date();
      hace7Dias.setDate(ahora.getDate() - 7);
      if (fechaVenta < hace7Dias) return false;
    } else if (filtroTiempo === 'mes') {
      const esMismoMes =
        fechaVenta.getMonth() === ahora.getMonth() &&
        fechaVenta.getFullYear() === ahora.getFullYear();
      if (!esMismoMes) return false;
    }

    const q = busquedaHistorial.trim().toLowerCase();
    if (!q) return true;

    const coincideId = v.id?.toString().includes(q);
    const coincideBarcodeItem = v.items?.some(
      (item) => item.barcode?.toLowerCase().includes(q) || item.product?.barcode?.toLowerCase().includes(q)
    );

    return coincideId || coincideBarcodeItem;
  });

  return (
    <div className="space-y-6 pb-12 px-2 sm:px-0">
      
      {/* ALERTA / NOTIFICACIÓN FLOTANTE RESPONSIVE */}
      {alerta && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs shadow-lg transition-all animate-fade-in ${
          alerta.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200' 
            : alerta.type === 'warning'
            ? 'bg-amber-950/80 border-amber-800 text-amber-200'
            : 'bg-red-950/80 border-red-800 text-red-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {alerta.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="font-medium">{alerta.message}</span>
          </div>
          <button 
            onClick={() => setAlerta(null)}
            className="p-1 hover:bg-black/20 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-zinc-900 border border-zinc-800 p-5 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#1C562A]/40 border border-[#5BA535]/30 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-6 h-6 text-[#5BA535]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Terminal de Ventas</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Punto de venta y registro de operaciones en tiempo real.</p>
          </div>
        </div>
      </div>

      {/* BLOQUE SUPERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* INGRESO MANUAL / ESCANER CON AUTOCOMPLETE */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-2xl h-fit space-y-4 relative shadow-sm" ref={dropdownRef}>
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Ingreso de Artículo</h2>

          <form onSubmit={handleBarcodeSubmit} className="space-y-3">
            <div className="relative">
              <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5 font-semibold">
                Código de Barras o Nombre:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={barcodeRef}
                    type="text"
                    placeholder="Escaneá o buscá..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onFocus={() => sugerencias.length > 0 && setMostrarDropdown(true)}
                    disabled={enviando || buscandoProducto}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#5BA535] font-mono tracking-wider transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!barcodeInput.trim() || buscandoProducto || enviando}
                  className="bg-[#5BA535] hover:bg-[#4b8c2c] text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-30 cursor-pointer shadow-sm shrink-0"
                >
                  {buscandoProducto ? '...' : 'Añadir'}
                </button>
              </div>

              {/* SUGERENCIAS DROPDOWN */}
              {mostrarDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-zinc-800">
                  {buscandoSugerencias ? (
                    <div className="p-3 text-xs text-zinc-400 text-center flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5BA535]" />
                      <span>Buscando productos...</span>
                    </div>
                  ) : sugerencias.length === 0 ? (
                    <div className="p-3 text-xs text-zinc-500 text-center">Sin coincidencias.</div>
                  ) : (
                    sugerencias.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => agregarProductoAlCarrito(prod)}
                        className="w-full text-left p-3 hover:bg-zinc-800/80 flex justify-between items-center transition-colors group cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-medium text-zinc-200 group-hover:text-[#5BA535]">{prod.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{prod.barcode || 'Sin código'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono font-bold text-zinc-200">${prod.price?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                          <span className={`text-[10px] font-medium ${prod.stock > 0 ? 'text-zinc-400' : 'text-red-400'}`}>
                            Stock: {prod.stock}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 italic">
              💡 Podés escanear con la lectora o escribir para buscar por nombre.
            </p>
          </form>
        </div>

        {/* DETALLE DEL CARRITO */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-2xl flex flex-col justify-between shadow-sm min-h-[280px]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Mostrador Actual</h2>
              {carrito.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMostrarConfirmarVaciar(true)}
                  className="text-xs bg-red-950/40 border border-red-900/50 hover:bg-red-900/60 text-red-300 font-medium py-1 px-3 rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vaciar</span>
                </button>
              )}
            </div>

            {/* MODAL DE CONFIRMACIÓN PARA VACIAR */}
            {mostrarConfirmarVaciar && (
              <div className="mb-4 p-3 bg-red-950/30 border border-red-900/50 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <span className="text-red-200 font-medium">¿Estás seguro de vaciar todo el mostrador actual?</span>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button 
                    onClick={() => setMostrarConfirmarVaciar(false)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={limpiarMostrador}
                    className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    Sí, vaciar
                  </button>
                </div>
              </div>
            )}

            {carrito.length === 0 ? (
              <div className="text-center py-12 text-zinc-600 text-xs flex flex-col items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-zinc-700 mb-2" />
                <span>Mostrador vacío.</span>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs whitespace-nowrap sm:whitespace-normal">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase text-[10px]">
                      <th className="pb-2.5">Detalle</th>
                      <th className="pb-2.5 text-center">Cant.</th>
                      <th className="pb-2.5 text-right">Unitario</th>
                      <th className="pb-2.5 text-right">Subtotal</th>
                      <th className="pb-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {carrito.map((item) => (
                      <tr key={item.productId} className="hover:bg-zinc-950/30 transition-colors">
                        <td className="py-2.5 font-medium text-zinc-300">
                          {item.name} <span className="block text-[10px] text-zinc-500 font-mono">{item.barcode}</span>
                        </td>
                        <td className="py-2.5 text-center">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => modificarCantidad(item.productId, parseInt(e.target.value) || 0)}
                            className="w-14 text-center bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 font-mono text-xs text-zinc-200 focus:outline-none focus:border-[#5BA535]"
                          />
                        </td>
                        <td className="py-2.5 text-right font-mono text-zinc-300">${item.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 text-right font-mono text-zinc-200 font-semibold">${(item.quantity * item.unitPrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => quitarDelCarrito(item.productId)}
                            className="text-red-400 hover:text-red-300 p-1.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Facturado:</span>
              <span className="text-lg font-mono font-bold text-[#5BA535]">
                ${totalVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <button
              onClick={() => setMostrarModalCobro(true)}
              disabled={carrito.length === 0 || enviando}
              className="w-full bg-[#5BA535] hover:bg-[#4b8c2c] text-white font-semibold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-30 cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>{enviando ? 'Guardando Venta...' : 'Confirmar Registro'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* HISTORIAL DE VENTAS (se puede refactorizar)*/} 
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#5BA535]" />
            <h2 className="text-xs font-bold uppercase tracking-tight text-zinc-300">Registro Histórico de Ventas</h2>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            <div className="flex bg-zinc-950 border border-zinc-800 p-1 rounded-xl overflow-x-auto">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'hoy', label: 'Hoy' },
                { id: 'semana', label: 'Últ. Semana' },
                { id: 'mes', label: 'Mes' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFiltroTiempo(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
                    filtroTiempo === item.id
                      ? 'bg-[#5BA535] text-white font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por ID o Código..."
                value={busquedaHistorial}
                onChange={(e) => setBusquedaHistorial(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#5BA535] font-mono transition-colors"
              />
            </div>
          </div>
        </div>

        {loadingHistorial ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#5BA535] mb-2" />
            <p className="text-xs text-zinc-400">Cargando historial...</p>
          </div>
        ) : historialFiltrado.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 text-xs">
            {busquedaHistorial || filtroTiempo !== 'todos'
              ? 'No se encontraron ventas para los filtros seleccionados.'
              : 'No se registran transacciones previas.'}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs divide-y divide-zinc-800 whitespace-nowrap sm:whitespace-normal">
              <thead>
                <tr className="text-zinc-500 font-semibold uppercase text-[10px]">
                  <th className="pb-3">ID de venta</th>
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
                    <td className="py-3 font-mono text-[#5BA535] text-[11px] group-hover:underline font-semibold">
                      #{v.id}
                    </td>
                    <td className="py-3 text-zinc-300">
                      {new Date(v.createdAt).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      hs.
                    </td>
                    <td className="py-3 text-right font-mono text-zinc-100 font-bold text-xs">
                      ${v.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-center text-xs text-zinc-400 group-hover:text-white flex items-center justify-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#5BA535]" />
                      <span>Ver Detalle</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE DETALLE DE VENTA */}
      <VentaDetalleModal
        venta={ventaSeleccionada}
        loading={loadingDetalle}
        onClose={() => setVentaSeleccionada(null)}
      />

      {/* MODAL DE COBRO Y CALCULADORA DE VUELTO */}
      <CobroModal
        isOpen={mostrarModalCobro}
        onClose={() => setMostrarModalCobro(false)}
        totalVenta={totalVenta}
        onConfirmarVenta={confirmarVenta}
        enviando={enviando}
      />
    </div>
  );
}