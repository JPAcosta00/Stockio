import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Building2, 
  Mail, 
  Lock, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

export default function RegisterForm({ onSwitchToLogin, onSuccess }) {
  const { register } = useAuth();
  
  // Definimos darkMode de forma estática o segura para evitar errores fuera del dashboard
  const darkMode = false; 
  
  // Estados para datos personales 
  const [username, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  
  // Estados para contraseñas (Columna Derecha)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Feedback y carga
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Validación de formato de email
  const isValidEmail = (emailStr) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  // Validación de contraseña (mínimo 6 caracteres, letras y al menos un número)
  const isValidPassword = (pass) => {
    const passRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    return passRegex.test(pass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Campos obligatorios
    if (!username || !companyName || !email || !password || !confirmPassword) {
      setError('Por favor, completá todos los campos.');
      return;
    }

    // Validación del formato de email
    if (!isValidEmail(email)) {
      setError('Por favor, ingresá un correo electrónico válido (ej: usuario@dominio.com).');
      return;
    }

    // Validación del formato de la contraseña
    if (!isValidPassword(password)) {
      setError('La contraseña debe tener al menos 6 caracteres, incluir letras y al menos un número.');
      return;
    }

    // Coincidencia de contraseñas
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
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      
      {/* Encabezado */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Creá tu cuenta en Stockio
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Gestioná tu stock y ventas en un solo lugar
        </p>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center font-medium backdrop-blur-sm animate-in fade-in">
          {error}
        </div>
      )}

      {/* Contenedor de Formulario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* COLUMNA IZQUIERDA: Datos de la cuenta */}
        <div className="space-y-3">
          <h3 className={`text-xs font-bold uppercase tracking-wider text-[#5BA535] border-b pb-1.5 flex items-center gap-1.5 ${
            darkMode ? 'border-zinc-800/80' : 'border-slate-200'
          }`}>
            <span>1. Datos de la Cuenta</span>
          </h3>

          <div>
            <label className={`block text-[11px] font-semibold uppercase mb-1 tracking-wider ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>
              Nombre Completo
            </label>
            <div className="relative">
              <User className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`} />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setName(e.target.value)}
                className={`w-full border rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#5BA535] focus:ring-1 focus:ring-[#5BA535] transition-all ${
                  darkMode 
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
                placeholder="Lionel Messi"
              />
            </div>
          </div>

          <div>
            <label className={`block text-[11px] font-semibold uppercase mb-1 tracking-wider ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>
              Nombre de tu Empresa
            </label>
            <div className="relative">
              <Building2 className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`} />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={`w-full border rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#5BA535] focus:ring-1 focus:ring-[#5BA535] transition-all ${
                  darkMode 
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
                placeholder="Distribuidora Messi"
              />
            </div>
          </div>

          <div>
            <label className={`block text-[11px] font-semibold uppercase mb-1 tracking-wider ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full border rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#5BA535] focus:ring-1 focus:ring-[#5BA535] transition-all ${
                  darkMode 
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
                placeholder="correo@empresa.com"
              />
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Seguridad / Contraseñas */}
        <div className="space-y-3">
          <h3 className={`text-xs font-bold uppercase tracking-wider text-[#5BA535] border-b pb-1.5 flex items-center gap-1.5 ${
            darkMode ? 'border-zinc-800/80' : 'border-slate-200'
          }`}>
            <span>2. Seguridad</span>
          </h3>

          <div>
            <label className={`block text-[11px] font-semibold uppercase mb-1 tracking-wider ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>
              Contraseña
            </label>
            <div className="relative">
              <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full border rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#5BA535] focus:ring-1 focus:ring-[#5BA535] transition-all ${
                  darkMode 
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
                placeholder="••••••••"
              />
            </div>
            <p className={`text-[10px] mt-1 leading-tight ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
              Mínimo 6 caracteres, combinando letras y al menos un número.
            </p>
          </div>

          <div>
            <label className={`block text-[11px] font-semibold uppercase mb-1 tracking-wider ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>
              Confirmar Contraseña
            </label>
            <div className="relative">
              <CheckCircle2 className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`} />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full border rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#5BA535] focus:ring-1 focus:ring-[#5BA535] transition-all ${
                  darkMode 
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
                placeholder="••••••••"
              />
            </div>
            <p className={`text-[10px] mt-1 leading-tight ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
              Repetí exactamente la clave ingresada arriba.
            </p>
          </div>
        </div>

      </div>

      {/* PIE DE FORMULARIO */}
      <div className={`pt-3 border-t space-y-3 mt-2 ${darkMode ? 'border-zinc-800/80' : 'border-slate-200'}`}>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#5BA535] hover:bg-[#1C562A] text-white font-semibold text-sm rounded-xl py-2.5 shadow-lg shadow-[#5BA535]/20 hover:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creando cuenta...</span>
            </>
          ) : (
            'Confirmar Registro'
          )}
        </button>

        <p className={`text-xs text-center ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
          ¿Ya tenés cuenta?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[#5BA535] font-semibold hover:underline focus:outline-none transition-colors"
          >
            Iniciá sesión
          </button>
        </p>
      </div>

    </form>
  );
}