import React, { useState } from 'react';
import { Cancha, EstadoCancha } from '../types';
import api from '../lib/api';

interface CanchaStatusModalProps {
  cancha: Cancha;
  onClose: () => void;
  onStatusUpdated: () => void;
}

const CanchaStatusModal: React.FC<CanchaStatusModalProps> = ({
  cancha,
  onClose,
  onStatusUpdated,
}) => {
  const [estado, setEstado] = useState<EstadoCancha>(cancha.estado);
  const [razon, setRazon] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!razon.trim()) {
      setError('La razón es obligatoria');
      return;
    }

    if (estado === cancha.estado && razon.trim() === (cancha.razon_estado || '')) {
      setError('Debe cambiar el estado o la razón');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await api.patch(`/canchas/${cancha.id}/estado`, {
        estado,
        razon: razon.trim(),
      });

      onStatusUpdated();
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 
        err.response?.data?.message || 
        'Error al actualizar el estado de la cancha'
      );
    } finally {
      setLoading(false);
    }
  };

  const getEstadoLabel = (estado: EstadoCancha) => {
    switch (estado) {
      case EstadoCancha.DISPONIBLE:
        return 'Disponible';
      case EstadoCancha.MANTENIMIENTO:
        return 'Mantenimiento';
      case EstadoCancha.INHABILITADA:
        return 'Inhabilitada';
      default:
        return estado;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Cambiar Estado - Cancha {cancha.numero}</h2>
          <button onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="current-status">
            <p><strong>Estado actual:</strong> {getEstadoLabel(cancha.estado)}</p>
            {cancha.razon_estado && (
              <p><strong>Razón actual:</strong> {cancha.razon_estado}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="estado">Nuevo Estado *</label>
            <select
              id="estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoCancha)}
              className="form-control"
              required
            >
              <option value={EstadoCancha.DISPONIBLE}>
                {getEstadoLabel(EstadoCancha.DISPONIBLE)}
              </option>
              <option value={EstadoCancha.MANTENIMIENTO}>
                {getEstadoLabel(EstadoCancha.MANTENIMIENTO)}
              </option>
              <option value={EstadoCancha.INHABILITADA}>
                {getEstadoLabel(EstadoCancha.INHABILITADA)}
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="razon">Razón del Cambio *</label>
            <textarea
              id="razon"
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
              className="form-control"
              rows={3}
              maxLength={500}
              placeholder="Ingrese la razón del cambio de estado..."
              required
            />
            <small className="form-text">
              {razon.length}/500 caracteres
            </small>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Actualizar Estado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CanchaStatusModal;