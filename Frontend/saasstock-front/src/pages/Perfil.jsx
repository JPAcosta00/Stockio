import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { User, Shield, LogOut } from 'lucide-react'; 

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
    <div className="settings-container min-h-screen p-6 md:p-10 text-white">
      <div className="max-w-4xl mx-auto">
        
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-sm text-zinc-400 mt-1">Administrá la información de tu cuenta, preferencias de seguridad y sesión.</p>
        </div>

        {/* Notificaciones flotantes/superiores */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border text-sm text-center transition-all ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Menú de pestañas lateral */}
          <div className="w-full md:w-64 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-800 pb-4 md:pb-0 md:pr-4">
            <div className="flex flex-row md:flex-col gap-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 md:flex-none flex items-center gap-2.5 text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'profile' 
                    ? 'bg-zinc-800 text-white shadow' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Perfil</span>
              </button>
              
              <button
                onClick={() => setActiveTab('security')}
                className={`flex-1 md:flex-none flex items-center gap-2.5 text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'security' 
                    ? 'bg-zinc-800 text-white shadow' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Seguridad</span>
              </button>
            </div>

            {/* Botón de Cerrar Sesión en el menú lateral */}
            <div className="pt-4 mt-4 border-t border-zinc-800/80 hidden md:block">
              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>

          {/* Área del Formulario */}
          <div className="flex-1 settings-card bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6 backdrop-blur-md">
            
            {/* Pestaña: PERFIL */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <h3 className="text-lg font-medium border-b border-zinc-800 pb-2">Información Personal</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nombre Completo</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-zinc-950/60 border border-zinc-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1.5">Correo Electrónico</label>
                      <input
                        type="email"
                        required
                        className="w-full bg-zinc-950/60 border border-zinc-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-white text-zinc-950 font-semibold text-sm rounded-lg px-5 py-2 hover:bg-zinc-200 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Pestaña: SEGURIDAD */}
            {activeTab === 'security' && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <h3 className="text-lg font-medium border-b border-zinc-800 pb-2">Actualizar Contraseña</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Contraseña Actual</label>
                    <input
                      type="password"
                      required
                      className="w-full bg-zinc-950/60 border border-zinc-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nueva Contraseña</label>
                    <input
                      type="password"
                      required
                      className="w-full bg-zinc-950/60 border border-zinc-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Confirmar Nueva Contraseña</label>
                    <input
                      type="password"
                      required
                      className="w-full bg-zinc-950/60 border border-zinc-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <h3 className="text-lg font-medium border-b border-zinc-800 pb-2">Logo del tenant?</h3>
                
                <div className="space-y-4">aca </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-white text-zinc-950 font-semibold text-sm rounded-lg px-5 py-2 hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}