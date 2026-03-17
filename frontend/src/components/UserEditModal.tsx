import React, { useState } from 'react';
import { Usuario, Rol } from '../types';
import api from '../lib/api';

interface UserEditModalProps {
  user: Usuario;
  onClose: () => void;
  onUserUpdated: () => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ user, onClose, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    nombre: user.nombre,
    apellido: user.apellido,
    telefono: user.telefono,
    rol: user.rol,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Update user data
      const updateData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
      };

      await api.put(`/usuarios/${user.id}`, updateData);

      // Update role if changed
      if (formData.rol !== user.rol) {
        await api.patch(`/usuarios/${user.id}/rol`, { rol: formData.rol });
      }

      onUserUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content !max-w-2xl !max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header !py-4 flex-shrink-0">
          <h2 className="modal-title !text-xl">✏️ Editar Usuario</h2>
          <button onClick={onClose} className="modal-close-btn">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body overflow-y-auto !py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="form-group mb-0">
              <label htmlFor="nombre" className="form-label !mb-1 text-xs">Nombre</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                className="form-input w-full !py-2"
                placeholder="Ej: Juan"
              />
            </div>

            <div className="form-group mb-0">
              <label htmlFor="apellido" className="form-label !mb-1 text-xs">Apellido</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                required
                className="form-input w-full !py-2"
                placeholder="Ej: Pérez"
              />
            </div>

            <div className="form-group mb-0">
              <label htmlFor="telefono" className="form-label !mb-1 text-xs">Teléfono</label>
              <input
                type="text"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                required
                className="form-input w-full !py-2"
                placeholder="Ej: 11 1234 5678"
              />
            </div>

            <div className="form-group mb-0">
              <label htmlFor="rol" className="form-label !mb-1 text-xs">Rol</label>
              <select
                id="rol"
                name="rol"
                value={formData.rol}
                onChange={handleInputChange}
                className="form-select w-full !py-2"
              >
                <option value={Rol.ADMINISTRADOR}>Administrador</option>
                <option value={Rol.SOCIO}>Socio</option>
                <option value={Rol.NO_SOCIO}>No Socio</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase font-black leading-none mb-1">Email</span>
                <span className="text-xs font-bold text-slate-700 truncate">{user.email}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase font-black leading-none mb-1">Estado</span>
                <span className={`text-xs font-bold ${user.activo ? 'text-green-600' : 'text-red-600'}`}>
                  {user.activo ? '✅ Activa' : '❌ Inactiva'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase font-black leading-none mb-1">Miembro</span>
                <span className="text-xs font-bold text-slate-700">
                  {new Date(user.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger py-2 px-3 text-xs mb-0">
              <div className="flex items-center">
                <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div className="modal-actions !mt-0 !pt-3 border-t border-slate-100 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary px-4 !py-2 text-sm"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary px-6 !py-2 text-sm"
              disabled={loading}
            >
              <div className="flex items-center">
                {loading ? (
                  <>
                    <div className="loading-spinner !w-3 !height-3 !border-2 mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar
                  </>
                )}
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditModal;