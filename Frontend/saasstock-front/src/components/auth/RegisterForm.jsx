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
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-white tracking-tight">
          Creá tu cuenta en Stockio
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
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
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#5BA535] border-b border-zinc-800/80 pb-1.5 flex items-center gap-1.5">
            <span>1. Datos de la Cuenta</span>
          </h3>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-zinc-300 mb-1 tracking-wider">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 text-white rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#5BA535] focus:ring-1 focus:ring-[#5BA535] transition-all placeholder:text-zinc-600"
                placeholder="Lionel Messi"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-zinc-300 mb-1 tracking-wider">
              Nombre de tu Empresa
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 text-white rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#5BA535] focus:ring-1 focus:ring-[#5BA535] transition-all placeholder:text-zinc-600"
                placeholder="Distribuidora Messi"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-zinc-300 mb-1 tracking-wider">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 text-white rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#5BA535] focus:ring-1 focus:ring-[#5BA535] transition-all placeholder:text-zinc-600"
                placeholder="correo@empresa.com"
              />
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Seguridad / Contraseñas */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#5BA535] border-b border-zinc-800/80 pb-1.5 flex items-center gap-1.5">
            <span>2. Seguridad</span>
          </h3>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-zinc-300 mb-1 tracking-wider">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 text-white rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#5BA535] focus:ring-1 focus:ring-[#5BA535] transition-all placeholder:text-zinc-600"
                placeholder="••••••••"
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
              Mínimo 6 caracteres, combinando letras y al menos un número.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-zinc-300 mb-1 tracking-wider">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <CheckCircle2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 text-white rounded-xl pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#5BA535] focus:ring-1 focus:ring-[#5BA535] transition-all placeholder:text-zinc-600"
                placeholder="••••••••"
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
              Repetí exactamente la clave ingresada arriba.
            </p>
          </div>
        </div>

      </div>

      {/* PIE DE FORMULARIO */}
      <div className="pt-3 border-t border-zinc-800/80 space-y-3 mt-2">
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

        <p className="text-xs text-center text-zinc-400">
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