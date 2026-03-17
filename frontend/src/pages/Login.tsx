import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { handleApiError } from '../lib/errorHandler';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!email || !password) {
      setError('Todos los campos son obligatorios');
      setLoading(false);
      return;
    }

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-slam-subtle flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-slam rounded-2xl mb-6 shadow-slam-lg transform hover:scale-110 transition-transform duration-300">
            <span className="text-4xl">🎾</span>
          </div>
          <h1 className="text-4xl font-bold text-slam-900 mb-2">Club de Tenis</h1>
          <p className="text-lg text-slam-600 font-medium">Sistema de Gestión Grand Slam</p>
        </div>
        
        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-slam-lg border border-slam-100 overflow-hidden animate-slide-down mb-6">
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slam-900 mb-2">Bienvenido de vuelta</h2>
              <p className="text-slam-600 text-sm">Inicia sesión en tu cuenta para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-slam-900">
                  📧 Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-slam-200 rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:border-slam-600 focus:ring-2 focus:ring-slam-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                  placeholder="correo@example.com"
                  required
                  disabled={loading}
                />
              </div>
              
              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slam-900">
                  🔒 Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-slam-200 rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:border-slam-600 focus:ring-2 focus:ring-slam-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-slide-down">
                  <p className="text-red-700 font-medium text-sm">⚠️ {error}</p>
                </div>
              )}
              
              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full px-6 py-3 bg-gradient-slam text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-slam hover:shadow-slam-lg disabled:opacity-50 disabled:cursor-not-allowed mt-8"
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Iniciando sesión...</span>
                  </span>
                ) : (
                  '🏆 Iniciar Sesión'
                )}
              </button>
            </form>
          </div>
        </div>
        
        {/* Register Link */}
        <div className="text-center animate-fade-in">
          <p className="text-slam-700 font-medium">
            ¿No tienes cuenta?{' '}
            <Link 
              to="/register" 
              className="text-slam-600 hover:text-slam-800 font-bold underline transition-colors duration-200"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>

        {/* Footer Info */}
        <div className="mt-10 text-center text-xs text-slam-500 font-medium">
          <p>Sistema seguro de gestión de club de tenis</p>
          <p className="mt-1">© 2026 Grand Slam Edition</p>
        </div>
      </div>
    </div>
  );
};

export default Login;