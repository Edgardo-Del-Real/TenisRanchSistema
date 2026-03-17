import React, { useState, useEffect } from 'react';
import { Cancha, EstadoCancha } from '../types';
import api from '../lib/api';
import { handleApiError } from '../lib/errorHandler';
import CanchaStatusModal from '../components/CanchaStatusModal';
import CanchaHistoryModal from '../components/CanchaHistoryModal';

const Canchas: React.FC = () => {
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCancha, setSelectedCancha] = useState<Cancha | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const fetchCanchas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/canchas');
      setCanchas(response.data);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCanchas();
  }, []);

  const handleChangeStatus = (cancha: Cancha) => {
    setSelectedCancha(cancha);
    setIsStatusModalOpen(true);
  };

  const handleViewHistory = (cancha: Cancha) => {
    setSelectedCancha(cancha);
    setIsHistoryModalOpen(true);
  };

  const handleStatusUpdated = () => {
    setIsStatusModalOpen(false);
    setSelectedCancha(null);
    fetchCanchas();
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

  if (loading) {
    return <div className="loading">Cargando canchas...</div>;
  }

  return (
    <div className="canchas-page">
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🏟️ Gestión de Canchas</h1>
          <p className="text-gray-600">
            Administra el estado y disponibilidad de las canchas del club
          </p>
        </div>

        {error && (
          <div className="alert alert-danger animate-slide-down">
            {error}
          </div>
        )}

        {/* Canchas Grid */}
        {canchas.length === 0 ? (
          <div className="card animate-slide-up">
            <div className="card-body text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10l8-4" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No se encontraron canchas</p>
            </div>
          </div>
        ) : (
          <div className="canchas-grid">
            {canchas.map((cancha) => (
              <div key={cancha.id} className="cancha-card">
                <div className="cancha-header">
                  <h3 className="cancha-number">Cancha {cancha.numero}</h3>
                  <span className={`badge ${getEstadoBadgeClass(cancha.estado)}`}>
                    {getEstadoLabel(cancha.estado)}
                  </span>
                </div>
                
                <div className="cancha-body">
                  {cancha.razon_estado && (
                    <div className="cancha-detail">
                      <span className="cancha-label">📝 Razón:</span>
                      <span className="cancha-value">{cancha.razon_estado}</span>
                    </div>
                  )}
                  <div className="cancha-detail">
                    <span className="cancha-label">🕐 Última actualización:</span>
                    <span className="cancha-value text-sm">{new Date(cancha.updated_at).toLocaleString('es-AR')}</span>
                  </div>
                </div>

                <div className="cancha-footer">
                  <div className="cancha-actions">
                    <button
                      onClick={() => handleChangeStatus(cancha)}
                      className="btn btn-primary btn-sm flex-1"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      Cambiar Estado
                    </button>
                    <button
                      onClick={() => handleViewHistory(cancha)}
                      className="btn btn-secondary btn-sm flex-1"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Historial
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Change Modal */}
      {isStatusModalOpen && selectedCancha && (
        <CanchaStatusModal
          cancha={selectedCancha}
          onClose={() => {
            setIsStatusModalOpen(false);
            setSelectedCancha(null);
          }}
          onStatusUpdated={handleStatusUpdated}
        />
      )}

      {/* History Modal */}
      {isHistoryModalOpen && selectedCancha && (
        <CanchaHistoryModal
          cancha={selectedCancha}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setSelectedCancha(null);
          }}
        />
      )}
    </div>
  );
};

export default Canchas;