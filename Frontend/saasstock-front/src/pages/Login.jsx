import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import apiClient from '../api/apiClient';
import RegisterForm from '../components/auth/RegisterForm';
import bgLogin from '../assets/fondo3.png';
import { 
  Mail, 
  Lock, 
  KeyRound, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [view, setView] = useState('login');

  const { login } = useAuth();
  const { darkMode } = useTheme();

  const switchView = (newView) => {
    setError('');
    setSuccessMsg('');
    setView(newView);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data && response.data.token) {
        login(response.data.token);
        window.location.href = '/';
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Credenciales incorrectas o error en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/forgot-password', { email: resetEmail });
      setSuccessMsg(response.data?.message || 'Si el correo está registrado, recibirás las instrucciones.');
      setView('reset');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword
      });
      setSuccessMsg('¡Contraseña actualizada correctamente! Ya podés iniciar sesión.');
      setToken('');
      setNewPassword('');
      switchView('login');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'El token es inválido o ha expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col lg:flex-row items-center justify-between bg-cover bg-center bg-no-repeat p-4 md:p-8 lg:p-12 relative overflow-y-auto text-zinc-900 dark:text-zinc-100 selection:bg-[#5BA535] selection:text-white transition-colors duration-300"
      style={{ backgroundImage: `url(${bgLogin})` }}
    >    
      {/* ESPACIO PARA PC: SECCIÓN IZQUIERDA AMPLIADA PARA EMPUJAR MÁS EL MODAL A LA DERECHA */}
      <div className="w-full lg:w-[50%] hidden lg:block" aria-hidden="true" />

      {/* SECCIÓN DERECHA: MODALES CON COLOR BASE #09090B Y MÁS SEPARACIÓN */}
      <div className="w-full lg:w-[50%] flex items-center justify-center lg:justify-end relative z-10 lg:pr-12 my-auto">
        <div className={`w-full ${view === 'register' ? 'max-w-xl' : 'max-w-md'} bg-gradient-to-b from-[#09090B] via-[#09090B]/95 to-black/90 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 md:p-10 shadow-2xl transition-all duration-300 text-zinc-100 relative`}>
          
          {/* Pequeños puntos luminosos decorativos de estilo tecnológico */}
          <div className="absolute top-4 right-6 w-1.5 h-1.5 rounded-full bg-emerald-500/40 shadow-[0_0_8px_rgba(91,165,53,0.6)] pointer-events-none" />
          <div className="absolute top-8 right-10 w-1 h-1 rounded-full bg-blue-500/30 shadow-[0_0_6px_rgba(59,130,246,0.5)] pointer-events-none" />

          {/* Banner de Errores con Botón de Cierre */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/60 text-red-400 text-xs font-medium rounded-xl flex items-start gap-2.5 backdrop-blur-md animate-in fade-in shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
              <button 
                onClick={() => setError('')} 
                className="text-red-400 hover:text-red-200 transition-colors p-0.5 cursor-pointer"
                title="Cerrar alerta"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Banner de Éxito con Botón de Cierre */}
          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-medium rounded-xl flex items-start gap-2.5 backdrop-blur-md animate-in fade-in shadow-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMsg}</div>
              <button 
                onClick={() => setSuccessMsg('')} 
                className="text-emerald-400 hover:text-emerald-200 transition-colors p-0.5 cursor-pointer"
                title="Cerrar alerta"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* VISTA 1: INICIO DE SESIÓN */}
          {view === 'login' && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Iniciar Sesión</h1>
                <p className="text-xs text-zinc-400 mt-1">Ingresá a tu cuenta para gestionar tu inventario</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      className="w-full bg-[#09090B] border border-zinc-800 text-zinc-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#5BA535] transition-all placeholder:text-zinc-600"
                      placeholder="nombre@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => switchView('forgot')}
                      className="text-xs text-[#5BA535] hover:underline font-medium transition-colors cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full bg-[#09090B] border border-zinc-800 text-zinc-100 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#5BA535] transition-all placeholder:text-zinc-600"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-95 text-white font-medium text-sm rounded-xl py-2.5 mt-2 shadow-lg shadow-[#5BA535]/15 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Iniciando sesión...</span>
                    </>
                  ) : (
                    <>
                      <span>Iniciar Sesión</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center border-t border-zinc-800/80 pt-4">
                <p className="text-sm text-zinc-400">
                  ¿No tenés una cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('register')}
                    className="text-[#5BA535] hover:underline font-semibold transition-colors cursor-pointer"
                  >
                    Registrá tu negocio
                  </button>
                </p>
              </div>
            </>
          )}

          {/* VISTA 2: RECUPERACIÓN */}
          {view === 'forgot' && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white tracking-tight">Recuperar Contraseña</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Ingresá tu correo para enviarte el código de recuperación.
                </p>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      className="w-full bg-[#09090B] border border-zinc-800 text-zinc-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#5BA535] transition-all placeholder:text-zinc-600"
                      placeholder="nombre@empresa.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-95 text-white font-medium text-sm rounded-xl py-2.5 mt-2 shadow-lg shadow-[#5BA535]/15 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando código...</span>
                    </>
                  ) : (
                    'Solicitar Recuperación'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al inicio de sesión</span>
                </button>
              </div>
            </>
          )}

          {/* VISTA 3: NUEVA CONTRASEÑA */}
          {view === 'reset' && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white tracking-tight">Nueva Contraseña</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Ingresá el token recibido y definí tu nueva clave.
                </p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Código de Recuperación
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      className="w-full bg-[#09090B] border border-zinc-800 text-zinc-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#5BA535] transition-all placeholder:text-zinc-600"
                      placeholder="Pegá el token aquí"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="w-full bg-[#09090B] border border-zinc-800 text-zinc-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#5BA535] transition-all placeholder:text-zinc-600"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#5BA535] to-[#1C562A] hover:opacity-95 text-white font-medium text-sm rounded-xl py-2.5 mt-2 shadow-lg shadow-[#5BA535]/15 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    'Guardar Nueva Contraseña'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al inicio de sesión</span>
                </button>
              </div>
            </>
          )}

          {/* VISTA 4: REGISTRO DE USUARIOS */}
          {view === 'register' && (
            <RegisterForm
              onSwitchToLogin={() => switchView('login')}
              onSuccess={() => {
                setSuccessMsg('¡Cuenta creada con éxito! Ya podés iniciar sesión.');
                switchView('login');
              }}
            />
          )}

        </div>
      </div>
    </div>
  );
}