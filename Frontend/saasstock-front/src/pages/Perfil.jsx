import React, { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../components/DashboardLayout'; 
import apiClient from '../api/apiClient';
import { User, Shield, LogOut, Loader2, BadgeCheck } from "lucide-react";

export default function Perfil() {
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const { darkMode } = useTheme(); 
  
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      // Extraemos el rol del token/usuario (adaptado según cómo lo guardes: role, rol, etc.)
      const userRole = user.role || user.rol || '';
      setRole(userRole);
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.put('/user/update-profile', { 
        username: name, 
        email: email
      });
      showAlert('Perfil actualizado correctamente.', 'success');
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error al actualizar el perfil.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showAlert('Las contraseñas nuevas no coinciden.', 'error');
      return;
    }

    setLoading(true);
    try {
      await apiClient.put('/user/change-password', { currentPassword, newPassword });
      showAlert('Contraseña modificada con éxito.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error al cambiar la contraseña.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight flex items-center gap-2.5 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
            <User className="w-7 h-7 text-[#5BA535]" />
            Mi Perfil
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Administrá la información de tu cuenta y preferencias de seguridad.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* MENÚ LATERAL RESPONSIVO */}
        <div className="w-full lg:w-64 flex flex-col gap-3 shrink-0">
          
          {/* Tarjeta de información rápida del usuario (Email y Rol) */}
          <div className={`border rounded-2xl p-4 shadow-xl space-y-2 transition-colors ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'
          }`}>
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#5BA535]/20 flex items-center justify-center text-[#5BA535] font-bold shrink-0">
                {name ? name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{name || 'Usuario'}</p>
                <p className="text-[11px] truncate opacity-70">{email || 'Sin correo'}</p>
              </div>
            </div>
            {role && (
              <div className="pt-2 border-t border-zinc-500/10 flex items-center justify-between text-xs">
                <span className="opacity-60 flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-[#5BA535]" /> Rol:
                </span>
                <span className="font-semibold uppercase px-2 py-0.5 rounded-md bg-[#5BA535]/10 text-[#5BA535] border border-[#5BA535]/20 text-[10px]">
                  {role}
                </span>
              </div>
            )}
          </div>

          <div className={`border rounded-2xl p-2 shadow-xl flex flex-row lg:flex-col gap-1 transition-colors ${
            darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 lg:flex-none flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'profile' 
                  ? 'bg-[#5BA535]/15 text-[#5BA535] border border-[#5BA535]/30' 
                  : darkMode 
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/50' 
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Perfil</span>
            </button>
            
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 lg:flex-none flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'security' 
                  ? 'bg-[#5BA535]/15 text-[#5BA535] border border-[#5BA535]/30' 
                  : darkMode 
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/50' 
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Seguridad</span>
            </button>
          </div>

          {/* BOTÓN CERRAR SESIÓN */}
          <button
            onClick={logout}
            className={`w-full flex items-center justify-center lg:justify-start gap-2.5 px-4 py-3 text-sm font-semibold rounded-xl transition-colors border cursor-pointer shadow-xl ${
              darkMode 
                ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-zinc-800 bg-zinc-900' 
                : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-zinc-200 bg-white'
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* ÁREA DEL FORMULARIO */}
        <div className={`flex-1 border rounded-2xl p-6 sm:p-8 shadow-xl transition-colors ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className={`text-lg font-bold tracking-tight border-b pb-4 ${
                darkMode ? 'text-white border-zinc-800' : 'text-zinc-900 border-zinc-200'
              }`}>Información Personal</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Nombre Completo</label>
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:border-[#5BA535] outline-none transition-colors ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`} 
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Correo Electrónico</label>
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:border-[#5BA535] outline-none transition-colors ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`} 
                  />
                </div>
                <div className={`flex justify-end pt-4 border-t ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-95 text-white font-medium px-5 py-2.5 rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-[#5BA535]/15 cursor-pointer disabled:opacity-50"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className={`text-lg font-bold tracking-tight border-b pb-4 ${
                darkMode ? 'text-white border-zinc-800' : 'text-zinc-900 border-zinc-200'
              }`}>Actualizar Contraseña</h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Contraseña Actual</label>
                  <input 
                    type="password" 
                    required 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:border-[#5BA535] outline-none transition-colors ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`} 
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Nueva Contraseña</label>
                  <input 
                    type="password" 
                    required 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:border-[#5BA535] outline-none transition-colors ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`} 
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Confirmar Nueva Contraseña</label>
                  <input 
                    type="password" 
                    required 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:border-[#5BA535] outline-none transition-colors ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`} 
                  />
                </div>
                <div className={`flex justify-end pt-4 border-t ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-95 text-white font-medium px-5 py-2.5 rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-[#5BA535]/15 cursor-pointer disabled:opacity-50"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}