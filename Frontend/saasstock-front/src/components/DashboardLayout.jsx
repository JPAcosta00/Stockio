import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import useAutoLogout from '../hooks/useAutoLogout';
import { 
  Home, 
  Wallet, 
  Package, 
  ShoppingBag, 
  User, 
  LogOut, 
  ChevronUp 
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  useAutoLogout();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navigationLinks = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Caja', href: '/caja', icon: Wallet },
    { name: 'Inventario', href: '/inventario', icon: Package },
    { name: 'Ventas', href: '/ventas', icon: ShoppingBag },
  ];

  const getInitials = (email) => {
    if (!email) return 'ST';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100">
      
      {/* SIDEBAR - Dark Zinc sin tonos azules */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between p-4 fixed h-full z-20">
        <div>
          
          {/* Header / Brand de Stockio con Logo Imagen Integrado */}
          <div className="mb-8 px-1 pt-1">
            <Link 
              to="/" 
              className="group flex items-center gap-3 p-2 rounded-2xl hover:bg-zinc-800/60 transition-all duration-300 border border-transparent hover:border-zinc-800"
            >
              <div className="relative shrink-0">
                <div className="absolute -inset-1 rounded-xl bg-[#5BA535] opacity-20 blur-md group-hover:opacity-50 transition-opacity" />
                <div className="relative bg-zinc-100 p-1.5 rounded-xl border border-zinc-300 flex items-center justify-center shadow-md">
                  <img 
                    src="/logo.png" 
                    alt="Stockio Logo" 
                    className="h-8 w-auto object-contain"
                  />
                </div>
              </div>
            
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-0.5">
                  <span className="text-lg font-extrabold tracking-tight text-white">
                    Stock
                  </span>
                  <span className="text-lg font-extrabold tracking-tight text-[#5BA535]">
                    io
                  </span>
                </div>
                <span className="text-[9px] font-bold text-zinc-400 tracking-wider uppercase truncate">
                  Todo tu stock, en orden
                </span>
              </div>
            </Link>
          </div>

          {/* Menú de Navegación */}
          <nav className="space-y-1">
            {navigationLinks.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-800 text-white font-semibold border-l-2 border-[#5BA535] shadow-sm'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#5BA535]' : 'text-zinc-500'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* PIE DE SIDEBAR / OPCIÓN DE PERFIL */}
        <div className="relative border-t border-zinc-800 pt-3">
          
          {/* Desplegable Contextual */}
          {showProfileMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden p-1 space-y-1 z-30 animate-in fade-in slide-in-from-bottom-2">
              <Link
                to="/perfil"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors"
              >
                <User className="w-3.5 h-3.5 text-[#5BA535]" />
                <span>Ver Mi Perfil</span>
              </Link>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-950/30 rounded-lg transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}

          {/* Botón Tarjeta de Usuario */}
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/60 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar con verde bosque oscuro */}
              <div className="w-8 h-8 rounded-lg bg-[#1C562A]/40 border border-[#5BA535]/30 flex items-center justify-center shrink-0 font-bold text-xs text-[#5BA535]">
                {getInitials(user?.email)}
              </div>

              {/* Email y Rol */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white">
                  {user?.email || 'usuario@stockio.com'}
                </p>
                <p className="text-[10px] text-zinc-500 font-medium truncate uppercase tracking-wider mt-0.5">
                  {user?.role || 'Administrador'}
                </p>
              </div>
            </div>

            <ChevronUp 
              className={`w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-transform ${
                showProfileMenu ? 'rotate-180' : ''
              }`} 
            />
          </button>
        </div>

      </aside>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="flex-1 ml-64 p-8 bg-zinc-950 min-h-screen text-zinc-100">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}