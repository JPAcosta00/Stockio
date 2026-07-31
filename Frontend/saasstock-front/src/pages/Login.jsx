import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import RegisterForm from '../components/auth/RegisterForm';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  //  Estado para alternar entre Login y Registro
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.error(email, password);
    try {
      // endpoint del Backend
      const response = await apiClient.post('/auth/login', { email, password });
      // Si el backend no devuelve el token
      if (response.data && response.data.token) {
        login(response.data.token);
        // Redireccionar al inicio
        window.location.href = '/';
      }
    } catch (err) {
      console.error(err);
      // Captura el mensaje de error que devuelve el backend
      setError(err.response?.data?.message || 'Credenciales incorrectas o error en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
        {isLogin ? (
          // -------------------------------------------------------------
          // VISTA DE INICIO DE SESIÓN
          // -------------------------------------------------------------
          <>
            {/* Encabezado */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white tracking-tight">Sistema de stock y ventas</h2>
              <p className="text-sm text-zinc-400 mt-2">Ingresá tus credenciales para acceder al sistema</p>
            </div>
            {/* Mensaje de Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                {error}
              </div>
            )}
            {/* Formulario de Login */}
            <form onSubmit={handleSubmit} className="space-y-5">
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
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Contraseña</label>
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

            {/* Enlace para ir al Registro */}
            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-500">
                ¿No tenés una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-white hover:underline font-medium transition-all"
                >
                  Registrá tu negocio
                </button>
              </p>
            </div>
          </>
        ) : (

          // -------------------------------------------------------------
          // VISTA DE REGISTRO DE NUEVOS USUARIOS (MODULAR)
          // -------------------------------------------------------------
          <RegisterForm
            onSwitchToLogin={() => setIsLogin(true)}
            onSuccess={() => {
              alert('¡Cuenta creada con éxito! Ya podés iniciar sesión.');
              setIsLogin(true); // Redirige al login
            }}
          />
        )}
      </div>
    </div>
  );
} 

