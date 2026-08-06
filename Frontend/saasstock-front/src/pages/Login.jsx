import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import RegisterForm from '../components/auth/RegisterForm';
import { 
  Mail, 
  Lock, 
  KeyRound, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Loader2,
  ArrowRight
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
      alert('¡Contraseña actualizada correctamente! Ya podés iniciar sesión.');
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
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative overflow-hidden text-zinc-100">
      
      {/* Luces de fondo ambientales */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#5BA535]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#1C562A]/25 rounded-full blur-3xl pointer-events-none" />

      {/* CONTENEDOR PRINCIPAL: Estructura de dos columnas (Izquierda: Brand, Derecha: Form) */}
      <div className={`w-full max-w-7xl mx-auto ${view === 'register' ? 'md:max-w-7xl' : 'md:max-w-5xl'} grid md:grid-cols-[1.5fr,1fr] gap-x-12 gap-y-12 transition-all duration-500 relative z-10 p-6 md:p-12`}>
        
        {/* COLUMNA IZQUIERDA: STOCKIO GRANDEMENTE ESTÁTICO */}
        <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-800 rounded-3xl group">
          <div className="relative group/logo">
            {/* Brillo ambiental sutil integrado al isotipo */}
            <div className="absolute -inset-4 rounded-full bg-[#5BA535]/25 blur-2xl opacity-100 group-hover:opacity-100 transition-opacity" />
            <img 
              src="/Stockio_logo_luminoso_blanco.png" 
              alt="Stockio - Todo tu stock, en orden" 
              className="w-auto h-[180px] md:h-[280px] object-contain drop-shadow-[0_0_25px_rgba(91,165,53,0.35)] relative z-10"
            />
          </div>
          <div className="relative z-10 flex flex-col mt-3">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none">
              Stock<span className="text-[#5BA535]">io</span>
            </h1>
            <p className="text-sm md:text-base font-medium text-zinc-400 tracking-wider uppercase mt-2">
              Todo tu stock, en orden.
            </p>
          </div>
        </div>

        {/* COLUMNA DERECHA: FORMULARIO ORIGINAL */}
        <div className={`transition-all duration-300 md:self-center bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md`}>
          
          {/* Banner de Errores */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-xl text-centerbackdrop-blur-sm animate-in fade-in">
              {error}
            </div>
          )}

          {/* Banner de Éxito */}
          {successMsg && (
            <div className="mb-5 p-3.5 bg-[#5BA535]/10 border border-[#5BA535]/30 text-[#5BA535] text-xs font-medium rounded-xl text-center backdrop-blur-sm animate-in fade-in">
              {successMsg}
            </div>
          )}

          {/* VISTA 1: INICIO DE SESIÓN */}
          {view === 'login' && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white tracking-tight">Iniciar Sesión</h1>
                <p className="text-xs text-zinc-400 mt-1">Ingresá a tu cuenta para gestionar tu inventario</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#5BA535] focus:ring-1 focus:ring-[#5BA535] transition-all placeholder:text-zinc-600"
                      placeholder="nombre@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => switchView('forgot')}
                      className="text-xs text-[#5BA535] hover:underline font-medium transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#5BA535] focus:ring-1 focus:ring-[#5BA535] transition-all placeholder:text-zinc-600"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                  />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#5BA535] hover:bg-[#1C562A] text-white font-semibold text-sm rounded-xl py-3 mt-2 shadow-lg shadow-[#5BA535]/20 hover:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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

              <div className="mt-6 text-center border-t border-zinc-800 pt-4">
                <p className="text-sm text-zinc-400">
                  ¿No tenés una cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('register')}
                    className="text-[#5BA535] hover:underline font-semibold transition-colors"
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
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#5BA535] focus:ring-1 focus:ring-[#5BA535] transition-all placeholder:text-zinc-600"
                      placeholder="nombre@empresa.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#5BA535] hover:bg-[#1C562A] text-white font-semibold text-sm rounded-xl py-3 mt-2 shadow-lg shadow-[#5BA535]/20 hover:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
                  className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
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
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                    Código de Recuperación
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#5BA535] focus:ring-1 focus:ring-[#5BA535] transition-all placeholder:text-zinc-600"
                      placeholder="Pegá el token aquí"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#5BA535] focus:ring-1 focus:ring-[#5BA535] transition-all placeholder:text-zinc-600"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#5BA535] hover:bg-[#1C562A] text-white font-semibold text-sm rounded-xl py-3 mt-2 shadow-lg shadow-[#5BA535]/20 hover:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
                  className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
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
                alert('¡Cuenta creada con éxito! Ya podés iniciar sesión.');
                switchView('login');
              }}
            />
          )}

        </div>
      </div>
    </div>
  );
}