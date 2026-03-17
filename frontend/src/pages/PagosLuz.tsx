import React, { useState, useEffect } from 'react';
import { PagoLuz } from '../types';
import api from '../lib/api';
import { handleApiError } from '../lib/errorHandler';

interface CreatePagoLuzData {
  monto: number;
  descripcion?: string;
}

const PagosLuz: React.FC = () => {
  const [pagos, setPagos] = useState<PagoLuz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<CreatePagoLuzData>({
    monto: 0,
    descripcion: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPagos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/pagos/luz');
      setPagos(response.data);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPagos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const payload: CreatePagoLuzData = {
        monto: formData.monto,
      };
      
      if (formData.descripcion?.trim()) {
        payload.descripcion = formData.descripcion.trim();
      }

      await api.post('/pagos/luz', payload);
      
      // Reset form and close modal
      setFormData({ monto: 0, descripcion: '' });
      setIsFormOpen(false);
      
      // Refresh the list
      await fetchPagos();
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ monto: 0, descripcion: '' });
    setIsFormOpen(false);
    setError(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="loading">Cargando pagos de luz...</div>;
  }

  return (
    <div className="pagos-luz-page">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">💡 Pagos de Luz</h1>
            <p className="text-gray-600">
              Registra y administra los pagos de energía del club
            </p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="mt-4 sm:mt-0 btn btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Registrar Pago
          </button>
        </div>

        {error && (
          <div className="alert alert-danger animate-slide-down">
            {error}
          </div>
        )}

      {/* Registration Form Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">💡 Registrar Pago de Luz</h2>
              <button
                onClick={handleCancel}
                className="modal-close-btn"
                disabled={submitting}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body" role="form">
              <div className="form-group">
                <label htmlFor="monto">Monto *</label>
                <input
                  type="number"
                  id="monto"
                  min="0.01"
                  step="0.01"
                  value={formData.monto || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    monto: parseFloat(e.target.value) || 0
                  }))}
                  className="form-input"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    descripcion: e.target.value
                  }))}
                  className="form-textarea"
                  rows={3}
                  placeholder="Descripción opcional del pago..."
                  disabled={submitting}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Registrando...' : 'Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payments History */}
      <div className="card animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">📊 Historial de Pagos</h2>
        </div>
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">📅 Fecha</th>
                <th className="table-header-cell">💰 Monto</th>
                <th className="table-header-cell">📝 Descripción</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {pagos.length === 0 ? (
                <tr>
                  <td colSpan={3} className="table-cell text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">No hay pagos registrados</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagos.map((pago) => (
                  <tr key={pago.id} className="table-row">
                    <td className="table-cell font-medium">{formatDate(pago.fecha_pago)}</td>
                    <td className="table-cell font-bold text-green-600">{formatCurrency(pago.monto)}</td>
                    <td className="table-cell">{pago.descripcion || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
};

export default PagosLuz;