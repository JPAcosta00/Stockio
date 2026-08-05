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

  // Navegación principal del Dashboard
  const navigationLinks = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Caja', href: '/caja', icon: Wallet },
    { name: 'Inventario', href: '/inventario', icon: Package },
    { name: 'Ventas', href: '/ventas', icon: ShoppingBag },
  ];

  // Helper para las iniciales del usuario
  const getInitials = (email) => {
    if (!email) return 'ST';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen flex bg-[#F4F6F5] text-slate-800">
      
      {/* SIDEBAR - Azul Noche (#0D2237) */}
      <aside className="w-64 bg-[#0D2237] text-white flex flex-col justify-between p-4 fixed h-full z-20 shadow-xl">
        <div>
          
          {/* Brand/Logo de Stockio */}
          <div className="mb-8 px-2 pt-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5BA535] to-[#1C562A] flex items-center justify-center text-white font-bold shadow-md shrink-0">
              {/* Icono isotipo simplificado */}
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white leading-tight">
                Stock<span className="text-[#5BA535]">io</span>
              </h2>
              <span className="text-[10px] text-slate-300 font-semibold tracking-wider uppercase block">
                Todo tu stock, en orden.
              </span>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="space-y-1.5">
            {navigationLinks.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#5BA535] text-white font-semibold shadow-md'
                      : 'text-slate-300 hover:bg-[#1C562A]/50 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* SECCIÓN DE PERFIL (PIE DEL SIDEBAR) */}
        <div className="relative border-t border-slate-700/60 pt-3">
          
          {/* Menú Desplegable Popover */}
          {showProfileMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#0D2237] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden p-1 space-y-1 z-30 animate-in fade-in slide-in-from-bottom-2">
              <Link
                to="/perfil"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-[#1C562A] rounded-lg transition-colors"
              >
                <User className="w-3.5 h-3.5 text-[#5BA535]" />
                <span>Ver Mi Perfil</span>
              </Link>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-950/40 rounded-lg transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}

          {/* Tarjeta interactiva del perfil */}
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 transition-colors text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar con iniciales en Verde Hoja */}
              <div className="w-9 h-9 rounded-lg bg-[#1C562A] border border-[#377731] flex items-center justify-center shrink-0 font-bold text-xs text-[#5BA535] shadow-inner">
                {getInitials(user?.email)}
              </div>

              {/* Datos del Usuario */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-100 truncate group-hover:text-white">
                  {user?.email || 'usuario@stockio.com'}
                </p>
                <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-wider mt-0.5">
                  {user?.role || 'Administrador'}
                </p>
              </div>
            </div>

            <ChevronUp 
              className={`w-4 h-4 text-slate-400 group-hover:text-white transition-transform ${
                showProfileMenu ? 'rotate-180' : ''
              }`} 
            />
          </button>
        </div>

      </aside>

      {/* CONTENEDOR PRINCIPAL - Gris Claro (#F4F6F5) */}
      <main className="flex-1 ml-64 p-8 bg-[#F4F6F5] min-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}