import { useState, useEffect, createContext, useContext } from 'react';
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
  ChevronUp,
  Menu,
  X,
  Truck,
  Sun,
  Moon
} from 'lucide-react';

// --- 1. CREACIÓN DEL CONTEXTO DE TEMA ---
const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export default function DashboardLayout({ children }) {
  useAutoLogout();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- ESTADO DE TEMA (CLARO / OSCURO) SINCRONIZADO ---
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('inventario_theme');
    if (saved !== null) return saved === 'dark';
    return true; // Por defecto oscuro
  });

  useEffect(() => {
    localStorage.setItem('inventario_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const navigationLinks = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Caja', href: '/caja', icon: Wallet },
    { name: 'Inventario', href: '/inventario', icon: Package },
    { name: 'Ventas', href: '/ventas', icon: ShoppingBag },
    { name: 'Proveedores', href: '/providers', icon: Truck },
  ];

  const getInitials = (email) => {
    if (!email) return 'ST';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-200 ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-800'}`}>
        
        {/* BARRA SUPERIOR MÓVIL */}
        <div className={`md:hidden flex items-center justify-between border-b p-4 sticky top-0 z-30 transition-colors ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5BA535] to-[#1C562A] flex items-center justify-center text-white font-bold shadow-md shrink-0">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-extrabold tracking-tight leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Stock<span className="text-[#5BA535]">io</span>
              </h2>
            </div>
          </div>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`p-2 rounded-xl cursor-pointer ${darkMode ? 'bg-zinc-800 text-zinc-300 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}
          >
            <div className="w-6 h-6 rounded-lg bg-[#1C562A]/40 border border-[#5BA535]/30 flex items-center justify-center font-bold text-[10px] text-[#5BA535]">
              {getInitials(user?.email)}
            </div>
          </button>

          {/* MENÚ DESPLEGABLE DE PERFIL MÓVIL (DESDE ARRIBA) */}
          {showProfileMenu && (
            <div className={`absolute top-full left-0 right-0 border-b shadow-xl p-2 space-y-1 z-30 ${
              darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <div className="px-3 py-2 border-b mb-1 flex items-center justify-between">
                <span className={`text-xs font-semibold truncate ${darkMode ? 'text-zinc-200' : 'text-slate-700'}`}>
                  {user?.email || 'usuario@stockio.com'}
                </span>
                <span className="text-[10px] text-emerald-400 font-medium">Activo</span>
              </div>
              <Link
                to="/perfil"
                onClick={() => setShowProfileMenu(false)}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  darkMode ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5 text-[#5BA535]" />
                <span>Ver Mi Perfil</span>
              </Link>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  darkMode ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                  <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}>
                  {darkMode ? 'Dark' : 'Light'}
                </span>
              </button>

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
        </div>
        
        {/* BARRA INFERIOR MÓVIL (ESTILO INSTAGRAM / X) */}
        <div className={`md:hidden fixed bottom-0 left-0 right-0 border-t z-30 flex items-center justify-around py-2 transition-colors ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          {navigationLinks.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-[#5BA535]'
                    : darkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#5BA535]' : ''}`} />
                <span className="text-[10px] mt-1 font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
        
        {/* SIDEBAR (ESCRITORIO) */}
        <aside className={`hidden md:flex w-64 border-r flex-col justify-between p-4 fixed h-full z-25 transition-transform duration-300 ease-in-out ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            
            {/* Brand/Logo de Stockio */}
            <div className="mb-8 px-2 pt-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5BA535] to-[#1C562A] flex items-center justify-center text-white font-bold shadow-md shrink-0">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-extrabold tracking-tight leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Stock<span className="text-[#5BA535]">io</span>
                </h2>
                <span className={`text-[10px] font-semibold tracking-wider uppercase block ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                  Todo tu stock, en orden.
                </span>
              </div>
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
                        ? darkMode 
                          ? 'bg-zinc-800 text-white font-semibold border-l-2 border-[#5BA535] shadow-sm' 
                          : 'bg-slate-100 text-slate-900 font-semibold border-l-2 border-[#5BA535] shadow-sm'
                        : darkMode 
                          ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200' 
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#5BA535]' : (darkMode ? 'text-zinc-500' : 'text-slate-400')}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* PIE DE SIDEBAR / OPCIÓN DE PERFIL */}
          <div className={`relative border-t pt-3 ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
            
            {showProfileMenu && (
              <div className={`absolute bottom-full left-0 right-0 mb-2 border rounded-xl shadow-2xl overflow-hidden p-1 space-y-1 z-30 animate-in fade-in slide-in-from-bottom-2 ${
                darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-slate-300/50'
              }`}>
                <Link
                  to="/perfil"
                  onClick={() => setShowProfileMenu(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    darkMode ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-[#5BA535]" />
                  <span>Ver Mi Perfil</span>
                </Link>

                {/* OPCIÓN DE CAMBIO DE APARIENCIA */}
                <button
                  onClick={() => {
                    setDarkMode(!darkMode);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    darkMode ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                    <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}>
                    {darkMode ? 'Dark' : 'Light'}
                  </span>
                </button>

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

            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left group cursor-pointer ${
                darkMode ? 'hover:bg-zinc-800/60' : 'hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-[#1C562A]/40 border border-[#5BA535]/30 flex items-center justify-center font-bold text-xs text-[#5BA535]">
                    {getInitials(user?.email)}
                  </div>
                  {/* Indicador de estado online */}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 rounded-full ${
                    darkMode ? 'border-zinc-900' : 'border-white'
                  }`}></span>
                </div>
                  
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold truncate ${darkMode ? 'text-zinc-200 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900'}`}>
                    {user?.email || 'usuario@stockio.com'}
                  </p>
                  <p className="text-[10px] text-emerald-400/80 font-medium tracking-wide mt-0.5">
                    Sesión activa
                  </p>
                </div>
              </div>
                
              <ChevronUp 
                className={`w-4 h-4 transition-transform shrink-0 ${
                  darkMode ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-slate-400 group-hover:text-slate-600'
                } ${
                  showProfileMenu ? 'rotate-180' : ''
                }`} 
              />
            </button>
          </div>

        </aside>

        {/* CONTENEDOR PRINCIPAL */}
        <main className={`flex-1 md:ml-64 p-4 md:p-8 pb-20 md:pb-8 min-h-screen transition-colors ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-800'}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

      </div>
    </ThemeContext.Provider>
  );
}