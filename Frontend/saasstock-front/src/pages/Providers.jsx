import { useState, useEffect } from 'react';
import { Truck, Plus, Search, Edit2, Trash2, X, AlertCircle, FileText, Eye, CheckCircle2 } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import CreatePurchaseInvoiceModal from "../components/CreatePurchaseInvoiceModal";

export default function Providers() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showAlert } = useAlert();

  // Estados para el modal (Crear/Editar Proveedor)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProvider, setCurrentProvider] = useState({
    id: null,
    name: '',
    contactName: '',
    phone: '',
    cuit: '',
    accountBalance: 0
  });

  // Estados para el modal de Cuenta Corriente / Facturas
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providerInvoices, setProviderInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Estados para el modal de Carga de Factura de Compra
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedProviderForInvoice, setSelectedProviderForInvoice] = useState(null);

  const token = sessionStorage.getItem('token');

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/providers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar los proveedores');
      
      const data = await response.json();
      setProviders(data);
    } catch (err) {
      setError(err.message);
      showAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentProvider({ name: '', contactName: '', phone: '', cuit: '', accountBalance: 0 });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (provider) => {
    setIsEditing(true);
    setCurrentProvider(provider);
    setIsModalOpen(true);
  };

  // Abrir modal de Cuenta Corriente y buscar sus facturas
  const handleOpenDetailModal = async (provider) => {
    setSelectedProvider(provider);
    setIsDetailModalOpen(true);
    setLoadingInvoices(true);

    try {
      const response = await fetch('/api/purchaseinvoices', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar las facturas del proveedor');

      const allInvoices = await response.json();
      // Filtramos las facturas que corresponden a este proveedor
      const filtered = allInvoices.filter(inv => inv.providerId === provider.id);
      setProviderInvoices(filtered);
    } catch (err) {
      showAlert(err.message, 'error');
      setProviderInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = isEditing ? `/api/providers/${currentProvider.id}` : '/api/providers';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentProvider)
      });

      if (!response.ok) throw new Error('No se pudo guardar el proveedor');

      setIsModalOpen(false);
      showAlert(isEditing ? 'Proveedor actualizado con éxito' : 'Proveedor creado con éxito', 'success');
      fetchProviders();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Evita que se abra el modal al hacer click en eliminar
    if (!window.confirm('¿Estás seguro de eliminar este proveedor?')) return;

    try {
      const response = await fetch(`/api/providers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('No se pudo eliminar el proveedor');

      showAlert('Proveedor eliminado correctamente', 'success');
      fetchProviders();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  // Marcar factura como pagada
  const handleMarkAsPaid = async (invoiceId) => {
    try {
      const response = await fetch(`/api/purchaseinvoices/${invoiceId}/pay`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('No se pudo actualizar el estado de la factura');

      showAlert('Factura marcada como pagada con éxito', 'success');
      
      // Actualizamos las facturas localmente dentro del modal y recargamos los proveedores para ver el saldo actualizado
      if (selectedProvider) {
        handleOpenDetailModal(selectedProvider);
      }
      fetchProviders();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  const filteredProviders = providers.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.cuit && p.cuit.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-[#5BA535]" />
            Proveedores
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Gestioná la libreta de proveedores, contactos y saldos de cuentas corrientes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setSelectedProviderForInvoice(null);
              setIsInvoiceModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-4 py-2.5 rounded-xl border border-zinc-700 transition-all cursor-pointer"
          >
            <FileText className="w-4.5 h-4.5 text-[#5BA535]" />
            Nueva Factura
          </button>
          <button 
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-95 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-[#5BA535]/15 transition-all cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            Nuevo Proveedor
          </button>
        </div>
      </div>

      <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 max-w-md focus-within:border-[#5BA535] transition-colors">
        <Search className="w-4.5 h-4.5 text-zinc-500 mr-2.5" />
        <input 
          type="text"
          placeholder="Buscar por nombre o CUIT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none text-sm text-zinc-100 placeholder-zinc-500 w-full"
        />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400">Cargando proveedores...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-400 flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800 text-left">
              <thead className="bg-zinc-900/50 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Teléfono</th>
                  <th className="px-6 py-4">CUIT</th>
                  <th className="px-6 py-4">Cuenta Corriente</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-sm text-zinc-300">
                {filteredProviders.map((provider) => (
                  <tr 
                    key={provider.id} 
                    onClick={() => handleOpenDetailModal(provider)}
                    className="hover:bg-zinc-800/40 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-white">{provider.name}</td>
                    <td className="px-6 py-4 text-zinc-400">{provider.contactName || '—'}</td>
                    <td className="px-6 py-4 text-zinc-400">{provider.phone || '—'}</td>
                    <td className="px-6 py-4 text-zinc-400">{provider.cuit || '—'}</td>
                    <td className="px-6 py-4 font-semibold text-emerald-400">
                      ${provider.accountBalance?.toLocaleString() ?? '0.00'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => {
                          setSelectedProviderForInvoice(provider.id);
                          setIsInvoiceModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[#5BA535] hover:text-[#4d8d2c] transition-colors cursor-pointer"
                        title="Registrar Factura de Compra"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenDetailModal(provider)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                        title="Ver Cuenta Corriente y Facturas"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenEditModal(provider)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(provider.id, e)}
                        className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredProviders.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-zinc-500">
                      No se encontraron proveedores registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Proveedor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-bold text-white">
                {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Nombre de la Empresa / Proveedor</label>
                <input 
                  type="text" 
                  required
                  value={currentProvider.name} 
                  onChange={(e) => setCurrentProvider({...currentProvider, name: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:border-[#5BA535] outline-none transition-colors"
                  placeholder="Ej. Distribuidora Mayorista"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Nombre de Contacto</label>
                <input 
                  type="text" 
                  value={currentProvider.contactName || ''} 
                  onChange={(e) => setCurrentProvider({...currentProvider, contactName: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:border-[#5BA535] outline-none transition-colors"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Teléfono</label>
                  <input 
                    type="text" 
                    value={currentProvider.phone || ''} 
                    onChange={(e) => setCurrentProvider({...currentProvider, phone: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:border-[#5BA535] outline-none transition-colors"
                    placeholder="11 2345 6789"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">CUIT</label>
                  <input 
                    type="text" 
                    value={currentProvider.cuit || ''} 
                    onChange={(e) => setCurrentProvider({...currentProvider, cuit: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:border-[#5BA535] outline-none transition-colors"
                    placeholder="20-12345678-9"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-95 text-white text-sm font-medium shadow-md transition-all cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cuenta Corriente y Facturas del Proveedor */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#5BA535]" />
                  Cuenta Corriente — {selectedProvider?.name}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">CUIT: {selectedProvider?.cuit || 'Sin CUIT'} | Tel: {selectedProvider?.phone || 'Sin teléfono'}</p>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingInvoices ? (
              <div className="py-12 text-center text-zinc-400">Cargando facturas de compra...</div>
            ) : (
              <div className="space-y-4">
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-zinc-400 block uppercase font-semibold">Saldo Actual en Cuenta</span>
                    <span className="text-xl font-bold text-emerald-400">${selectedProvider?.accountBalance?.toLocaleString() ?? '0.00'}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProviderForInvoice(selectedProvider.id);
                      setIsInvoiceModalOpen(true);
                    }}
                    className="px-3 py-2 bg-[#5BA535] hover:bg-[#4d8d2c] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Nueva Factura
                  </button>
                </div>

                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider pt-2">Historial de Facturas de Compra</h3>

                {providerInvoices.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 bg-zinc-950/50 rounded-xl border border-zinc-800/60">
                    Este proveedor no registra facturas de compra cargadas en el sistema.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-zinc-800 rounded-xl">
                    <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
                      <thead className="bg-zinc-950 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Nro Factura</th>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3">Total</th>
                          <th className="px-4 py-3">Pagado</th>
                          <th className="px-4 py-3 text-center">Estado</th>
                          <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800 text-zinc-300">
                        {providerInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-zinc-800/30">
                            <td className="px-4 py-3 font-medium text-white">{inv.invoiceNumber}</td>
                            <td className="px-4 py-3 text-zinc-400">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3">${inv.totalAmount?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-emerald-400">${inv.paidAmount?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-center">
                              {inv.isPaid ? (
                                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                                  Pagada
                                </span>
                              ) : (
                                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/50">
                                  Pendiente
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {!inv.isPaid && (
                                <button
                                  onClick={() => handleMarkAsPaid(inv.id)}
                                  className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                                  title="Marcar como Pagada"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Pagar
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-zinc-800">
              <button 
                type="button" 
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Reutilizable de Carga de Factura de Compra */}
      <CreatePurchaseInvoiceModal 
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        defaultProviderId={selectedProviderForInvoice}
        onInvoiceCreated={() => {
          fetchProviders();
          if (selectedProvider && isDetailModalOpen) {
            handleOpenDetailModal(selectedProvider);
          }
        }}
      />

    </div>
  );
}