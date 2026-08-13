import { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../components/DashboardLayout';
import apiClient from '../api/apiClient';

export default function CreatePurchaseInvoiceModal({ isOpen, onClose, onInvoiceCreated, defaultProviderId = null }) {
  const [providers, setProviders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showAlert } = useAlert();
  const { darkMode } = useTheme();

  // Bloquear scroll de la pantalla de atrás cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Estado del formulario de la factura
  const [invoiceData, setInvoiceData] = useState({
    providerId: defaultProviderId || '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    details: []
  });

  // Estado temporal para el ítem que se está agregando a la tabla
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    quantity: 1,
    unitPrice: 0
  });

  // Cargar proveedores y productos al abrir el modal usando apiClient
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        setLoadingData(true);

        const [provRes, prodRes] = await Promise.all([
          apiClient.get('/providers'),
          apiClient.get('/products')
        ]);

        setProviders(provRes.data);
        setProducts(prodRes.data);

        // Si viene un proveedor por defecto, lo fijamos
        if (defaultProviderId) {
          setInvoiceData(prev => ({ ...prev, providerId: defaultProviderId }));
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Error al cargar datos para la factura';
        showAlert(errorMsg, 'error');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isOpen, defaultProviderId, showAlert]);

  // Agregar un producto a los detalles de la factura
  const handleAddDetail = () => {
    if (!currentItem.productId) {
      showAlert('Seleccioná un producto', 'error');
      return;
    }
    const qty = Number(currentItem.quantity);
    if (qty <= 0 || isNaN(qty)) {
      showAlert('La cantidad debe ser mayor a 0', 'error');
      return;
    }
    const price = Number(currentItem.unitPrice);
    if (price < 0 || isNaN(price)) {
      showAlert('El precio unitario no puede ser negativo', 'error');
      return;
    }

    const selectedProduct = products.find(p => p.id === currentItem.productId);

    // Evitar duplicados en la lista
    const exists = invoiceData.details.find(d => d.productId === currentItem.productId);
    if (exists) {
      showAlert('Este producto ya está agregado en la factura', 'error');
      return;
    }

    const newDetail = {
      productId: currentItem.productId,
      productName: selectedProduct ? selectedProduct.name : 'Producto',
      quantity: qty,
      unitPrice: price
    };

    setInvoiceData(prev => ({
      ...prev,
      details: [...prev.details, newDetail]
    }));

    // Resetear item actual
    setCurrentItem({ productId: '', quantity: 1, unitPrice: 0 });
  };

  // Remover ítem de la lista
  const handleRemoveDetail = (productId) => {
    setInvoiceData(prev => ({
      ...prev,
      details: prev.details.filter(d => d.productId !== productId)
    }));
  };

  // Calcular el total general
  const calculateTotal = () => {
    return invoiceData.details.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  };

  // Enviar factura a la API usando apiClient
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceData.providerId) {
      showAlert('Seleccioná un proveedor', 'error');
      return;
    }
    if (!invoiceData.invoiceNumber.trim()) {
      showAlert('Ingresá el número de factura', 'error');
      return;
    }
    if (invoiceData.details.length === 0) {
      showAlert('Agregá al menos un producto a la factura', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post('/purchaseinvoices', invoiceData);

      showAlert('Factura de compra registrada con éxito. Stock y cuenta corriente actualizados.', 'success');
      if (onInvoiceCreated) onInvoiceCreated();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al registrar la factura';
      showAlert(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className={`border rounded-2xl max-w-xl w-full p-4 shadow-2xl space-y-4 max-h-[85vh] flex flex-col transition-colors ${
        darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-3 ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
          <h2 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <FileText className="w-4 h-4 text-[#5BA535]" />
            Registrar Factura de Compra
          </h2>
          <button 
            onClick={onClose} 
            className={`p-1 rounded-lg cursor-pointer transition-colors ${
              darkMode ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loadingData ? (
          <div className={`py-8 text-center text-xs ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Cargando datos...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 flex-1 flex flex-col overflow-hidden">
            
            {/* Cabecera: Proveedor, Nro Factura y Fecha */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Proveedor</label>
                <select 
                  disabled={Boolean(defaultProviderId)}
                  value={invoiceData.providerId}
                  onChange={(e) => setInvoiceData({...invoiceData, providerId: e.target.value})}
                  className={`w-full border rounded-xl px-3 py-1.5 text-xs outline-none transition-colors disabled:opacity-50 ${
                    darkMode 
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-[#5BA535]' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#5BA535]'
                  }`}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Nro Factura</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. A-0001-00004512"
                  value={invoiceData.invoiceNumber}
                  onChange={(e) => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})}
                  className={`w-full border rounded-xl px-3 py-1.5 text-xs outline-none transition-colors ${
                    darkMode 
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-[#5BA535]' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#5BA535]'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Fecha</label>
                <input 
                  type="date" 
                  required
                  value={invoiceData.invoiceDate}
                  onChange={(e) => setInvoiceData({...invoiceData, invoiceDate: e.target.value})}
                  className={`w-full border rounded-xl px-3 py-1.5 text-xs outline-none transition-colors ${
                    darkMode 
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-[#5BA535]' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#5BA535]'
                  }`}
                />
              </div>
            </div>

            {/* Sección para agregar productos al detalle */}
            <div className={`border rounded-xl p-3 space-y-2 transition-colors ${
              darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <h3 className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-zinc-300' : 'text-slate-700'}`}>Agregar Ítems a la Factura</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                <div className="sm:col-span-6">
                  <label className={`block text-[9px] uppercase mb-1 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Producto</label>
                  <select 
                    value={currentItem.productId}
                    onChange={(e) => setCurrentItem({...currentItem, productId: e.target.value})}
                    className={`w-full border rounded-xl px-2.5 py-1.5 text-xs outline-none transition-colors ${
                      darkMode 
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-[#5BA535]' 
                        : 'bg-white border-slate-200 text-slate-900 focus:border-[#5BA535]'
                    }`}
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={`block text-[9px] uppercase mb-1 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Cantidad</label>
                  <input 
                    type="number" 
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})}
                    className={`w-full border rounded-xl px-2.5 py-1.5 text-xs outline-none transition-colors ${
                      darkMode 
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-[#5BA535]' 
                        : 'bg-white border-slate-200 text-slate-900 focus:border-[#5BA535]'
                    }`}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className={`block text-[9px] uppercase mb-1 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Precio Unit.</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={currentItem.unitPrice}
                    onChange={(e) => setCurrentItem({...currentItem, unitPrice: e.target.value})}
                    className={`w-full border rounded-xl px-2.5 py-1.5 text-xs outline-none transition-colors ${
                      darkMode 
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-[#5BA535]' 
                        : 'bg-white border-slate-200 text-slate-900 focus:border-[#5BA535]'
                    }`}
                  />
                </div>

                <div className="sm:col-span-1">
                  <button 
                    type="button"
                    onClick={handleAddDetail}
                    className="w-full h-[30px] bg-[#5BA535] hover:bg-[#4d8d2c] text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                    title="Agregar ítem"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla de ítems agregados (con scroll interno propio si crece) */}
            <div className={`border rounded-xl overflow-hidden max-h-40 overflow-y-auto transition-colors ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
              <table className="min-w-full divide-y text-left text-xs">
                <thead className={`uppercase sticky top-0 ${darkMode ? 'bg-zinc-950 divide-zinc-800 text-zinc-400' : 'bg-slate-100 divide-slate-200 text-slate-500'}`}>
                  <tr>
                    <th className="px-3 py-2">Producto</th>
                    <th className="px-3 py-2 text-center">Cant.</th>
                    <th className="px-3 py-2 text-right">Precio Unit.</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                    <th className="px-3 py-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-zinc-800 text-zinc-300' : 'divide-slate-200 text-slate-700'}`}>
                  {invoiceData.details.map((item) => (
                    <tr key={item.productId} className={`transition-colors ${darkMode ? 'hover:bg-zinc-800/30' : 'hover:bg-slate-50'}`}>
                      <td className={`px-3 py-2 font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.productName}</td>
                      <td className="px-3 py-2 text-center">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">${item.unitPrice.toLocaleString()}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        ${(item.quantity * item.unitPrice).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button 
                          type="button"
                          onClick={() => handleRemoveDetail(item.productId)}
                          className="text-red-400 hover:text-red-300 cursor-pointer p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {invoiceData.details.length === 0 && (
                    <tr>
                      <td colSpan="5" className={`px-4 py-4 text-center text-xs ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                        No hay productos agregados en la factura todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total General */}
            <div className={`flex justify-between items-center px-3 py-2.5 rounded-xl border transition-colors ${
              darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`text-xs font-semibold uppercase ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Total Factura:</span>
              <span className={`text-base font-extrabold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>${calculateTotal().toLocaleString()}</span>
            </div>

            {/* Botones de acción */}
            <div className={`flex justify-end gap-2 pt-2 border-t ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
              <button 
                type="button" 
                onClick={onClose}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-95 text-white text-xs font-medium shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : 'Registrar Factura'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}