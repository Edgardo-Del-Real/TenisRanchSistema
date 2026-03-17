import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { handleApiError } from '../lib/errorHandler';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    telefono: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    const { nombre, apellido, email, password, telefono } = formData;
    
    if (!nombre || !apellido || !email || !password || !telefono) {
      setError('Todos los campos son obligatorios');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      setLoading(false);
      return;
    }

    if (telefono.length < 8) {
      setError('El teléfono debe tener al menos 8 dígitos');
      setLoading(false);
      return;
    }

    try {
      await register(formData);
      navigate('/');
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center animate-slide-down">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <span className="text-white font-bold text-2xl">CT</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registro
          </h1>
          <p className="text-gray-600">
            Únete al Club de Tenis
          </p>
        </div>
        
        {/* Form Card */}
        <div className="card animate-scale-in">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="nombre" className="form-label">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Juan"
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="apellido" className="form-label">
                    Apellido
                  </label>
                  <input
                    type="text"
                    id="apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Pérez"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="juan.perez@email.com"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="telefono" className="form-label">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="+54 11 1234-5678"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  disabled={loading}
                />
                <p className="form-help">
                  Mínimo 8 caracteres
                </p>
              </div>
              
              {error && (
                <div className="alert alert-danger animate-slide-down">
                  {error}
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={loading} 
                className="btn btn-primary btn-lg w-full"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="loading-spinner w-5 h-5"></div>
                    <span>Registrando...</span>
                  </div>
                ) : (
                  'Registrarse'
                )}
              </button>
            </form>
          </div>
        </div>
        
        {/* Login Link */}
        <div className="text-center animate-fade-in">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link 
              to="/login" 
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;