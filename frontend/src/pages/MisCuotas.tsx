import React, { useState, useEffect } from 'react';
import { EstadoCuota } from '../types';
import api from '../lib/api';
import { handleApiError } from '../lib/errorHandler';

interface CuotaListItem {
  id: string;
  mes: number;
  anio: number;
  monto_total: number;
  monto_abonado: number;
  saldo_pendiente: number;
  estado: EstadoCuota;
  created_at: string;
}

interface PagoCuota {
  id: string;
  monto: number;
  fecha_pago: string;
}

const MisCuotas: React.FC = () => {
  const [cuotas, setCuotas] = useState<CuotaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCuota, setSelectedCuota] = useState<CuotaListItem | null>(null);
  const [pagos, setPagos] = useState<PagoCuota[]>([]);
  const [loadingPagos, setLoadingPagos] = useState(false);

  const fetchCuotas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/cuotas');
      setCuotas(response.data);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchPagos = async (cuotaId: string) => {
    try {
      setLoadingPagos(true);
      const response = await api.get(`/cuotas/${cuotaId}/pagos`);
      setPagos(response.data);
    } catch (err: any) {
      console.error('Error al cargar pagos:', err);
      setPagos([]);
    } finally {
      setLoadingPagos(false);
    }
  };

  useEffect(() => {
    fetchCuotas();
  }, []);

  useEffect(() => {
    if (selectedCuota) {
      fetchPagos(selectedCuota.id);
    } else {
      setPagos([]);
    }
  }, [selectedCuota]);

  const getEstadoBadgeClass = (estado: EstadoCuota) => {
    switch (estado) {
      case EstadoCuota.PENDIENTE:
        return 'badge badge-warning';
      case EstadoCuota.PARCIAL:
        return 'badge badge-primary';
      case EstadoCuota.PAGADA:
        return 'badge badge-success';
      default:
        return 'badge badge-gray';
    }
  };

  const getEstadoLabel = (estado: EstadoCuota) => {
    switch (estado) {
      case EstadoCuota.PENDIENTE:
        return 'Pendiente';
      case EstadoCuota.PARCIAL:
        return 'Parcial';
      case EstadoCuota.PAGADA:
        return 'Pagada';
      default:
        return estado;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonth = (mes: number, anio: number) => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${monthNames[mes - 1]} ${anio}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
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
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Cuotas</h1>
        <p className="text-gray-600">
          Consulta el estado de tus cuotas mensuales y el historial de pagos
        </p>
      </div>

      {error && (
        <div className="alert alert-danger animate-slide-down">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        <div className="card animate-slide-up">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Cuotas</p>
                <p className="text-2xl font-semibold text-gray-900">{cuotas.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pagadas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {cuotas.filter(c => c.estado === EstadoCuota.PAGADA).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pendientes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {cuotas.filter(c => c.estado === EstadoCuota.PENDIENTE).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cuotas Grid */}
      {cuotas.length === 0 ? (
        <div className="card animate-slide-up">
          <div className="card-body text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No tienes cuotas registradas</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cuotas.map((cuota, index) => (
            <div 
              key={cuota.id} 
              className={`card hover:shadow-lg transition-all duration-200 cursor-pointer animate-slide-up ${
                selectedCuota?.id === cuota.id ? 'ring-2 ring-primary-500 shadow-lg' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setSelectedCuota(cuota)}
            >
              <div className="card-header flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {formatMonth(cuota.mes, cuota.anio)}
                </h3>
                <span className={getEstadoBadgeClass(cuota.estado)}>
                  {getEstadoLabel(cuota.estado)}
                </span>
              </div>

              <div className="card-body space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm text-gray-600">Monto Total:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(cuota.monto_total)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm text-gray-600">Monto Abonado:</span>
                  <span className="text-sm font-semibold text-success-600">
                    {formatCurrency(cuota.monto_abonado)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm text-gray-600">Saldo Pendiente:</span>
                  <span className={`text-sm font-semibold ${cuota.saldo_pendiente > 0 ? 'text-warning-600' : 'text-success-600'}`}>
                    {formatCurrency(cuota.saldo_pendiente)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm text-gray-600">Fecha de Generación:</span>
                  <span className="text-xs text-gray-500">{formatDate(cuota.created_at)}</span>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progreso de pago</span>
                    <span>{Math.round((cuota.monto_abonado / cuota.monto_total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(cuota.monto_abonado / cuota.monto_total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {cuota.monto_abonado > 0 && (
                <div className="card-footer">
                  <button 
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors duration-200 flex items-center space-x-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCuota(cuota);
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Ver historial de pagos</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment History Modal */}
      {selectedCuota && selectedCuota.monto_abonado > 0 && (
        <div className="modal-overlay" onClick={() => setSelectedCuota(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Historial de Pagos</h2>
              <button 
                className="modal-close"
                onClick={() => setSelectedCuota(null)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {formatMonth(selectedCuota.mes, selectedCuota.anio)}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Monto Total</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(selectedCuota.monto_total)}
                    </div>
                  </div>
                  <div className="bg-success-50 rounded-lg p-4">
                    <div className="text-sm text-success-600">Monto Abonado</div>
                    <div className="text-lg font-semibold text-success-700">
                      {formatCurrency(selectedCuota.monto_abonado)}
                    </div>
                  </div>
                  <div className={`rounded-lg p-4 ${selectedCuota.saldo_pendiente > 0 ? 'bg-warning-50' : 'bg-success-50'}`}>
                    <div className={`text-sm ${selectedCuota.saldo_pendiente > 0 ? 'text-warning-600' : 'text-success-600'}`}>
                      Saldo Pendiente
                    </div>
                    <div className={`text-lg font-semibold ${selectedCuota.saldo_pendiente > 0 ? 'text-warning-700' : 'text-success-700'}`}>
                      {formatCurrency(selectedCuota.saldo_pendiente)}
                    </div>
                  </div>
                </div>
              </div>

              {loadingPagos ? (
                <div className="flex items-center justify-center py-8">
                  <div className="loading-spinner"></div>
                </div>
              ) : pagos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No hay pagos registrados</p>
                </div>
              ) : (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Pagos Realizados</h4>
                  <div className="table-container">
                    <table className="table">
                      <thead className="table-header">
                        <tr>
                          <th className="table-header-cell">Fecha</th>
                          <th className="table-header-cell">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="table-body">
                        {pagos.map((pago) => (
                          <tr key={pago.id} className="table-row">
                            <td className="table-cell">{formatDate(pago.fecha_pago)}</td>
                            <td className="table-cell font-semibold">{formatCurrency(pago.monto)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setSelectedCuota(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisCuotas;
