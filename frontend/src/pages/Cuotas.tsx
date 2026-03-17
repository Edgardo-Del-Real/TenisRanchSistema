import React, { useState, useEffect } from 'react';
import { EstadoCuota } from '../types';
import api from '../lib/api';
import { handleApiError } from '../lib/errorHandler';
import PaymentModal from '../components/PaymentModal';
import GenerarCuotasModal from '../components/GenerarCuotasModal';

interface CuotaListItem {
  id: string;
  socio: {
    nombre: string;
    apellido: string;
  };
  mes: number;
  anio: number;
  monto_total: number;
  monto_abonado: number;
  saldo_pendiente: number;
  estado: EstadoCuota;
  created_at: string;
}

interface CuotasFilters {
  nombre?: string;
  apellido?: string;
  estado?: EstadoCuota;
  fechaDesde?: string;
  fechaHasta?: string;
}

const Cuotas: React.FC = () => {
  const [cuotas, setCuotas] = useState<CuotaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CuotasFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuota, setSelectedCuota] = useState<CuotaListItem | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isGenerarCuotasModalOpen, setIsGenerarCuotasModalOpen] = useState(false);

  const fetchCuotas = async () => {
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
      if (filters.estado) {
        params.append('estado', filters.estado);
      }
      if (filters.fechaDesde) {
        params.append('fechaDesde', filters.fechaDesde);
      }
      if (filters.fechaHasta) {
        params.append('fechaHasta', filters.fechaHasta);
      }

      const response = await api.get(`/cuotas?${params.toString()}`);
      setCuotas(response.data);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuotas();
  }, [filters, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCuotas();
  };

  const handleFilterChange = (key: keyof CuotasFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const handleRegisterPayment = (cuota: CuotaListItem) => {
    setSelectedCuota(cuota);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentRegistered = () => {
    setIsPaymentModalOpen(false);
    setSelectedCuota(null);
    fetchCuotas();
  };

  const handleCuotasGenerated = () => {
    setIsGenerarCuotasModalOpen(false);
    fetchCuotas();
  };

  const getEstadoBadgeClass = (estado: EstadoCuota) => {
    switch (estado) {
      case EstadoCuota.PENDIENTE:
        return 'badge badge-pending';
      case EstadoCuota.PARCIAL:
        return 'badge badge-partial';
      case EstadoCuota.PAGADA:
        return 'badge badge-paid';
      default:
        return 'badge';
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

  if (loading) {
    return <div className="loading">Cargando cuotas...</div>;
  }

  return (
    <div className="cuotas-page">
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Gestión de Cuotas</h1>
            <p className="text-gray-600">
              Administra cuotas de socios y registros de pago
            </p>
          </div>
          <button
            onClick={() => setIsGenerarCuotasModalOpen(true)}
            className="mt-4 sm:mt-0 btn btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generar Cuotas del Mes
          </button>
        </div>

        {/* Search and Filters */}
        <div className="card animate-slide-up">
          <div className="card-body">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Buscar por nombre y/o apellido del socio..."
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
                    value={filters.estado || ''}
                    onChange={(e) => handleFilterChange('estado', e.target.value)}
                    className="form-select"
                  >
                    <option value="">Todos</option>
                    <option value={EstadoCuota.PENDIENTE}>Pendiente</option>
                    <option value={EstadoCuota.PARCIAL}>Parcialmente Pagada</option>
                    <option value={EstadoCuota.PAGADA}>Pagada</option>
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label htmlFor="fecha-desde" className="form-label">
                    Desde
                  </label>
                  <input
                    type="date"
                    id="fecha-desde"
                    value={filters.fechaDesde || ''}
                    onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group flex-1">
                  <label htmlFor="fecha-hasta" className="form-label">
                    Hasta
                  </label>
                  <input
                    type="date"
                    id="fecha-hasta"
                    value={filters.fechaHasta || ''}
                    onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilters({});
                      setSearchTerm('');
                    }}
                    className="btn btn-secondary whitespace-nowrap"
                  >
                    Limpiar
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

      {/* Cuotas Table */}
      <div className="table-container">
        <table className="cuotas-table">
          <thead>
            <tr>
              <th>Socio</th>
              <th>Período</th>
              <th>Monto Total</th>
              <th>Monto Abonado</th>
              <th>Saldo Pendiente</th>
              <th>Estado</th>
              <th>Fecha Generación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cuotas.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-data">
                  No se encontraron cuotas
                </td>
              </tr>
            ) : (
              cuotas.map((cuota) => (
                <tr key={cuota.id}>
                  <td>{cuota.socio.nombre} {cuota.socio.apellido}</td>
                  <td>{formatMonth(cuota.mes, cuota.anio)}</td>
                  <td>{formatCurrency(cuota.monto_total)}</td>
                  <td>{formatCurrency(cuota.monto_abonado)}</td>
                  <td>{formatCurrency(cuota.saldo_pendiente)}</td>
                  <td>
                    <span className={getEstadoBadgeClass(cuota.estado)}>
                      {getEstadoLabel(cuota.estado)}
                    </span>
                  </td>
                  <td>
                    {new Date(cuota.created_at).toLocaleDateString('es-AR')}
                  </td>
                  <td>
                    <div className="actions-cell">
                      {cuota.estado !== EstadoCuota.PAGADA && (
                        <button
                          onClick={() => handleRegisterPayment(cuota)}
                          className="btn btn-payment"
                          title="Registrar pago"
                        >
                          Registrar Pago
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

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedCuota && (
        <PaymentModal
          cuota={selectedCuota}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedCuota(null);
          }}
          onPaymentRegistered={handlePaymentRegistered}
        />
      )}

      {/* Generar Cuotas Modal */}
      {isGenerarCuotasModalOpen && (
        <GenerarCuotasModal
          isOpen={isGenerarCuotasModalOpen}
          onClose={() => setIsGenerarCuotasModalOpen(false)}
          onSuccess={handleCuotasGenerated}
        />
      )}
      </div>
    </div>
  );
};

export default Cuotas;