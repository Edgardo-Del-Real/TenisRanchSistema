import React, { useState } from 'react';
import { EstadoCuota } from '../types';
import api from '../lib/api';

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

interface PaymentModalProps {
  cuota: CuotaListItem;
  onClose: () => void;
  onPaymentRegistered: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  cuota,
  onClose,
  onPaymentRegistered,
}) => {
  const [monto, setMonto] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const montoNumerico = parseFloat(monto);
    
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      setError('El monto debe ser un número válido mayor a 0');
      return;
    }

    if (montoNumerico > cuota.saldo_pendiente) {
      setError('El monto no puede ser mayor al saldo pendiente');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await api.post(`/cuotas/${cuota.id}/pagos`, {
        monto: montoNumerico,
      });

      onPaymentRegistered();
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 
        err.response?.data?.message || 
        'Error al registrar el pago'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePayTotal = () => {
    setMonto(cuota.saldo_pendiente.toString());
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Registrar Pago de Cuota</h2>
          <button className="modal-close" onClick={onClose}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Cuota Information */}
          <div className="card bg-gray-50 mb-6">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Información de la Cuota</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <span className="text-sm font-medium text-gray-600">Socio:</span>
                  <span className="text-sm text-gray-900">{cuota.socio.nombre} {cuota.socio.apellido}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <span className="text-sm font-medium text-gray-600">Período:</span>
                  <span className="text-sm text-gray-900">{formatMonth(cuota.mes, cuota.anio)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <span className="text-sm font-medium text-gray-600">Monto Total:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(cuota.monto_total)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <span className="text-sm font-medium text-gray-600">Monto Abonado:</span>
                  <span className="text-sm font-semibold text-success-600">{formatCurrency(cuota.monto_abonado)}</span>
                </div>
              </div>
              <div className="mt-4 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-warning-800">Saldo Pendiente:</span>
                  <span className="text-lg font-bold text-warning-900">
                    {formatCurrency(cuota.saldo_pendiente)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label htmlFor="monto" className="form-label">
                Monto a Pagar
              </label>
              <div className="flex space-x-3">
                <div className="flex-1">
                  <input
                    type="number"
                    id="monto"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="Ingrese el monto"
                    min="0.01"
                    max={cuota.saldo_pendiente}
                    step="0.01"
                    required
                    className="form-input"
                  />
                </div>
                <button
                  type="button"
                  onClick={handlePayTotal}
                  className="btn btn-secondary whitespace-nowrap"
                >
                  Pagar Total
                </button>
              </div>
              <p className="form-help">
                Máximo: {formatCurrency(cuota.saldo_pendiente)}
              </p>
            </div>

            {error && (
              <div className="alert alert-danger animate-slide-down">
                {error}
              </div>
            )}
          </form>
        </div>

        <div className="modal-footer">
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
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="loading-spinner w-4 h-4"></div>
                <span>Registrando...</span>
              </div>
            ) : (
              'Registrar Pago'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;