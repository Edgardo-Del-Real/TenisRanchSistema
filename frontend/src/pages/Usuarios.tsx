import React, { useState, useEffect } from 'react';
import { Usuario, Rol } from '../types';
import api from '../lib/api';
import { handleApiError } from '../lib/errorHandler';
import UserEditModal from '../components/UserEditModal';

interface UsuariosFilters {
  nombre?: string;
  apellido?: string;
  activo?: boolean;
  rol?: Rol;
}

const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UsuariosFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      // Add search terms
      if (searchTerm.trim()) {
        const terms = searchTerm.trim().split(' ');
        if (terms.length >= 1) params.append('nombre', terms[0]);
        if (terms.length >= 2) params.append('apellido', terms[1]);
      }
      
      // Add filters
      if (filters.activo !== undefined) {
        params.append('activo', filters.activo.toString());
      }
      if (filters.rol) {
        params.append('rol', filters.rol);
      }

      const response = await api.get(`/usuarios?${params.toString()}`);
      setUsuarios(response.data);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [filters, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsuarios();
  };

  const handleFilterChange = (key: keyof UsuariosFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const handleEditUser = (user: Usuario) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('¿Está seguro de que desea dar de baja a este usuario?')) {
      return;
    }

    try {
      await api.delete(`/usuarios/${userId}`);
      await fetchUsuarios(); // Refresh the list
    } catch (err: any) {
      alert(handleApiError(err));
    }
  };

  const handleUserUpdated = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
    fetchUsuarios();
  };

  const getRolBadgeClass = (rol: Rol) => {
    switch (rol) {
      case Rol.ADMINISTRADOR:
        return 'badge badge-danger';
      case Rol.SOCIO:
        return 'badge badge-success';
      case Rol.NO_SOCIO:
        return 'badge badge-warning';
      default:
        return 'badge badge-gray';
    }
  };

  const getEstadoBadgeClass = (activo: boolean) => {
    return activo ? 'badge badge-success' : 'badge badge-danger';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Usuarios</h1>
          <p className="text-gray-600">
            Administra los usuarios del club y sus permisos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-success-500 rounded-full mr-2"></div>
              {usuarios.filter(u => u.activo).length} Activos
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 bg-danger-500 rounded-full mr-2"></div>
              {usuarios.filter(u => !u.activo).length} Inactivos
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card animate-slide-up">
        <div className="card-body">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por nombre y/o apellido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                />
              </div>
              <button type="submit" className="btn btn-primary whitespace-nowrap">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="form-group flex-1">
                <label htmlFor="estado-filter" className="form-label">
                  Estado
                </label>
                <select
                  id="estado-filter"
                  value={filters.activo === undefined ? '' : filters.activo.toString()}
                  onChange={(e) => handleFilterChange('activo', e.target.value === '' ? undefined : e.target.value === 'true')}
                  className="form-select"
                >
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>

              <div className="form-group flex-1">
                <label htmlFor="rol-filter" className="form-label">
                  Rol
                </label>
                <select
                  id="rol-filter"
                  value={filters.rol || ''}
                  onChange={(e) => handleFilterChange('rol', e.target.value)}
                  className="form-select"
                >
                  <option value="">Todos</option>
                  <option value={Rol.ADMINISTRADOR}>Administrador</option>
                  <option value={Rol.SOCIO}>Socio</option>
                  <option value={Rol.NO_SOCIO}>No Socio</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setFilters({});
                    setSearchTerm('');
                  }}
                  className="btn btn-secondary whitespace-nowrap"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger animate-slide-down">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="card animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Nombre</th>
                <th className="table-header-cell">Apellido</th>
                <th className="table-header-cell">Email</th>
                <th className="table-header-cell hidden sm:table-cell">Teléfono</th>
                <th className="table-header-cell text-center">Rol</th>
                <th className="table-header-cell text-center">Estado</th>
                <th className="table-header-cell hidden lg:table-cell">Fecha Registro</th>
                <th className="table-header-cell text-right" style={{ minWidth: '140px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-cell text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">No se encontraron usuarios</p>
                    </div>
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => (
                  <tr key={usuario.id} className="table-row">
                    <td className="table-cell font-medium">{usuario.nombre}</td>
                    <td className="table-cell">{usuario.apellido}</td>
                    <td className="table-cell">
                      <a href={`mailto:${usuario.email}`} className="text-primary-600 hover:text-primary-700 transition-colors duration-200">
                        {usuario.email}
                      </a>
                    </td>
                    <td className="table-cell sm:table-cell">
                      <a href={`tel:${usuario.telefono}`} className="text-primary-600 hover:text-primary-700 transition-colors duration-200">
                        {usuario.telefono}
                      </a>
                    </td>
                    <td className="table-cell text-center">
                      <span className={getRolBadgeClass(usuario.rol)}>
                        {usuario.rol}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <span className={getEstadoBadgeClass(usuario.activo)}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="table-cell lg:table-cell text-sm text-gray-500">
                      {new Date(usuario.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => handleEditUser(usuario)}
                          className="btn btn-secondary btn-sm !p-2"
                          title="Editar usuario"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {usuario.activo && (
                          <button
                            onClick={() => handleDeleteUser(usuario.id)}
                            className="btn btn-danger btn-sm !p-2"
                            title="Dar de baja"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
};

export default Usuarios;