import React, { useState, useEffect, useRef } from "react";
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext'; // Importado
import apiClient from '../api/apiClient';
import { User, Shield, LogOut, Loader2 } from "lucide-react";

export default function Perfil() {
  const { user, logout } = useAuth();
  const { showAlert } = useAlert(); // Hook para alertas
  
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.put('/user/update-profile', { 
        username : name, 
        email : email
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 text-zinc-100">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* CABECERA */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-sm">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Mi Perfil</h1>
          <p className="text-xs text-zinc-400 mt-1">Administrá la información de tu cuenta y preferencias de seguridad.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* MENÚ LATERAL RESPONSIVO */}
          <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-sm flex flex-row lg:flex-col gap-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 lg:flex-none flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'profile' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Perfil</span>
              </button>
              
              <button
                onClick={() => setActiveTab('security')}
                className={`flex-1 lg:flex-none flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'security' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Seguridad</span>
              </button>
            </div>

            {/* BOTÓN CERRAR SESIÓN */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center lg:justify-start gap-2.5 px-4 py-3 text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors border border-zinc-800 bg-zinc-900"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>

          {/* ÁREA DEL FORMULARIO */}
          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm">
            
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white tracking-tight border-b border-zinc-800 pb-4">Información Personal</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Nombre Completo</label>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl p-3.5 text-sm focus:border-emerald-500 outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Correo Electrónico</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl p-3.5 text-sm focus:border-emerald-500 outline-none transition-colors" />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={loading} className="bg-[#5BA535] hover:bg-[#4a8a2b] text-white font-bold px-6 py-3 rounded-xl transition-all text-sm flex items-center gap-2">
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white tracking-tight border-b border-zinc-800 pb-4">Actualizar Contraseña</h3>
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Contraseña Actual</label>
                    <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl p-3.5 text-sm focus:border-emerald-500 outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Nueva Contraseña</label>
                    <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl p-3.5 text-sm focus:border-emerald-500 outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Confirmar Nueva Contraseña</label>
                    <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl p-3.5 text-sm focus:border-emerald-500 outline-none transition-colors" />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={loading} className="bg-[#5BA535] hover:bg-[#4a8a2b] text-white font-bold px-6 py-3 rounded-xl transition-all text-sm flex items-center gap-2">
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
    </div>
  );
}