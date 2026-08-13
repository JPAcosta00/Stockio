import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useTheme } from '../components/DashboardLayout';
import { useAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { Search, UserPlus, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function EmpleadosPage() {
  const { darkMode } = useTheme();
  const { showAlert } = useAlert();
  const { user } = useAuth();
  
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Empleado'); // Valor por defecto
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  const userRole = user?.role?.toLowerCase() || '';
  const isAdmin = userRole === 'admin';

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

  const filteredEmpleados = empleados.filter((emp) => {
    const term = searchTerm.toLowerCase();
    const roleMatch = (emp.role || '').toLowerCase().includes(term);
    return emp.username?.toLowerCase().includes(term) || emp.email?.toLowerCase().includes(term) || roleMatch;
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('Empleado');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setModalMode('edit');
    setCurrentEmployeeId(emp.id);
    setUsername(emp.username);
    setEmail(emp.email);
    setRole(emp.role || 'Empleado');
    setIsActive(emp.isActive);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (modalMode === 'create') {
        await apiClient.post('/user/employees', { username, email, password, role });
        showAlert("¡Empleado registrado con éxito!", "success");
      } else {
        await apiClient.put(`/user/employees/${currentEmployeeId}`, { username, email, role, isActive });
        showAlert("¡Empleado actualizado con éxito!", "success");
      }
      setIsModalOpen(false);
      fetchEmpleados();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error al guardar.";
      setFormError(errorMsg);
      showAlert(errorMsg, "error");
    }
  };

  return (
    <div className={`min-h-screen w-full p-2 sm:p-6 md:p-8 ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Encabezado */}
      <div className={`w-full flex justify-between items-center p-6 rounded-2xl border ${darkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-slate-200'}`}>
        <h1 className="text-2xl font-extrabold">Gestión de Personal</h1>
        <button onClick={handleOpenCreate} className="bg-[#5BA535] text-white px-4 py-2 rounded-xl font-semibold text-xs">
          + Nuevo Empleado
        </button>
      </div>

      {/* Tabla */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase">
            <tr>
              <th className="py-3 px-4">Nombre</th>
              <th className="py-3 px-4">Rol</th>
              <th className="py-3 px-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmpleados.map((emp) => (
              <tr key={emp.id} className="border-b border-slate-50">
                <td className="py-3 px-4 text-sm">{emp.username}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-slate-100 rounded-full text-[10px] uppercase font-bold">{emp.role}</span>
                </td>
                <td className="py-3 px-4">
                  <button onClick={() => handleOpenEdit(emp)} className="text-[#5BA535] font-semibold text-xs">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Corregido */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="font-bold mb-4">{modalMode === 'create' ? 'Nuevo' : 'Editar'} Empleado</h2>
            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Otros campos... */}
              
              <div>
                <label className="block font-semibold mb-1">Rol</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300"
                >
                  <option value="Empleado">Empleado</option>
                  <option value="Empresa">Empresa</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#5BA535] text-white rounded-xl">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}