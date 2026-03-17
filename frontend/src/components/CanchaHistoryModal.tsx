import React, { useState, useEffect } from 'react';
import { Cancha, EstadoCancha } from '../types';
import api from '../lib/api';

interface HistorialCancha {
  id: string;
  cancha_id: string;
  estado_anterior: EstadoCancha;
  estado_nuevo: EstadoCancha;
  razon: string;
  cambiado_por: string;
  cambiado_por_usuario: {
    id: string;
    nombre: string;
    apellido: string;
  };
  fecha_cambio: string;
}

interface CanchaHistoryModalProps {
  cancha: Cancha;
  onClose: () => void;
}

const CanchaHistoryModal: React.FC<CanchaHistoryModalProps> = ({
  cancha,
  onClose,
}) => {
  const [historial, setHistorial] = useState<HistorialCancha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistorial = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/canchas/${cancha.id}/historial`);
      setHistorial(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 
        err.response?.data?.message || 
        'Error al cargar el historial'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, [cancha.id]);

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

  const getEstadoBadgeClass = (estado: EstadoCancha) => {
    switch (estado) {
      case EstadoCancha.DISPONIBLE:
        return 'badge badge-available';
      case EstadoCancha.MANTENIMIENTO:
        return 'badge badge-maintenance';
      case EstadoCancha.INHABILITADA:
        return 'badge badge-disabled';
      default:
        return 'badge';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Historial de Cambios - Cancha {cancha.numero}</h2>
          <button onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="current-status-info">
            <h3>Estado Actual</h3>
            <div className="status-card">
              <span className={getEstadoBadgeClass(cancha.estado)}>
                {getEstadoLabel(cancha.estado)}
              </span>
              {cancha.razon_estado && (
                <p><strong>Razón:</strong> {cancha.razon_estado}</p>
              )}
              <p><strong>Última actualización:</strong> {new Date(cancha.updated_at).toLocaleString('es-AR')}</p>
            </div>
          </div>

          <div className="history-section">
            <h3>Historial de Cambios</h3>
            
            {loading ? (
              <div className="loading">Cargando historial...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : historial.length === 0 ? (
              <div className="no-data">No hay cambios registrados</div>
            ) : (
              <div className="history-timeline">
                {historial.map((cambio) => (
                  <div key={cambio.id} className="history-item">
                    <div className="history-date">
                      {new Date(cambio.fecha_cambio).toLocaleString('es-AR')}
                    </div>
                    <div className="history-content">
                      <div className="status-change">
                        <span className={getEstadoBadgeClass(cambio.estado_anterior)}>
                          {getEstadoLabel(cambio.estado_anterior)}
                        </span>
                        <span className="arrow">→</span>
                        <span className={getEstadoBadgeClass(cambio.estado_nuevo)}>
                          {getEstadoLabel(cambio.estado_nuevo)}
                        </span>
                      </div>
                      <div className="history-reason">
                        <strong>Razón:</strong> {cambio.razon}
                      </div>
                      <div className="history-user">
                        <strong>Cambiado por:</strong> {cambio.cambiado_por_usuario.nombre} {cambio.cambiado_por_usuario.apellido}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanchaHistoryModal;