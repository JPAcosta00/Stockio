import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import RegisterForm from '../components/auth/RegisterForm';

export default function Login() {
  // Estados para Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados para Recuperación (Forgot/Reset)
  const [resetEmail, setResetEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Estados UI y Feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Control de vistas: 'login' | 'register' | 'forgot' | 'reset'
  const [view, setView] = useState('login');

  const { login } = useAuth();

  // Resetear alertas al cambiar de pantalla
  const switchView = (newView) => {
    setError('');
    setSuccessMsg('');
    setView(newView);
  };

  // 1. Submit para Iniciar Sesión
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

  // 2. Submit para Solicitar Token por Email
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/forgot-password', { email: resetEmail });
      setSuccessMsg(response.data?.message || 'Si el correo está registrado, recibirás las instrucciones.');
      // Pasamos a la vista donde ingresa el token
      setView('reset');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit para Restablecer la Contraseña con el Token
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
      // Limpiamos los campos y volvemos al login
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
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
        
        {/* Banner de Errores */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Banner de Éxito */}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg text-center">
            {successMsg}
          </div>
        )}

        {/* -------------------------------------------------------------
            VISTA 1: INICIO DE SESIÓN
           ------------------------------------------------------------- */}
        {view === 'login' && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white tracking-tight">Sistema de stock y ventas</h2>
              <p className="text-sm text-zinc-400 mt-2">Ingresá tus credenciales para acceder al sistema</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                  placeholder="nombre@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-zinc-300">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => switchView('forgot')}
                    className="text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-zinc-950 font-semibold text-sm rounded-lg py-2.5 mt-2 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-500">
                ¿No tenés una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => switchView('register')}
                  className="text-white hover:underline font-medium transition-all"
                >
                  Registrá tu negocio
                </button>
              </p>
            </div>
          </>
        )}

        {/* -------------------------------------------------------------
            VISTA 2: SOLICITAR RECUPERACIÓN (EMAIL)
           ------------------------------------------------------------- */}
        {view === 'forgot' && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">Recuperar Contraseña</h2>
              <p className="text-sm text-zinc-400 mt-2">
                Ingresá tu correo electrónico para generar el código/token de recuperación.
              </p>
            </div>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                  placeholder="nombre@empresa.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-zinc-950 font-semibold text-sm rounded-lg py-2.5 mt-2 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generando código...' : 'Solicitar Recuperación'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => switchView('login')}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          </>
        )}

        {/* -------------------------------------------------------------
            VISTA 3: INGRESAR TOKEN Y NUEVA CONTRASEÑA
           ------------------------------------------------------------- */}
        {view === 'reset' && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">Establecer Nueva Contraseña</h2>
              <p className="text-sm text-zinc-400 mt-2">
                Pegá el código/token de recuperación e ingresá tu nueva clave.
              </p>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Token / Código de Recuperación</label>
                <input
                  type="text"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                  placeholder="Pegá el token aquí"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-zinc-950 font-semibold text-sm rounded-lg py-2.5 mt-2 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Restableciendo...' : 'Guardar Nueva Contraseña'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => switchView('login')}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          </>
        )}

        {/* -------------------------------------------------------------
            VISTA 4: REGISTRO DE USUARIOS
           ------------------------------------------------------------- */}
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
  );
}