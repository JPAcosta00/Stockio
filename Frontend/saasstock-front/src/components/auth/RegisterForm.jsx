import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterForm({ onSwitchToLogin, onSuccess }) {
  const { register } = useAuth();
  
  // Estados para datos personales / empresa (Columna Izquierda)
  const [username, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  
  // Estados para contraseñas (Columna Derecha)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Feedback y carga
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Función de validación de contraseña
  const isValidPassword = (pass) => {
    // Al menos 6 caracteres, al menos una letra (a-z) y al menos un número (0-9)
    const regex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    return regex.test(pass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Validación de campos requeridos
    if (!username || !companyName || !email || !password || !confirmPassword) {
      setError('Por favor, completá todos los campos.');
      return;
    }

    // 2. Validación de formato de contraseña (6+ caracteres, letras y números)
    if (!isValidPassword(password)) {
      setError('La contraseña debe tener al menos 6 caracteres, incluir letras y al menos un número.');
      return;
    }

    // 3. Validación de coincidencia de contraseñas
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    const result = await register(username, email, password, companyName);
    
    if (result.success) {
      onSuccess(); // Aviso de que se registró con éxito
    } else {
      setError(result.error || 'Ocurrió un error al registrar la cuenta.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-6">
      
      {/* Encabezado */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-white">Creá tu cuenta en el sistema de stock y ventas</h2>
        <p className="text-sm text-zinc-400">Comenzá a gestionar tu negocio de forma inteligente</p>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="p-3 text-sm bg-red-950/50 border border-red-500/50 text-red-200 rounded-lg text-center font-medium">
          {error}
        </div>
      )}

      {/* Contenedor principal de 2 columnas (Izquierda / Derecha) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        
        {/* COLUMNA IZQUIERDA: Datos Personales y Empresa */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-zinc-800 pb-2">
            Información de la Cuenta
          </h3>

          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
              placeholder="Lionel Messi"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
              Nombre de tu Empresa
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
              placeholder="Distribuidora Messi"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
              placeholder="correo@empresa.com"
            />
          </div>
        </div>

        {/* COLUMNA DERECHA: Seguridad / Contraseñas */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-zinc-800 pb-2">
            Seguridad
          </h3>

          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
              placeholder="••••••••"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Mínimo 6 caracteres, incluyendo letras y al menos un número.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
              placeholder="••••••••"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Repetí la contraseña ingresada arriba.
            </p>
          </div>
        </div>

      </div>

      {/* PIE DE FORMULARIO: Botón de acción e inicio de sesión */}
      <div className="pt-4 border-t border-zinc-800/80 space-y-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-emerald-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Registrando...' : 'Confirmar Registro'}
        </button>

        <p className="text-sm text-center text-zinc-400">
          ¿Ya tenés cuenta?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-emerald-400 font-medium hover:underline focus:outline-none"
          >
            Iniciá sesión
          </button>
        </p>
      </div>

    </form>
  );
}