import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useTheme } from '../components/DashboardLayout';
import { useAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { Search, UserPlus, Loader2, Shield, Mail, CheckCircle2, XCircle } from 'lucide-react';

export default function EmpleadosPage() {
  const { darkMode } = useTheme();
  const { showAlert } = useAlert();
  const { user } = useAuth();
  
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para Modal (Crear / Editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
  
  // Campos del formulario
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Empleado');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  const userRole = user?.role?.toLowerCase() || '';
  const isAdmin = userRole === 'admin';

  // Cargar empleados al montar la página
  const fetchEmpleados = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/user/employees');
      setEmpleados(response.data);
      setError(null);
    } catch (err) {
      console.error("Error al cargar empleados:", err);
      setError("No se pudieron cargar los empleados.");
      showAlert("No se pudieron cargar los empleados.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpleados();
  }, []);

  // Filtrar empleados según la barra de búsqueda local
  const filteredEmpleados = empleados.filter((emp) => {
    const term = searchTerm.toLowerCase();
    const matchesName = emp.username?.toLowerCase().includes(term);
    const matchesEmail = emp.email?.toLowerCase().includes(term);
    const matchesCompany = (emp.tenantName || emp.companyName || '').toLowerCase().includes(term);
    return matchesName || matchesEmail || matchesCompany;
  });

  // Abrir modal para Crear
  const handleOpenCreate = () => {
    setModalMode('create');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('Empleado');
    setFormError('');
    setIsModalOpen(true);
  };

  // Abrir modal para Editar
  const handleOpenEdit = (emp) => {
    setModalMode('edit');
    setCurrentEmployeeId(emp.id);
    setUsername(emp.username);
    setEmail(emp.email);
    setRole(emp.role);
    setIsActive(emp.isActive);
    setFormError('');
    setIsModalOpen(true);
  };

  // Guardar (Crear o Editar)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (modalMode === 'create') {
        await apiClient.post('/user/employees', {
          username,
          email,
          password,
          role
        });
        showAlert("¡Empleado registrado con éxito!", "success");
      } else {
        await apiClient.put(`/user/employees/${currentEmployeeId}`, {
          username,
          email,
          role,
          isActive
        });
        showAlert("¡Empleado actualizado con éxito!", "success");
      }

      setIsModalOpen(false);
      fetchEmpleados();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Ocurrió un error al guardar el empleado.";
      setFormError(errorMsg);
      showAlert(errorMsg, "error");
    }
  };

  // Cambiar estado Activo/Inactivo
  const handleToggleStatus = async (id) => {
    try {
      // Pasamos un objeto vacío {} como segundo parámetro por si Axios requiere cuerpo en PATCH
      await apiClient.patch(`/user/employees/${id}/toggle-status`, {});
      showAlert("Estado del empleado modificado con éxito.", "success");
      fetchEmpleados();
    } catch (err) {
      showAlert("Error al cambiar el estado del empleado.", "error");
    }
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-200 p-2 sm:p-6 md:p-8 flex flex-col space-y-6 ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Encabezado */}
      <div className={`w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-6 rounded-2xl border transition-colors shadow-sm ${darkMode ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-white border-slate-200'}`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {isAdmin ? 'Gestión Global de Empleados y Empresas' : 'Gestión de Empleados'}
          </h1>
          <p className={`text-xs mt-1 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
            {isAdmin 
              ? 'Vista de Administrador: Visualizando el registro total del sistema.' 
              : 'Administra los accesos y roles del personal de tu negocio.'}
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-90 text-white px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all shadow-md shadow-emerald-950/20 cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-white" />
          <span>+ Nuevo Empleado</span>
        </button>
      </div>

      {/* Barra de Filtros / Búsqueda */}
      <div className={`w-full p-4 sm:p-5 rounded-2xl border transition-colors shadow-sm ${darkMode ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200'}`}>
        <div className="relative">
          <Search className={`absolute left-3.5 top-3 h-4 w-4 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#5BA535]/50 transition-all border ${
              darkMode 
                ? 'bg-zinc-950 border-zinc-800/80 text-zinc-200 placeholder-zinc-500' 
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      {/* Error global de carga */}
      {error && (
        <div className="bg-red-950/25 border border-red-900/50 text-red-400 p-4 rounded-xl text-center text-xs font-medium">
          {error}
        </div>
      )}

      {/* Contenedor de la Tabla */}
      <div className={`w-full rounded-2xl border transition-colors shadow-sm overflow-hidden ${darkMode ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b font-semibold uppercase tracking-wider whitespace-nowrap ${
                darkMode ? 'border-zinc-800/80 bg-zinc-900/50 text-zinc-400' : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}>
                <th className="py-3.5 px-4">Nombre</th>
                <th className="py-3.5 px-4">Email</th>
                {isAdmin && <th className="py-3.5 px-4">Tenant / Empresa</th>}
                <th className="py-3.5 px-4">Rol</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs ${
              darkMode ? 'divide-zinc-800/60 text-zinc-300' : 'divide-slate-100 text-slate-700'
            }`}>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-[#5BA535]" />
                      <span className={`text-xs font-medium ${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Cargando empleados...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEmpleados.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className={`p-12 text-center text-xs ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                    No se encontraron empleados registrados.
                  </td>
                </tr>
              ) : (
                filteredEmpleados.map((emp) => (
                  <tr key={emp.id} className={`transition-colors whitespace-nowrap ${
                    darkMode ? 'hover:bg-zinc-800/30' : 'hover:bg-slate-50/80'
                  }`}>
                    <td className={`py-3.5 px-4 font-semibold ${darkMode ? 'text-zinc-200' : 'text-slate-800'}`}>
                      {emp.username}
                    </td>
                    <td className={`py-3.5 px-4 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {emp.email}
                    </td>
                    {isAdmin && (
                      <td className={`py-3.5 px-4 font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        {emp.tenantName || emp.companyName || 'N/A'}
                      </td>
                    )}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium inline-block ${
                        darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold inline-flex items-center gap-1.5 ${
                        emp.isActive 
                          ? (darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-200')
                          : (darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600 border border-red-200')
                      }`}>
                        {emp.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {emp.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center space-x-2">
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="text-white bg-[#5BA535] hover:opacity-90 font-medium text-[11px] px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleStatus(emp.id)}
                        className={`font-medium text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          darkMode 
                            ? 'text-zinc-400 hover:text-red-400 bg-zinc-800/80 hover:bg-zinc-800' 
                            : 'text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {emp.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Integrado para Crear/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl border p-6 transition-colors ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h2 className="text-base font-bold mb-4">
              {modalMode === 'create' ? 'Registrar Nuevo Empleado' : 'Editar Empleado'}
            </h2>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/25 border border-red-900/50 text-red-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1.5">Nombre de Usuario</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none transition-all ${
                    darkMode 
                      ? 'bg-zinc-950 border-zinc-800 text-white focus:ring-2 focus:ring-[#5BA535]/50' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-[#5BA535]/50'
                  }`}
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none transition-all ${
                    darkMode 
                      ? 'bg-zinc-950 border-zinc-800 text-white focus:ring-2 focus:ring-[#5BA535]/50' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-[#5BA535]/50'
                  }`}
                  placeholder="empleado@negocio.com"
                />
              </div>

              {modalMode === 'create' && (
                <div>
                  <label className="block font-semibold mb-1.5">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs outline-none transition-all ${
                      darkMode 
                        ? 'bg-zinc-950 border-zinc-800 text-white focus:ring-2 focus:ring-[#5BA535]/50' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-[#5BA535]/50'
                    }`}
                    placeholder="••••••••"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1.5">Rol</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none transition-all ${
                    darkMode 
                      ? 'bg-zinc-950 border-zinc-800 text-white focus:ring-2 focus:ring-[#5BA535]/50' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-[#5BA535]/50'
                  }`}
                  placeholder="Ej. Empleado, Cajero"
                />
              </div>

              {modalMode === 'edit' && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-[#5BA535] cursor-pointer rounded"
                  />
                  <label htmlFor="isActiveCheck" className="cursor-pointer font-semibold">
                    Usuario Activo
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-colors cursor-pointer ${
                    darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-90 shadow-md transition-all cursor-pointer"
                >
                  {modalMode === 'create' ? 'Crear Empleado' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}