import React, { useState } from 'react';
import api from '../lib/api';
import { handleApiError } from '../lib/errorHandler';

interface GenerarCuotasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GenerarCuotasModal: React.FC<GenerarCuotasModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [monto, setMonto] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!monto || parseFloat(monto) <= 0) {
      alert('Por favor ingrese un monto válido');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/cuotas/generar', {
        monto: parseFloat(monto),
      });

      alert(response.data.message);
      onSuccess();
      onClose();
      setMonto('');
    } catch (error) {
      const errorMessage = handleApiError(error);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMonto('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Generar Cuotas Mensuales</h2>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="modal-description">
              Esta acción generará cuotas para todos los socios activos del mes actual.
              Solo se crearán cuotas para socios que no tengan una cuota generada este mes.
            </p>

            <div className="form-group">
              <label htmlFor="monto">Monto de la cuota:</label>
              <input
                type="number"
                id="monto"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="Ingrese el monto de la cuota"
                min="1"
                step="0.01"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={handleClose}
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
              {loading ? 'Generando...' : 'Generar Cuotas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerarCuotasModal;