import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Rol } from '../types';
import api from '../lib/api';
import { handleApiError } from '../lib/errorHandler';

const Perfil: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    telefono: user?.telefono || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear messages on input change
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Validate password fields if changing password
      if (showPasswordFields) {
        if (!formData.newPassword) {
          setError('Debe ingresar una nueva contraseña');
          setLoading(false);
          return;
        }
        if (formData.newPassword.length < 8) {
          setError('La contraseña debe tener al menos 8 caracteres');
          setLoading(false);
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }
      }

      // Build update payload
      const updateData: any = {};
      
      if (formData.nombre !== user?.nombre) {
        updateData.nombre = formData.nombre;
      }
      
      if (formData.telefono !== user?.telefono) {
        updateData.telefono = formData.telefono;
      }
      
      if (showPasswordFields && formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      // Only make API call if there are changes
      if (Object.keys(updateData).length === 0) {
        setError('No hay cambios para guardar');
        setLoading(false);
        return;
      }

      await api.patch('/usuarios/perfil', updateData);
      
      setSuccess('Perfil actualizado exitosamente');
      
      // Reset password fields
      if (showPasswordFields) {
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowPasswordFields(false);
      }

      // Reload page to update user context
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitarSocio = async () => {
    try {
      const response = await api.get('/usuarios/solicitar-socio');
      const { whatsappUrl } = response.data;
      
      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');
    } catch (err: any) {
      setError(handleApiError(err));
    }
  };

  const getRolLabel = (rol: Rol) => {
    switch (rol) {
      case Rol.ADMINISTRADOR:
        return 'Administrador';
      case Rol.SOCIO:
        return 'Socio';
      case Rol.NO_SOCIO:
        return 'No Socio';
      default:
        return rol;
    }
  };

  const getRolBadgeColor = (rol: Rol) => {
    switch (rol) {
      case Rol.ADMINISTRADOR:
        return 'badge-danger';
      case Rol.SOCIO:
        return 'badge-success';
      case Rol.NO_SOCIO:
        return 'badge-warning';
      default:
        return 'badge-gray';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
        <p className="text-gray-600">
          Actualiza tu información personal y contraseña
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Info Card */}
        <div className="card animate-slide-up">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Información de Cuenta</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100 last:border-b-0">
              <span className="text-sm font-medium text-gray-500 mb-1 sm:mb-0">Email:</span>
              <span className="text-sm text-gray-900 font-medium">{user.email}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100 last:border-b-0">
              <span className="text-sm font-medium text-gray-500 mb-1 sm:mb-0">Rol:</span>
              <span className={`badge ${getRolBadgeColor(user.rol)}`}>
                {getRolLabel(user.rol)}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100 last:border-b-0">
              <span className="text-sm font-medium text-gray-500 mb-1 sm:mb-0">Estado:</span>
              <span className={`badge ${user.activo ? 'badge-success' : 'badge-danger'}`}>
                {user.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100 last:border-b-0">
              <span className="text-sm font-medium text-gray-500 mb-1 sm:mb-0">Miembro desde:</span>
              <span className="text-sm text-gray-900 font-medium">
                {new Date(user.created_at).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>

            {/* Request Socio Role Button for No_Socio users */}
            {user.rol === Rol.NO_SOCIO && (
              <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <p className="text-sm text-primary-800 mb-3">
                  ¿Deseas convertirte en socio del club?
                </p>
                <button
                  type="button"
                  className="btn btn-success btn-sm flex items-center space-x-2"
                  onClick={handleSolicitarSocio}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span>Solicitar cambio a Socio</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="card animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Editar Información Personal</h2>
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-danger animate-slide-down mb-6">
                {error}
              </div>
            )}
            
            {success && (
              <div className="alert alert-success animate-slide-down mb-6">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                  required
                  disabled={loading}
                />
              </div>

              {/* Password Change Section */}
              <div className="border-t border-gray-200 pt-6">
                <button
                  type="button"
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors duration-200 flex items-center space-x-2"
                  onClick={() => setShowPasswordFields(!showPasswordFields)}
                  disabled={loading}
                >
                  <svg className={`w-4 h-4 transition-transform duration-200 ${showPasswordFields ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>
                    {showPasswordFields ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
                  </span>
                </button>

                {showPasswordFields && (
                  <div className="mt-4 space-y-4 animate-slide-down">
                    <div className="form-group">
                      <label htmlFor="newPassword" className="form-label">
                        Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="form-input"
                        minLength={8}
                        disabled={loading}
                        placeholder="Mínimo 8 caracteres"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword" className="form-label">
                        Confirmar Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="form-input"
                        minLength={8}
                        disabled={loading}
                        placeholder="Repita la nueva contraseña"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="loading-spinner w-4 h-4"></div>
                      <span>Guardando...</span>
                    </div>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
