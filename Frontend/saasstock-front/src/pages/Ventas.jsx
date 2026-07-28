import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/apiClient';

export default function Ventas() {
  // Estados de datos 
  const [carrito, setCarrito] = useState(() => {
    const carritoGuardado = localStorage.getItem('carrito_mostrador');
    return carritoGuardado ? JSON.parse(carritoGuardado) : [];
  });
  const [historialVentas, setHistorialVentas] = useState([]);
  
  // Estado para la venta seleccionada en la modal (null = modal cerrada)
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  // Estados de UI
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [buscandoProducto, setBuscandoProducto] = useState(false);

  // Estado del campo de texto manual
  const [barcodeInput, setBarcodeInput] = useState('');
  
  // Referencia para el input
  const barcodeRef = useRef(null);

  useEffect(() => {
    obtenerHistorialVentas();
    localStorage.setItem('carrito_mostrador', JSON.stringify(carrito));
    if (barcodeRef.current) barcodeRef.current.focus();
  }, [carrito]);

  // 1. Cargar el historial de ventas anteriores
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

  const limpiarMostrador = () => {
    const confirmar = window.confirm("¿Estás seguro de que querés vaciar todo el mostrador actual?");
    if (confirmar) {
      setCarrito([]);
    }
  };

  // 2. Procesar el código en el backend
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    const codigoLimpio = barcodeInput.trim();
    if (!codigoLimpio) return;

    try {
      setBuscandoProducto(true);

      const response = await apiClient.get(`/products/barcode/${codigoLimpio}`);
      const prod = response.data;

      if (!prod) {
        alert(`El código "${codigoLimpio}" no coincide con ningún producto registrado.`);
        return;
      }

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
    } catch (error) {
      console.error("Error al buscar producto por código de barras:", error);
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

  // 3. Confirmar y guardar la venta en la base de datos
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

  return (
    <div className="p-6 bg-zinc-950 text-zinc-100 min-h-screen space-y-6">
      {/* CABECERA */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Terminal de Ventas</h1>
        <p className="text-xs text-zinc-400">Ingresá los códigos de barra bajo demanda. El catálogo no se precarga.</p>
      </div>

      {/* BLOQUE SUPERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* INGRESO MANUAL / ESCANER DE CÓDIGO */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl h-fit space-y-3">
          <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Ingreso de Artículo</h2>
          
          <form onSubmit={handleBarcodeSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-400 font-medium mb-1">
                Código de Barras:
              </label>
              <div className="flex gap-2">
                <input
                  ref={barcodeRef}
                  type="text"
                  placeholder="Escribí o escaneá el código..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
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
            </div>
            <p className="text-[10px] text-zinc-500 italic">
              💡 Presioná <kbd className="bg-zinc-950 px-1 rounded border border-zinc-800">Enter</kbd> para buscar directo en el servidor.
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
                Mostrador vacío. Ingresá un código a la izquierda.
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
              {enviando ? '⏳ Guardando Venta...' : '⚡ Confirmar Registro (Enter)'}
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: HISTORIAL DE VENTAS */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider mb-4">📋 Registro Histórico de Ventas</h2>
        
        {loadingHistorial ? (
          <p className="text-center py-6 text-zinc-500 text-xs">Cargando historial...</p>
        ) : historialVentas.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-xs">
            No se registran transacciones previas.
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
                {historialVentas.map((v) => (
                  <tr 
                    key={v.id} 
                    onClick={() => setVentaSeleccionada(v)}
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

      {/* MODAL DE DETALLE DE VENTA */}
      {ventaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  Detalle de Venta <span className="font-mono text-emerald-400">#{ventaSeleccionada.id}</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  {new Date(ventaSeleccionada.createdAt).toLocaleString('es-AR', { 
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })} hs.
                </p>
              </div>
              <button
                onClick={() => setVentaSeleccionada(null)}
                className="text-zinc-400 hover:text-zinc-100 text-lg px-2 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Listado de items de la venta */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Productos Vendidos</span>
              
              {/* Adapta 'items' o 'saleDetails' según cómo lo devuelva tu backend */}
              {(ventaSeleccionada.items || ventaSeleccionada.saleDetails || []).length === 0 ? (
                <p className="text-xs text-zinc-500 italic text-center py-4">No se incluyeron detalles de items en la respuesta del backend.</p>
              ) : (
                <div className="divide-y divide-zinc-800/60 border-t border-b border-zinc-800/60">
                  {(ventaSeleccionada.items || ventaSeleccionada.saleDetails || []).map((item, index) => (
                    <div key={item.id || index} className="py-2.5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-medium text-zinc-200">{item.product?.name || item.name || `Producto #${item.productId}`}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {item.quantity} un. x ${item.unitPrice?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <p className="font-mono font-semibold text-zinc-300">
                        ${((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer con el total */}
            <div className="pt-3 border-t border-zinc-800 flex justify-between items-baseline">
              <span className="text-xs font-semibold text-zinc-400">TOTAL:</span>
              <span className="text-lg font-mono font-bold text-emerald-400">
                ${ventaSeleccionada.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={() => setVentaSeleccionada(null)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-2 rounded-lg text-xs transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}