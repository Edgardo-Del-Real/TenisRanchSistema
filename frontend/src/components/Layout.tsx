import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Rol } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-slam-subtle flex items-center justify-center px-4">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 sm:space-x-3 group flex-shrink-0"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                <span className="text-white font-bold text-lg">🎾</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-base sm:text-lg font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">Club de Tenis</div>
                <div className="text-xs text-green-600 font-semibold hidden md:block">Gestión Premium</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-2">
              {user.rol === Rol.ADMINISTRADOR && (
                <>
                  <Link to="/usuarios" className="nav-link">👥 Usuarios</Link>
                  <Link to="/canchas" className="nav-link">🏟️ Canchas</Link>
                  <Link to="/tarifas" className="nav-link">💰 Tarifas</Link>
                  <Link to="/cuotas" className="nav-link">📋 Cuotas</Link>
                  <Link to="/pagos-luz" className="nav-link">💡 Pagos</Link>
                  <Link to="/estadisticas" className="nav-link">📊 Estadísticas</Link>
                </>
              )}
              
              <Link to="/turnos" className="nav-link">🕐 Turnos</Link>
              
              {user.rol === Rol.SOCIO && (
                <Link to="/mis-cuotas" className="nav-link">🧾 Mis Cuotas</Link>
              )}
              
              <Link to="/perfil" className="nav-link">👤 Perfil</Link>
            </div>

            {/* User Menu & Mobile Menu Button */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* User Info - Desktop */}
              <div className="hidden xl:flex items-center space-x-3 pl-4 border-l border-slate-200">
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">
                    {user.nombre} {user.apellido}
                  </div>
                  <div className="text-xs text-green-600 font-semibold">
                    {user.rol === Rol.ADMINISTRADOR ? '👑 Admin' : '👤 Socio'}
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="logout-btn rounded-lg text-sm"
                >
                  Salir
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-all duration-200"
                aria-label="Abrir menú"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-sm animate-slide-down">
              <div className="px-3 py-4 space-y-1 max-h-96 overflow-y-auto">
                {user.rol === Rol.ADMINISTRADOR && (
                  <>
                    <Link to="/usuarios" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      👥 Usuarios
                    </Link>
                    <Link to="/canchas" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      🏟️ Canchas
                    </Link>
                    <Link to="/tarifas" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      💰 Tarifas
                    </Link>
                    <Link to="/cuotas" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      📋 Cuotas
                    </Link>
                    <Link to="/pagos-luz" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      💡 Pagos Luz
                    </Link>
                    <Link to="/estadisticas" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      📊 Estadísticas
                    </Link>
                    <div className="border-t border-slate-200 my-2"></div>
                  </>
                )}
                
                <Link to="/turnos" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  🕐 Turnos
                </Link>
                
                {user.rol === Rol.SOCIO && (
                  <Link to="/mis-cuotas" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                    🧾 Mis Cuotas
                  </Link>
                )}
                
                <Link to="/perfil" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  👤 Perfil
                </Link>

                {/* Mobile User Info */}
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <div className="px-3 py-3 mb-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="font-bold text-slate-900">{user.nombre} {user.apellido}</div>
                    <div className="text-sm text-green-700 font-semibold">
                      {user.rol === Rol.ADMINISTRADOR ? '👑 Administrador' : '👤 Socio'}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full logout-btn rounded-lg text-sm"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-gray-600 font-medium">
              © 2026 Club de Tenis - Gestión Profesional
            </div>
            <div className="text-xs text-gray-500 mt-2 sm:mt-0">
              v1.0.0 • Grand Slam Edition
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;