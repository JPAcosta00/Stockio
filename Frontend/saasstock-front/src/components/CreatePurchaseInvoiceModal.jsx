import { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText, AlertCircle } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

export default function CreatePurchaseInvoiceModal({ isOpen, onClose, onInvoiceCreated, defaultProviderId = null }) {
  const [providers, setProviders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showAlert } = useAlert();

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

  const token = sessionStorage.getItem('token');

  // Cargar proveedores y productos al abrir el modal
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        setLoadingData(true);
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        const [provRes, prodRes] = await Promise.all([
          fetch('/api/providers', { headers }),
          fetch('/api/products', { headers }) // Asumiendo que tu endpoint de productos es /api/products
        ]);

        if (!provRes.ok || !prodRes.ok) throw new Error('Error al cargar datos para la factura');

        const provData = await provRes.json();
        const prodData = await prodRes.json();

        setProviders(provData);
        setProducts(prodData);

        // Si viene un proveedor por defecto, lo fijamos
        if (defaultProviderId) {
          setInvoiceData(prev => ({ ...prev, providerId: defaultProviderId }));
        }
      } catch (err) {
        showAlert(err.message, 'error');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isOpen, defaultProviderId]);

  // Agregar un producto a los detalles de la factura
  const handleAddDetail = () => {
    if (!currentItem.productId) {
      showAlert('Seleccioná un producto', 'error');
      return;
    }
    if (currentItem.quantity <= 0) {
      showAlert('La cantidad debe ser mayor a 0', 'error');
      return;
    }
    if (currentItem.unitPrice < 0) {
      showAlert('El precio unitario no puede ser negativo', 'error');
      return;
    }

    const selectedProduct = products.find(p => p.id === currentItem.productId);

    // Evitar duplicados en la lista (opcional, o sumar cantidades)
    const exists = invoiceData.details.find(d => d.productId === currentItem.productId);
    if (exists) {
      showAlert('Este producto ya está agregado en la factura', 'error');
      return;
    }

    const newDetail = {
      productId: currentItem.productId,
      productName: selectedProduct ? selectedProduct.name : 'Producto',
      quantity: Number(currentItem.quantity),
      unitPrice: Number(currentItem.unitPrice)
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

  // Enviar factura a la API
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
      const response = await fetch('/api/purchaseinvoices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Error al registrar la factura');
      }

      showAlert('Factura de compra registrada con éxito. Stock y cuenta corriente actualizados.', 'success');
      if (onInvoiceCreated) onInvoiceCreated();
      onClose();
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#5BA535]" />
            Registrar Factura de Compra
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadingData ? (
          <div className="py-12 text-center text-zinc-400">Cargando datos...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Cabecera: Proveedor, Nro Factura y Fecha */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Proveedor</label>
                <select 
                  disabled={Boolean(defaultProviderId)}
                  value={invoiceData.providerId}
                  onChange={(e) => setInvoiceData({...invoiceData, providerId: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:border-[#5BA535] outline-none transition-colors disabled:opacity-50"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Nro Factura</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. A-0001-00004512"
                  value={invoiceData.invoiceNumber}
                  onChange={(e) => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:border-[#5BA535] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Fecha</label>
                <input 
                  type="date" 
                  required
                  value={invoiceData.invoiceDate}
                  onChange={(e) => setInvoiceData({...invoiceData, invoiceDate: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:border-[#5BA535] outline-none transition-colors"
                />
              </div>
            </div>

            {/* Sección para agregar productos al detalle */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3 mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Agregar Ítems a la Factura</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                <div className="sm:col-span-6">
                  <label className="block text-[10px] uppercase text-zinc-500 mb-1">Producto</label>
                  <select 
                    value={currentItem.productId}
                    onChange={(e) => setCurrentItem({...currentItem, productId: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none focus:border-[#5BA535]"
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase text-zinc-500 mb-1">Cantidad</label>
                  <input 
                    type="number" 
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none focus:border-[#5BA535]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] uppercase text-zinc-500 mb-1">Precio Unit.</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={currentItem.unitPrice}
                    onChange={(e) => setCurrentItem({...currentItem, unitPrice: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none focus:border-[#5BA535]"
                  />
                </div>

                <div className="sm:col-span-1">
                  <button 
                    type="button"
                    onClick={handleAddDetail}
                    className="w-full h-[34px] bg-[#5BA535] hover:bg-[#4d8d2c] text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                    title="Agregar ítem"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla de ítems agregados */}
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-zinc-800 text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 uppercase">
                  <tr>
                    <th className="px-3.5 py-2.5">Producto</th>
                    <th className="px-3.5 py-2.5 text-center">Cant.</th>
                    <th className="px-3.5 py-2.5 text-right">Precio Unit.</th>
                    <th className="px-3.5 py-2.5 text-right">Subtotal</th>
                    <th className="px-3.5 py-2.5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                  {invoiceData.details.map((item) => (
                    <tr key={item.productId} className="hover:bg-zinc-800/30">
                      <td className="px-3.5 py-2.5 font-medium text-white">{item.productName}</td>
                      <td className="px-3.5 py-2.5 text-center">{item.quantity}</td>
                      <td className="px-3.5 py-2.5 text-right">${item.unitPrice.toLocaleString()}</td>
                      <td className="px-3.5 py-2.5 text-right font-semibold text-emerald-400">
                        ${(item.quantity * item.unitPrice).toLocaleString()}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
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
                      <td colSpan="5" className="px-4 py-6 text-center text-zinc-500">
                        No hay productos agregados en la factura todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total General */}
            <div className="flex justify-between items-center bg-zinc-950 px-4 py-3 rounded-xl border border-zinc-800">
              <span className="text-sm font-semibold text-zinc-400 uppercase">Total Factura:</span>
              <span className="text-xl font-extrabold text-emerald-400">${calculateTotal().toLocaleString()}</span>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-95 text-white text-sm font-medium shadow-md transition-all cursor-pointer disabled:opacity-50"
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