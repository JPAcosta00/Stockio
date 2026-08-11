import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/apiClient';
import VentaDetalleModal from '../components/VentaDetalleModal';
import CobroModal from '../components/CobroModal';
import GraficoVentasPorCategoria from '../components/GraficoVentasPorCategoria';
import TicketModal from '../components/TicketModal';
import { useTheme } from '../components/DashboardLayout';
import {
  ShoppingCart,
  Search,
  Barcode,
  Trash2,
  CreditCard,
  FileText,
  Loader2,
  Eye,
  Printer,
  AlertCircle,
  CheckCircle2,
  X,
  TrendingUp,
  PackageCheck
} from 'lucide-react';

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
  const { darkMode } = useTheme();

  const [carrito, setCarrito] = useState(() => {
    const carritoGuardado = localStorage.getItem(cartKey);
    return carritoGuardado ? JSON.parse(carritoGuardado) : [];
  });

  const [historialVentas, setHistorialVentas] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [mostrarModalCobro, setMostrarModalCobro] = useState(false);
  const [ventaParaTicket, setVentaParaTicket] = useState(null);

  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [buscandoProducto, setBuscandoProducto] = useState(false);

  const [alerta, setAlerta] = useState(null);
  const [mostrarConfirmarVaciar, setMostrarConfirmarVaciar] = useState(false);

  const [barcodeInput, setBarcodeInput] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [buscandoSugerencias, setBuscandoSugerencias] = useState(false);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [filtroTiempo, setFiltroTiempo] = useState('todos');

  const barcodeRef = useRef(null);
  const dropdownRef = useRef(null);

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
  const totalArticulosItems = carrito.reduce((acc, item) => acc + item.quantity, 0);

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

      const response = await apiClient.post('/sales', payload);

      // 🛡️ Normalizamos los ítems del carrito para garantizar que el TicketModal los lea bien
      const itemsNormalizados = carrito.map(item => ({
        name: item.name || item.productName || item.descripcion || 'Producto',
        quantity: Number(item.quantity || item.cantidad || 1),
        unitPrice: Number(item.unitPrice || item.price || item.precio || 0)
      }));

      // Obtenemos los datos del backend o usamos los del payload local de respaldo
      const dataBackend = response.data?.sale || response.data || {};

      const ventaCreada = {
        id: dataBackend.id || dataBackend.saleId || 'N/D',
        createdAt: dataBackend.createdAt || new Date(),
        // Forzamos el uso de los ítems normalizados del carrito actual para que nunca falle
        items: itemsNormalizados, 
        total: dataBackend.total || dataBackend.montoTotal || totalVenta,
        paymentMethod: datosCobro?.medioPago,
        receivedAmount: datosCobro?.montoRecibido,
        changeAmount: datosCobro?.vuelto
      };

      mostrarAlerta('¡Venta registrada con éxito!', 'success');
      setCarrito([]);
      setMostrarModalCobro(false);

      // Abrir modal de ticket automáticamente con la estructura garantizada
      setVentaParaTicket(ventaCreada);

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

  // Ventas de hoy para pasárselas al gráfico por categoría
  const ventasHoy = historialVentas.filter((v) => {
    const f = new Date(v.createdAt);
    const ahora = new Date();
    return f.getDate() === ahora.getDate() && f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
  });

  return (
    <div className="space-y-6 pb-12 px-2 sm:px-0">
      
      {/* Alertas dinámicas */}
      {alerta && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs shadow-lg transition-all animate-fade-in ${
          alerta.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
            : alerta.type === 'warning'
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
            : 'bg-rose-500/10 border-rose-500/25 text-rose-500'
        }`}>
          <div className="flex items-center gap-2.5">
            {alerta.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="font-semibold">{alerta.message}</span>
          </div>
          <button 
            onClick={() => setAlerta(null)}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Unificado */}
      <div className={`border p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className={`text-lg font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Terminal de Ventas</h1>
            <p className={`text-[11px] ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Caja activa, escáner de artículos y registro rápido de operaciones.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800">
          <div className={`px-4 py-2 rounded-xl border text-right ${darkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <span className={`text-[10px] uppercase font-semibold tracking-wider block ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Ventas de Hoy</span>
            <span className={`text-sm font-bold font-mono ${darkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
              {ventasHoy.length} op. (${ventasHoy.reduce((acc, v) => acc + (v.total || 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })})
            </span>
          </div>
        </div>
      </div>

      {/* Main POS Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Input y Buscador de Artículos */}
        <div className={`lg:col-span-4 border p-5 rounded-2xl h-fit space-y-5 relative shadow-xl transition-colors ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`} ref={dropdownRef}>
          <div>
            <h2 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Busqueda de Producto</h2>
            <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Escanee o busque por nombre.</p>
          </div>

          <form onSubmit={handleBarcodeSubmit} className="space-y-4">
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={barcodeRef}
                    type="text"
                    placeholder="Código de barras o producto..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onFocus={() => sugerencias.length > 0 && setMostrarDropdown(true)}
                    disabled={enviando || buscandoProducto}
                    className={`w-full pl-10 pr-3 py-3 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 font-mono tracking-wider transition-colors ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!barcodeInput.trim() || buscandoProducto || enviando}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-xs font-semibold transition-colors disabled:opacity-30 cursor-pointer shadow-lg shadow-emerald-600/15 shrink-0"
                >
                  {buscandoProducto ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Añadir'}
                </button>
              </div>

              {/* Dropdown de Sugerencias */}
              {mostrarDropdown && (
                <div className={`absolute left-0 right-0 top-full mt-2 border rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto divide-y transition-colors ${
                  darkMode ? 'bg-zinc-900 border-zinc-800 divide-zinc-800' : 'bg-white border-zinc-200 divide-zinc-100'
                }`}>
                  {buscandoSugerencias ? (
                    <div className={`p-3 text-xs text-center flex items-center justify-center gap-2 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                      <span>Buscando coincidencias...</span>
                    </div>
                  ) : sugerencias.length === 0 ? (
                    <div className={`p-3 text-xs text-center ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Sin coincidencias de productos.</div>
                  ) : (
                    sugerencias.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => agregarProductoAlCarrito(prod)}
                        className={`w-full text-left p-3 flex justify-between items-center transition-colors group cursor-pointer ${
                          darkMode ? 'hover:bg-zinc-800/80' : 'hover:bg-zinc-50'
                        }`}
                      >
                        <div>
                          <p className={`text-xs font-semibold group-hover:text-emerald-500 ${darkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{prod.name}</p>
                          <p className={`text-[10px] font-mono mt-0.5 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{prod.barcode || 'Sin código'}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-mono font-bold ${darkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>${prod.price?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                          <span className={`text-[10px] font-medium ${prod.stock > 0 ? (darkMode ? 'text-zinc-400' : 'text-zinc-600') : 'text-rose-500'}`}>
                            Stock: {prod.stock}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </form>

          <div className={`p-3.5 rounded-xl border text-[11px] leading-relaxed ${
            darkMode ? 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-500'
          }`}>
            <span className="font-semibold block mb-0.5 text-emerald-500">Modo de Operación Ágil</span>
            Utiliza tu lector láser directamente sobre los productos o ingresa las primeras letras para autocompletar el cobro.
          </div>
        </div>

        {/* Columna Derecha: Mostrador Actual (Carrito) */}
        <div className={`lg:col-span-8 border p-5 rounded-2xl flex flex-col justify-between shadow-xl transition-colors ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Mostrador Actual</h2>
                <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Línea de artículos pendientes de facturación.</p>
              </div>
              {carrito.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMostrarConfirmarVaciar(true)}
                  className={`text-xs border font-medium py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    darkMode 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                      : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vaciar Mostrador</span>
                </button>
              )}
            </div>

            {/* Prompt Confirmar Vaciar */}
            {mostrarConfirmarVaciar && (
              <div className={`mb-4 p-3.5 border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                darkMode ? 'bg-rose-950/30 border-rose-900/50 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <span className="font-medium">¿Estás seguro de vaciar todos los ítems actuales?</span>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button 
                    onClick={() => setMostrarConfirmarVaciar(false)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={limpiarMostrador}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    Sí, vaciar
                  </button>
                </div>
              </div>
            )}

            {carrito.length === 0 ? (
              <div className={`text-center py-12 text-xs flex flex-col items-center justify-center ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                <ShoppingCart className={`w-10 h-10 mb-3 opacity-40 ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
                <span className="font-medium">El mostrador se encuentra vacío actualmente.</span>
                <span className="text-[11px] mt-1 opacity-75">Escanee o busque un producto para iniciar la venta.</span>
              </div>
            ) : (
              /* Altura reducida a 200px con scroll interno */
              <div className={`h-[200px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-lg [&::-webkit-scrollbar-thumb]:rounded-lg ${
                darkMode 
                  ? '[&::-webkit-scrollbar-track]:bg-zinc-950 [&::-webkit-scrollbar-thumb]:bg-zinc-800 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700' 
                  : '[&::-webkit-scrollbar-track]:bg-zinc-100 [&::-webkit-scrollbar-thumb]:bg-zinc-300 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400'
              }`}>
                <table className="w-full text-left text-xs whitespace-nowrap sm:whitespace-normal">
                  <thead className={`sticky top-0 z-10 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
                    <tr className={`border-b font-semibold uppercase text-[10px] ${darkMode ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-400'}`}>
                      <th className="pb-3 px-2">Detalle de Producto</th>
                      <th className="pb-3 px-2 text-center">Cant.</th>
                      <th className="pb-3 px-2 text-right">Unitario</th>
                      <th className="pb-3 px-2 text-right">Subtotal</th>
                      <th className="pb-3 px-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-zinc-800/40' : 'divide-zinc-100'}`}>
                    {carrito.map((item) => (
                      <tr key={item.productId} className={`transition-colors ${darkMode ? 'hover:bg-zinc-950/30' : 'hover:bg-zinc-50'}`}>
                        <td className={`py-3 px-2 font-medium ${darkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                          {item.name} <span className={`block text-[10px] font-mono mt-0.5 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{item.barcode || 'S/C'}</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => modificarCantidad(item.productId, parseInt(e.target.value) || 0)}
                            className={`w-16 text-center border rounded-xl p-1.5 font-mono text-xs focus:outline-none focus:border-emerald-500 ${
                              darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                            }`}
                          />
                        </td>
                        <td className={`py-3 px-2 text-right font-mono ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>${item.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3 px-2 text-right font-mono font-bold ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>${(item.quantity * item.unitPrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => quitarDelCarrito(item.productId)}
                            className="text-rose-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
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

          <div className={`mt-5 border-t pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <div className="w-full sm:w-auto text-left">
              <span className={`text-[11px] font-semibold uppercase tracking-wider block ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Total a Facturar:</span>
              <span className="text-2xl font-mono font-extrabold text-emerald-500">
                ${totalVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <button
              onClick={() => setMostrarModalCobro(true)}
              disabled={carrito.length === 0 || enviando}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl text-xs transition-all disabled:opacity-30 cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>{enviando ? 'Procesando...' : 'Proceder al Cobro'}</span>
            </button>
          </div>
        </div>
      </div>

     {/* SECCIÓN INFERIOR DIVIDIDA: HISTORIAL (IZQ) Y GRÁFICO POR CATEGORÍA (DER) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Mitad Izquierda: Historial de Ventas */}
        <div className={`border rounded-2xl p-5 space-y-4 shadow-xl transition-colors flex flex-col justify-between ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h2 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Historial Reciente</h2>
                  <p className={`text-[10px] ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Transacciones registradas.</p>
                </div>
              </div>
      
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar ID..."
                  value={busquedaHistorial}
                  onChange={(e) => setBusquedaHistorial(e.target.value)}
                  className={`w-full border rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-mono transition-colors ${
                    darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200 placeholder-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>
            </div>
                
            {/* Filtros rápidos compactos */}
            <div className={`border p-1 rounded-xl flex mb-3 overflow-x-auto ${
              darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}>
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'hoy', label: 'Hoy' },
                { id: 'semana', label: 'Semana' },
                { id: 'mes', label: 'Mes' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFiltroTiempo(item.id)}
                  className={`flex-1 px-2 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer text-center shrink-0 ${
                    filtroTiempo === item.id
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                      : darkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            
            {loadingHistorial ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500 mb-2" />
                <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Cargando...</p>
              </div>
            ) : historialFiltrado.length === 0 ? (
              <div className={`text-center py-12 text-xs ${darkMode ? 'text-zinc-600' : 'text-zinc-500'}`}>
                Sin registros de ventas.
              </div>
            ) : (
              <div className={`overflow-x-auto max-h-56 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-lg [&::-webkit-scrollbar-thumb]:rounded-lg ${
                darkMode 
                  ? '[&::-webkit-scrollbar-track]:bg-zinc-950 [&::-webkit-scrollbar-thumb]:bg-zinc-800 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700' 
                  : '[&::-webkit-scrollbar-track]:bg-zinc-100 [&::-webkit-scrollbar-thumb]:bg-zinc-300 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400'
              }`}>
                <table className={`w-full text-left text-xs divide-y whitespace-nowrap sm:whitespace-normal ${
                  darkMode ? 'divide-zinc-800' : 'divide-zinc-200'
                }`}>
                  <thead>
                    <tr className={`font-semibold uppercase text-[10px] ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      <th className="pb-2.5 px-2">ID</th>
                      <th className="pb-2.5 px-2">Fecha / Hora</th>
                      <th className="pb-2.5 px-2 text-right">Total</th>
                      <th className="pb-2.5 px-2 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-zinc-800/50' : 'divide-zinc-100'}`}>
                    {historialFiltrado.map((v) => (
                      <tr
                        key={v.id}
                        onClick={() => abrirDetalleVenta(v)}
                        className={`transition-colors cursor-pointer group ${
                          darkMode ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'
                        }`}
                      >
                        <td className="py-2.5 px-2 font-mono text-emerald-500 text-[11px] group-hover:underline font-semibold">
                          #{v.id}
                        </td>
                        <td className={`py-2.5 px-2 text-[11px] ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                          {new Date(v.createdAt).toLocaleString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })} hs.
                        </td>
                        <td className={`py-2.5 px-2 text-right font-mono font-bold text-xs ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                          ${v.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Botón Ver Detalle */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirDetalleVenta(v);
                              }}
                              title="Ver detalle"
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-500 hover:text-emerald-600 font-medium p-1 rounded hover:bg-emerald-500/10 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            
                           {/* Botón Imprimir Ticket Rápido */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Mapeamos los items para asegurar que el nombre y precio tengan los nombres correctos
                                const itemsNormalizados = (v.items || v.saleItems || []).map(item => ({
                                  ...item,
                                  name: item.name || item.productName || item.descripcion || 'Producto sin nombre',
                                  quantity: item.quantity || item.cantidad || 1,
                                  unitPrice: item.unitPrice || item.price || item.precioUnitario || 0
                                }));
                              
                                setVentaParaTicket({
                                  ...v,
                                  items: itemsNormalizados,
                                  total: v.total || v.montoTotal || 0
                                });
                              }}
                              title="Imprimir Ticket"
                              className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-emerald-500 font-medium p-1 rounded hover:bg-zinc-500/10 transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>


      {/* Mitad Derecha: Gráfico de Ventas por Categoría (Componente Externo) */}
      <GraficoVentasPorCategoria ventasHoy={ventasHoy} />

      </div>

      <VentaDetalleModal
        venta={ventaSeleccionada}
        loading={loadingDetalle}
        onClose={() => setVentaSeleccionada(null)}
      />

      <CobroModal
        isOpen={mostrarModalCobro}
        onClose={() => setMostrarModalCobro(false)}
        totalVenta={totalVenta}
        onConfirmarVenta={confirmarVenta}
        enviando={enviando}
      />

      {/* 🎫 MODAL DE TICKET / COMPROBANTE */}
      {ventaParaTicket && (
        <TicketModal 
          venta={ventaParaTicket} 
          onClose={() => setVentaParaTicket(null)} 
        />
      )}
    </div>
  );
}