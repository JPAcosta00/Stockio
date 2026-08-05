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
  MoreVertical,
  ChevronUp 
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  useAutoLogout();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // LISTA DE LINKS GENERALES 
  const navigationLinks = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Caja', href: '/caja', icon: Wallet },
    { name: 'Inventario', href: '/inventario', icon: Package },
    { name: 'Ventas', href: '/ventas', icon: ShoppingBag },
  ];

  // Helper para generar iniciales
  const getInitials = (email) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between p-4 fixed h-full z-20">
        <div>
          {/* Logo / Título del Sistema */}
          <div className="mb-8 px-2 pt-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Sistema de Stock</h2>
            <span className="text-xs text-zinc-500 font-medium tracking-wider uppercase block mt-1">
              Panel de Control
            </span>
          </div>

          {/* Menú de Navegación Principal */}
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
                      ? 'bg-zinc-800 text-white font-semibold shadow-sm border border-zinc-700/50'
                      : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* PERFIL DE USUARIO EN EL PIE DEL SIDEBAR */}
        <div className="relative border-t border-zinc-800 pt-3">
          
          {/* Menú Desplegable (Popover) */}
          {showProfileMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden p-1 space-y-1 z-30">
              <Link
                to="/perfil"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors"
              >
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>Ver Mi Perfil</span>
              </Link>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-950/30 rounded-lg transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}

          {/* Tarjeta de usuario */}
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/60 transition-colors text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar con iniciales */}
              <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0 font-semibold text-xs text-emerald-400 group-hover:border-zinc-600 transition-colors">
                {getInitials(user?.email)}
              </div>

              {/* Email y Rol */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white">
                  {user?.email || 'Usuario'}
                </p>
                <p className="text-[10px] text-zinc-500 font-medium truncate uppercase tracking-wider mt-0.5">
                  {user?.role || 'Administrador'}
                </p>
              </div>
            </div>

            <ChevronUp className={`w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>
        </div>

      </aside>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="flex-1 ml-64 p-10 bg-zinc-950 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}