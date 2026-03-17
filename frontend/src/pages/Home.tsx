import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Rol } from '../types';

const Home: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const adminCards = [
    {
      title: 'Usuarios',
      description: 'Gestiona los miembros del club y sus permisos',
      icon: '👥',
      link: '/usuarios',
      color: 'primary'
    },
    {
      title: 'Canchas',
      description: 'Administra el estado y disponibilidad de las canchas',
      icon: '🎾',
      link: '/canchas',
      color: 'success'
    },
    {
      title: 'Tarifas',
      description: 'Configura precios y tarifas del club',
      icon: '💰',
      link: '/tarifas',
      color: 'warning'
    },
    {
      title: 'Cuotas',
      description: 'Gestiona las cuotas mensuales de los socios',
      icon: '📊',
      link: '/cuotas',
      color: 'primary'
    },
    {
      title: 'Pagos Luz',
      description: 'Administra los pagos de iluminación',
      icon: '💡',
      link: '/pagos-luz',
      color: 'warning'
    },
    {
      title: 'Estadísticas',
      description: 'Visualiza reportes financieros y de uso',
      icon: '📈',
      link: '/estadisticas',
      color: 'success'
    }
  ];

  const userCards = [
    {
      title: 'Turnos',
      description: 'Reserva y gestiona tus turnos de tenis',
      icon: '🎾',
      link: '/turnos',
      color: 'primary'
    },
    {
      title: 'Mi Perfil',
      description: 'Actualiza tu información personal',
      icon: '👤',
      link: '/perfil',
      color: 'success'
    }
  ];

  const socioCards = [
    ...userCards,
    {
      title: 'Mis Cuotas',
      description: 'Consulta el estado de tus cuotas mensuales',
      icon: '💳',
      link: '/mis-cuotas',
      color: 'warning'
    }
  ];

  const getCards = () => {
    if (user.rol === Rol.ADMINISTRADOR) {
      return [...adminCards, ...userCards];
    }
    if (user.rol === Rol.SOCIO) {
      return socioCards;
    }
    return userCards;
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary':
        return 'from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700';
      case 'success':
        return 'from-success-500 to-success-600 hover:from-success-600 hover:to-success-700';
      case 'warning':
        return 'from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700';
      case 'danger':
        return 'from-danger-500 to-danger-600 hover:from-danger-600 hover:to-danger-700';
      default:
        return 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Bienvenido, {user.nombre} {user.apellido}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0">
          {user.rol === Rol.ADMINISTRADOR && 'Panel de administración del Club de Tenis'}
          {user.rol === Rol.SOCIO && 'Tu portal personal del Club de Tenis'}
          {user.rol !== Rol.ADMINISTRADOR && user.rol !== Rol.SOCIO && 'Bienvenido al Club de Tenis'}
        </p>
      </div>

      {/* Quick Stats - Admin Only */}
      {user.rol === Rol.ADMINISTRADOR && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="card hover:shadow-lg transition-all duration-200">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-600 text-lg">👥</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Usuarios Activos</p>
                  <p className="text-2xl font-semibold text-gray-900">--</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-all duration-200">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                    <span className="text-success-600 text-lg">🎾</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Canchas Disponibles</p>
                  <p className="text-2xl font-semibold text-gray-900">--</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-all duration-200">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                    <span className="text-warning-600 text-lg">📅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Turnos Hoy</p>
                  <p className="text-2xl font-semibold text-gray-900">--</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-all duration-200">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-600 text-lg">💰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Ingresos Mes</p>
                  <p className="text-2xl font-semibold text-gray-900">--</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {getCards().map((card, index) => (
          <Link
            key={card.link}
            to={card.link}
            className="group block animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="card hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="card-body">
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-r ${getColorClasses(card.color)} rounded-xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    {card.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700 transition-colors duration-200">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {card.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-primary-600 group-hover:text-primary-700 transition-colors duration-200">
                  <span className="text-sm font-medium">Acceder</span>
                  <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity - Placeholder for future implementation */}
      <div className="card animate-slide-up" style={{ animationDelay: '600ms' }}>
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Actividad Reciente</h2>
        </div>
        <div className="card-body">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">📋</span>
            </div>
            <p className="text-gray-500">No hay actividad reciente para mostrar</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;