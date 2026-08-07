import React, { useState, useEffect, useRef } from "react";
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { User, Shield, LogOut, Upload, Building, Loader2 } from "lucide-react";

export default function Perfil() {
  // Uso el logout de authcontext
  const { user, logout } = useAuth(); 
  
  // Pestaña activa
  const [activeTab, setActiveTab] = useState('profile');

  // Estados del Perfil
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Estados de Seguridad
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Mensajes de feedback
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Manejador local de la imagen
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Crea una URL temporal del archivo subido en el cliente
      const localUrl = URL.createObjectURL(file);
      setLogoPreview(localUrl);
    }
  };

  // Cargar datos iniciales del usuario
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const showFeedback = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  // Guardar cambios del Perfil (manda al backend)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.put('/user/update-profile', { 
        username : name, 
        email : email
       });
      showFeedback('Perfil actualizado correctamente.', 'success');
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Error al actualizar el perfil.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cambiar Contraseña
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showFeedback('Las contraseñas nuevas no coinciden.', 'error');
      return;
    }

    setLoading(true);
    try {
      await apiClient.put('/user/change-password', { currentPassword, newPassword });
      showFeedback('Contraseña modificada con éxito.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Error al cambiar la contraseña.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-zinc-100">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* CABECERA */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-sm">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Mi Perfil</h1>
          <p className="text-xs text-zinc-400 mt-1">Administrá la información de tu cuenta, preferencias de seguridad y sesión.</p>
        </div>

        {/* Notificaciones flotantes/superiores */}
        {message.text && (
          <div className={`p-4 rounded-xl border text-sm text-center transition-all ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Menú de pestañas lateral */}
          <div className="w-full md:w-64 flex flex-col justify-between bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm h-fit">
            <div className="flex flex-row md:flex-col gap-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 md:flex-none flex items-center gap-2.5 text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
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
                className={`flex-1 md:flex-none flex items-center gap-2.5 text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'security' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Seguridad</span>
              </button>
            </div>

            {/* Botón de Cerrar Sesión en el menú lateral */}
            <div className="pt-4 mt-4 border-t border-zinc-800 hidden md:block">
              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent hover:border-rose-500/20 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>

          {/* Área del Formulario */}
          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-sm">
            
            {/* Pestaña: PERFIL */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white tracking-tight border-b border-zinc-800 pb-4">Información Personal</h3>
                
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2 tracking-wider">Nombre Completo</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl p-3.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2 tracking-wider">Correo Electrónico</label>
                      <input
                        type="email"
                        required
                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl p-3.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/35 text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Pestaña: SEGURIDAD */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white tracking-tight border-b border-zinc-800 pb-4">Actualizar Contraseña</h3>

                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2 tracking-wider">Contraseña Actual</label>
                      <input
                        type="password"
                        required
                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl p-3.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2 tracking-wider">Nueva Contraseña</label>
                      <input
                        type="password"
                        required
                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl p-3.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2 tracking-wider">Confirmar Nueva Contraseña</label>
                      <input
                        type="password"
                        required
                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl p-3.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/35 text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
    </div>
  );
}