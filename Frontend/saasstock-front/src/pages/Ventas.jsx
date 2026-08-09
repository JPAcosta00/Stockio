import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/apiClient';
import VentaDetalleModal from '../components/VentaDetalleModal';
import CobroModal from '../components/CobroModal';
import { useTheme } from '../components/DashboardLayout'; // ⚡ Misma importación que Perfil
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
  const { darkMode } = useTheme(); // ⚡ Mismo hook que Perfil

  const [carrito, setCarrito] = useState(() => {
    const carritoGuardado = localStorage.getItem(cartKey);
    return carritoGuardado ? JSON.parse(carritoGuardado) : [];
  });

  const [historialVentas, setHistorialVentas] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [mostrarModalCobro, setMostrarModalCobro] = useState(false);

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
      
      {alerta && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs shadow-sm transition-all animate-fade-in ${
          alerta.type === 'success' 
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900' 
            : alerta.type === 'warning'
            ? 'bg-amber-50/90 border-amber-200 text-amber-900'
            : 'bg-red-50/90 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {alerta.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span className="font-medium">{alerta.message}</span>
          </div>
          <button 
            onClick={() => setAlerta(null)}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header General */}
      <div className={`border p-5 sm:p-6 rounded-2xl shadow-xl transition-colors ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Terminal de Ventas</h1>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Punto de venta y registro de operaciones en tiempo real.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ingreso de Artículo */}
        <div className={`border p-4 sm:p-5 rounded-2xl h-fit space-y-4 relative shadow-xl transition-colors ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`} ref={dropdownRef}>
          <h2 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Ingreso de Artículo</h2>

          <form onSubmit={handleBarcodeSubmit} className="space-y-3">
            <div className="relative">
              <label className={`block text-[11px] uppercase tracking-wider mb-1.5 font-semibold ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Código de Barras o Nombre:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={barcodeRef}
                    type="text"
                    placeholder="Escaneá o buscá..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onFocus={() => sugerencias.length > 0 && setMostrarDropdown(true)}
                    disabled={enviando || buscandoProducto}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 font-mono tracking-wider transition-colors ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!barcodeInput.trim() || buscandoProducto || enviando}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-30 cursor-pointer shadow-lg shadow-emerald-600/15 shrink-0"
                >
                  {buscandoProducto ? '...' : 'Añadir'}
                </button>
              </div>

              {/* Dropdown de Sugerencias */}
              {mostrarDropdown && (
                <div className={`absolute left-0 right-0 top-full mt-1.5 border rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y transition-colors ${
                  darkMode ? 'bg-zinc-900 border-zinc-800 divide-zinc-800' : 'bg-white border-zinc-200 divide-zinc-100'
                }`}>
                  {buscandoSugerencias ? (
                    <div className={`p-3 text-xs text-center flex items-center justify-center gap-2 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                      <span>Buscando productos...</span>
                    </div>
                  ) : sugerencias.length === 0 ? (
                    <div className={`p-3 text-xs text-center ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Sin coincidencias.</div>
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
                          <p className={`text-xs font-medium group-hover:text-emerald-500 ${darkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{prod.name}</p>
                          <p className={`text-[10px] font-mono ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{prod.barcode || 'Sin código'}</p>
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
            <p className={`text-[11px] italic ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              💡 Podés escanear con la lectora o escribir para buscar por nombre.
            </p>
          </form>
        </div>

        {/* Mostrador Actual */}
        <div className={`lg:col-span-2 border p-4 sm:p-5 rounded-2xl flex flex-col justify-between shadow-xl min-h-[280px] transition-colors ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Mostrador Actual</h2>
              {carrito.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMostrarConfirmarVaciar(true)}
                  className={`text-xs border font-medium py-1 px-3 rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    darkMode 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                      : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vaciar</span>
                </button>
              )}
            </div>

            {/* Prompt Confirmar Vaciar */}
            {mostrarConfirmarVaciar && (
              <div className={`mb-4 p-3 border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                darkMode ? 'bg-rose-950/30 border-rose-900/50 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <span className="font-medium">¿Estás seguro de vaciar todo el mostrador actual?</span>
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
                <ShoppingCart className={`w-8 h-8 mb-2 ${darkMode ? 'text-zinc-700' : 'text-zinc-300'}`} />
                <span>Mostrador vacío.</span>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs whitespace-nowrap sm:whitespace-normal">
                  <thead>
                    <tr className={`border-b font-semibold uppercase text-[10px] ${darkMode ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-400'}`}>
                      <th className="pb-2.5">Detalle</th>
                      <th className="pb-2.5 text-center">Cant.</th>
                      <th className="pb-2.5 text-right">Unitario</th>
                      <th className="pb-2.5 text-right">Subtotal</th>
                      <th className="pb-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-zinc-800/40' : 'divide-zinc-100'}`}>
                    {carrito.map((item) => (
                      <tr key={item.productId} className={`transition-colors ${darkMode ? 'hover:bg-zinc-950/30' : 'hover:bg-zinc-50'}`}>
                        <td className={`py-2.5 font-medium ${darkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>
                          {item.name} <span className={`block text-[10px] font-mono ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{item.barcode}</span>
                        </td>
                        <td className="py-2.5 text-center">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => modificarCantidad(item.productId, parseInt(e.target.value) || 0)}
                            className={`w-14 text-center border rounded-lg p-1.5 font-mono text-xs focus:outline-none focus:border-emerald-500 ${
                              darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                            }`}
                          />
                        </td>
                        <td className={`py-2.5 text-right font-mono ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>${item.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-2.5 text-right font-mono font-semibold ${darkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>${(item.quantity * item.unitPrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => quitarDelCarrito(item.productId)}
                            className="text-rose-500 hover:text-rose-600 p-1.5 transition-colors cursor-pointer"
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

          <div className={`mt-4 border-t pt-4 space-y-3 ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <div className="flex justify-between items-baseline">
              <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Total Facturado:</span>
              <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ${totalVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <button
              onClick={() => setMostrarModalCobro(true)}
              disabled={carrito.length === 0 || enviando}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-all disabled:opacity-30 cursor-pointer shadow-lg shadow-emerald-600/15 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>{enviando ? 'Guardando Venta...' : 'Confirmar Registro'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Historial de Ventas */}
      <div className={`border rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl transition-colors ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            <h2 className={`text-xs font-bold uppercase tracking-tight ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Registro Histórico de Ventas</h2>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            <div className={`border p-1 rounded-xl overflow-x-auto flex ${
              darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}>
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
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                      : darkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por ID o Código..."
                value={busquedaHistorial}
                onChange={(e) => setBusquedaHistorial(e.target.value)}
                className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-mono transition-colors ${
                  darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200 placeholder-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                }`}
              />
            </div>
          </div>
        </div>

        {loadingHistorial ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
            <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Cargando historial...</p>
          </div>
        ) : historialFiltrado.length === 0 ? (
          <div className={`text-center py-12 text-xs ${darkMode ? 'text-zinc-600' : 'text-zinc-500'}`}>
            {busquedaHistorial || filtroTiempo !== 'todos'
              ? 'No se encontraron ventas para los filtros seleccionados.'
              : 'No se registran transacciones previas.'}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className={`w-full text-left text-xs divide-y whitespace-nowrap sm:whitespace-normal ${
              darkMode ? 'divide-zinc-800' : 'divide-zinc-200'
            }`}>
              <thead>
                <tr className={`font-semibold uppercase text-[10px] ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  <th className="pb-3">ID de venta</th>
                  <th className="pb-3">Fecha y Hora</th>
                  <th className="pb-3 text-right">Monto Total</th>
                  <th className="pb-3 text-center">Acción</th>
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
                    <td className="py-3 font-mono text-emerald-600 dark:text-emerald-400 text-[11px] group-hover:underline font-semibold">
                      #{v.id}
                    </td>
                    <td className={`py-3 ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {new Date(v.createdAt).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      hs.
                    </td>
                    <td className={`py-3 text-right font-mono font-bold text-xs ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      ${v.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-3 text-center text-xs flex items-center justify-center gap-1.5 ${
                      darkMode ? 'text-zinc-400 group-hover:text-white' : 'text-zinc-500 group-hover:text-zinc-900'
                    }`}>
                      <Eye className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Ver Detalle</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
    </div>
  );
}