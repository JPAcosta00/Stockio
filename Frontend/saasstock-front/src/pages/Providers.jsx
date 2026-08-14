import { useState, useEffect } from 'react';
import { Truck, Plus, Search, Edit2, Trash2, X, AlertCircle, FileText, Eye, CheckCircle2 } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../components/DashboardLayout'; 
import CreatePurchaseInvoiceModal from "../components/CreatePurchaseInvoiceModal";
import apiClient from '../api/apiClient';

export default function Providers() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { showAlert } = useAlert();
  const { darkMode } = useTheme(); 

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

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/providers');
      setProviders(response.data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al cargar los proveedores';
      showAlert(errorMsg, 'error');
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

  const handleOpenDetailModal = async (provider) => {
    setSelectedProvider(provider);
    setIsDetailModalOpen(true);
    setLoadingInvoices(true);

    try {
      const response = await apiClient.get('/purchaseinvoices');
      const filtered = response.data.filter(inv => inv.providerId === provider.id);
      setProviderInvoices(filtered);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al cargar las facturas del proveedor';
      showAlert(errorMsg, 'error');
      setProviderInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await apiClient.put(`/providers/${currentProvider.id}`, currentProvider);
      } else {
        await apiClient.post('/providers', currentProvider);
      }

      setIsModalOpen(false);
      showAlert(isEditing ? 'Proveedor actualizado con éxito' : 'Proveedor creado con éxito', 'success');
      fetchProviders();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'No se pudo guardar el proveedor';
      showAlert(errorMsg, 'error');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de eliminar este proveedor?')) return;

    try {
      await apiClient.delete(`/providers/${id}`);
      showAlert('Proveedor eliminado correctamente', 'success');
      fetchProviders();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'No se pudo eliminar el proveedor';
      showAlert(errorMsg, 'error');
    }
  };

  const handleMarkAsPaid = async (invoiceId) => {
    try {
      await apiClient.patch(`/purchaseinvoices/${invoiceId}/pay`);
      showAlert('Factura marcada como pagada con éxito', 'success');
      
      if (selectedProvider) {
        handleOpenDetailModal(selectedProvider);
      }
      fetchProviders();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'No se pudo actualizar el estado de la factura';
      showAlert(errorMsg, 'error');
    }
  };

  const filteredProviders = providers.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.cuit && p.cuit.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      
      {/* Header Principal (Solo título y descripción) */}
      <div className={`border p-5 sm:p-6 rounded-2xl shadow-xl transition-colors ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#1C562A]/15 border border-[#5BA535]/30 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6 text-[#5BA535]" />
          </div>
          <div>
            <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
              Proveedores
            </h1>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Gestioná la libreta de proveedores, contactos y saldos de cuentas corrientes.
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Botones de Acción Alineados */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Barra de Búsqueda */}
        <div className={`flex items-center border rounded-xl px-3.5 py-2.5 w-full sm:max-w-md transition-colors shadow-sm ${
          darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}>
          <Search className={`w-4.5 h-4.5 mr-2.5 shrink-0 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
          <input 
            type="text"
            placeholder="Buscar por nombre o CUIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`bg-transparent border-none outline-none text-sm w-full ${
              darkMode ? 'text-zinc-100 placeholder-zinc-500' : 'text-zinc-900 placeholder-zinc-400'
            }`}
          />
        </div>

        {/* Botones */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setSelectedProviderForInvoice(null);
              setIsInvoiceModalOpen(true);
            }}
            className={`inline-flex items-center justify-center gap-2 text-xs font-medium px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer shadow-sm ${
              darkMode 
                ? 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-800' 
                : 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-200'
            }`}
          >
            <FileText className="w-4 h-4 text-[#5BA535]" />
            Nueva Factura
          </button>
          <button 
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 text-xs bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-95 text-white font-medium px-3.5 py-2.5 rounded-xl shadow-lg shadow-[#5BA535]/15 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Contenedor de Proveedores (Tabla en Desktop, Tarjetas Individuales en Celular) */}
      <div>
        {loading ? (
          <div className={`border rounded-xl p-12 text-center text-sm shadow-xl transition-colors ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-slate-200 text-zinc-500'
          }`}>
            Cargando proveedores...
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className={`border rounded-xl p-8 text-center text-sm shadow-xl transition-colors ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-slate-200 text-slate-400'
          }`}>
            No se encontraron proveedores registrados.
          </div>
        ) : (
          <>
            {/* VISTA DESKTOP (Tabla clásica) */}
            <div className={`hidden md:block border rounded-xl overflow-hidden shadow-xl transition-colors ${
              darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`border-b font-semibold uppercase tracking-wider whitespace-nowrap ${
                      darkMode ? 'border-zinc-800 bg-zinc-900/50 text-zinc-400' : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}>
                      <th className="py-3 px-3.5">Nombre</th>
                      <th className="py-3 px-3.5">Contacto</th>
                      <th className="py-3 px-3.5">Teléfono</th>
                      <th className="py-3 px-3.5">CUIT</th>
                      <th className="py-3 px-3.5">Cuenta Corriente</th>
                      <th className="py-3 px-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-xs ${
                    darkMode ? 'divide-zinc-800 text-zinc-300' : 'divide-slate-200 text-slate-700'
                  }`}>
                    {filteredProviders.map((provider) => (
                      <tr 
                        key={provider.id} 
                        onClick={() => handleOpenDetailModal(provider)}
                        className={`transition-colors whitespace-nowrap cursor-pointer ${
                          darkMode ? 'hover:bg-zinc-800/20' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className={`py-3 px-3.5 font-medium max-w-[180px] truncate whitespace-normal ${darkMode ? 'text-white' : 'text-slate-900'}`}>{provider.name}</td>
                        <td className={`py-3 px-3.5 truncate max-w-[120px] ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>{provider.contactName || '—'}</td>
                        <td className={`py-3 px-3.5 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>{provider.phone || '—'}</td>
                        <td className={`py-3 px-3.5 font-mono text-[11px] ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>{provider.cuit || '—'}</td>
                        <td className={`py-3 px-3.5 font-semibold font-mono ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          ${provider.accountBalance?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? '0.00'}
                        </td>
                        <td className="py-3 px-3.5 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => {
                              setSelectedProviderForInvoice(provider.id);
                              setIsInvoiceModalOpen(true);
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer text-[#5BA535] ${
                              darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-slate-100 hover:bg-slate-200'
                            }`}
                            title="Registrar Factura de Compra"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenDetailModal(provider)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer text-emerald-600 dark:text-emerald-400 ${
                              darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-slate-100 hover:bg-slate-200'
                            }`}
                            title="Ver Cuenta Corriente y Facturas"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenEditModal(provider)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(provider.id, e)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              darkMode ? 'bg-red-950/40 hover:bg-red-900/60 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'
                            }`}
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* VISTA MÓVIL (Tarjetas individuales) */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredProviders.map((provider) => (
                <div 
                  key={provider.id} 
                  onClick={() => handleOpenDetailModal(provider)}
                  className={`border rounded-xl p-4 shadow-md transition-colors cursor-pointer space-y-3 ${
                    darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                        {provider.name}
                      </h3>
                      <p className={`text-xs mt-0.5 font-mono ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        CUIT: {provider.cuit || '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] block uppercase tracking-wider font-semibold ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Cuenta Corriente</span>
                      <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        ${provider.accountBalance?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? '0.00'}
                      </span>
                    </div>
                  </div>

                  <div className={`grid grid-cols-2 gap-2 text-xs pt-2 border-t ${darkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                    <div>
                      <span className={`text-[10px] block uppercase ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Contacto</span>
                      <span className={darkMode ? 'text-zinc-300' : 'text-zinc-700'}>{provider.contactName || '—'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] block uppercase ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Teléfono</span>
                      <span className={darkMode ? 'text-zinc-300' : 'text-zinc-700'}>{provider.phone || '—'}</span>
                    </div>
                  </div>

                  <div className={`flex items-center justify-end gap-1.5 pt-2 border-t ${darkMode ? 'border-zinc-800' : 'border-zinc-100'}`} onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => {
                        setSelectedProviderForInvoice(provider.id);
                        setIsInvoiceModalOpen(true);
                      }}
                      className={`p-2 rounded-lg transition-colors cursor-pointer text-[#5BA535] ${
                        darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                      title="Registrar Factura de Compra"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleOpenDetailModal(provider)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer text-emerald-600 dark:text-emerald-400 ${
                        darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                      title="Ver Cuenta Corriente y Facturas"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleOpenEditModal(provider)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(provider.id, e)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        darkMode ? 'bg-red-950/40 hover:bg-red-900/60 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'
                      }`}
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Crear / Editar Proveedor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className={`border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 transition-colors ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <h2 className="text-base font-bold">
                {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  darkMode ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Nombre de la Empresa / Proveedor</label>
                <input 
                  type="text" 
                  required
                  value={currentProvider.name} 
                  onChange={(e) => setCurrentProvider({...currentProvider, name: e.target.value})}
                  className={`w-full border rounded-xl px-3.5 py-2.5 outline-none transition-colors ${
                    darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-[#5BA535]' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-[#5BA535]'
                  }`}
                  placeholder="Ej. Distribuidora Mayorista"
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Nombre de Contacto</label>
                <input 
                  type="text" 
                  value={currentProvider.contactName || ''} 
                  onChange={(e) => setCurrentProvider({...currentProvider, contactName: e.target.value})}
                  className={`w-full border rounded-xl px-3.5 py-2.5 outline-none transition-colors ${
                    darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-[#5BA535]' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-[#5BA535]'
                  }`}
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Teléfono</label>
                  <input 
                    type="text" 
                    value={currentProvider.phone || ''} 
                    onChange={(e) => setCurrentProvider({...currentProvider, phone: e.target.value})}
                    className={`w-full border rounded-xl px-3.5 py-2.5 outline-none transition-colors ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-[#5BA535]' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-[#5BA535]'
                    }`}
                    placeholder="11 2345 6789"
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>CUIT</label>
                  <input 
                    type="text" 
                    value={currentProvider.cuit || ''} 
                    onChange={(e) => setCurrentProvider({...currentProvider, cuit: e.target.value})}
                    className={`w-full border rounded-xl px-3.5 py-2.5 outline-none transition-colors ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-[#5BA535]' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-[#5BA535]'
                    }`}
                    placeholder="20-12345678-9"
                  />
                </div>
              </div>

              <div className={`flex justify-end gap-3 pt-4 border-t ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                    darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-95 text-white font-medium shadow-md transition-all cursor-pointer"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className={`border rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto transition-colors ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            
            <div className={`flex items-center justify-between border-b pb-4 ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#5BA535]" />
                  Cuenta Corriente — {selectedProvider?.name}
                </h2>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>CUIT: {selectedProvider?.cuit || 'Sin CUIT'} | Tel: {selectedProvider?.phone || 'Sin teléfono'}</p>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  darkMode ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingInvoices ? (
              <div className={`py-12 text-center text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Cargando facturas de compra...</div>
            ) : (
              <div className="space-y-4 text-sm">
                <div className={`border rounded-xl p-4 flex justify-between items-center transition-colors ${
                  darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <div>
                    <span className={`text-xs block uppercase font-semibold ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Saldo Actual en Cuenta</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      ${selectedProvider?.accountBalance?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) ?? '0.00'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProviderForInvoice(selectedProvider.id);
                      setIsInvoiceModalOpen(true);
                    }}
                    className="px-3 py-2 bg-[#5BA535] hover:bg-[#4d8d2c] text-white rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm text-sm"
                  >
                    <Plus className="w-4 h-4" /> Nueva Factura
                  </button>
                </div>

                <h3 className={`font-semibold uppercase tracking-wider pt-2 text-xs ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Historial de Facturas de Compra</h3>

                {providerInvoices.length === 0 ? (
                  <div className={`p-8 text-center rounded-xl border text-sm ${
                    darkMode ? 'bg-zinc-950/50 border-zinc-800/60 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400'
                  }`}>
                    Este proveedor no registra facturas de compra cargadas en el sistema.
                  </div>
                ) : (
                  <div className={`overflow-x-auto border rounded-xl ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-left">
                      <thead className={`text-xs font-semibold uppercase tracking-wider ${
                        darkMode ? 'bg-zinc-950 text-zinc-400' : 'bg-zinc-100 text-zinc-500'
                      }`}>
                        <tr>
                          <th className="px-4 py-3">Nro Factura</th>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3">Total</th>
                          <th className="px-4 py-3">Pagado</th>
                          <th className="px-4 py-3 text-center">Estado</th>
                          <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y text-sm ${darkMode ? 'divide-zinc-800 text-zinc-300' : 'divide-zinc-200 text-zinc-700'}`}>
                        {providerInvoices.map((inv) => (
                          <tr key={inv.id} className={`transition-colors ${darkMode ? 'hover:bg-zinc-800/30' : 'hover:bg-zinc-50'}`}>
                            <td className={`px-4 py-3 font-medium ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{inv.invoiceNumber}</td>
                            <td className={darkMode ? 'px-4 py-3 text-zinc-400' : 'px-4 py-3 text-zinc-500'}>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 font-mono">${inv.totalAmount?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-mono">${inv.paidAmount?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3 text-center">
                              {inv.isPaid ? (
                                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/50">
                                  Pagada
                                </span>
                              ) : (
                                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/50">
                                  Pendiente
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {!inv.isPaid && (
                                <button
                                  onClick={() => handleMarkAsPaid(inv.id)}
                                  className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer text-xs"
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

            <div className={`flex justify-end pt-4 border-t ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <button 
                type="button" 
                onClick={() => setIsDetailModalOpen(false)}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                }`}
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