import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import useAutoLogout from '../hooks/useAutoLogout';

export default function DashboardLayout({ children }) {
  useAutoLogout();
  const { user, logout } = useAuth();
  const location = useLocation();

  // LISTA DE LINKS GENERALES:
  const navigationLinks = [
    { name: 'Inicio', href: '/' },                  //la parte de estadisticas esta en el inicio
    { name: 'Caja', href: '/caja' },
    { name: 'Inventario', href: '/inventario' },
    { name: 'Ventas', href: '/ventas' },
    { name: 'Mi perfil', href: '/perfil' },
  ];

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between p-6 fixed h-full">
        <div>
          {/* Logo / Título del Sistema */}
          <div className="mb-8 px-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Sistema de stock y ventas</h2>
            <span className="text-xs text-zinc-500 font-medium tracking-wider uppercase block mt-1">
              Panel de Control
            </span>
          </div>

          {/* Menú de Navegación Simple */}
          <nav className="space-y-1">
            {navigationLinks.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>


        {/* Información del Usuario conectado */}
        <div className="border-t border-zinc-800 pt-4">
          <div className="px-2 mb-3">
            <p className="text-xs font-medium text-zinc-400 truncate">{user?.email}</p>   
            {/* se puede agregar el rol del usuario y demas detalles*/}
          </div>
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