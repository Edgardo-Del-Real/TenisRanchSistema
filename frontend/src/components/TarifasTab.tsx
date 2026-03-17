import React, { useState } from 'react';
import api from '../lib/api';
import { Tarifa, TipoTarifa } from '../types';

interface TarifasTabProps {
  tarifas: Tarifa[];
  editingTarifa: { tipo: TipoTarifa; valor: number } | null;
  setEditingTarifa: (tarifa: { tipo: TipoTarifa; valor: number } | null) => void;
  onUpdate: () => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
}

const TarifasTab: React.FC<TarifasTabProps> = ({
  tarifas,
  editingTarifa,
  setEditingTarifa,
  onUpdate,
  setError,
  setSuccess
}) => {
  const [loading, setLoading] = useState(false);

  const getTarifaLabel = (tipo: TipoTarifa): string => {
    switch (tipo) {
      case TipoTarifa.TURNO_NO_SOCIO:
        return 'Turno No Socio';
      case TipoTarifa.LUZ:
        return 'Luz';
      case TipoTarifa.CUOTA:
        return 'Cuota Mensual';
      default:
        return tipo;
    }
  };

  const handleEdit = (tarifa: Tarifa) => {
    setEditingTarifa({ tipo: tarifa.tipo, valor: tarifa.valor });
  };

  const handleSave = async () => {
    if (!editingTarifa) return;

    try {
      setLoading(true);
      setError(null);
      
      await api.put(`/tarifas/${editingTarifa.tipo}`, {
        valor: editingTarifa.valor
      });
      
      setSuccess('Tarifa actualizada correctamente');
      setEditingTarifa(null);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar la tarifa');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingTarifa(null);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Tarifas Actuales</h2>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {tarifas.map((tarifa) => (
            <li key={tarifa.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {getTarifaLabel(tarifa.tipo)}
                  </h3>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span>Valor actual: </span>
                    {editingTarifa?.tipo === tarifa.tipo ? (
                      <input
                        type="number"
                        value={editingTarifa.valor}
                        onChange={(e) => setEditingTarifa({
                          ...editingTarifa,
                          valor: parseFloat(e.target.value) || 0
                        })}
                        className="ml-2 px-2 py-1 border border-gray-300 rounded text-gray-900"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <span className="ml-2 font-semibold text-gray-900">
                        ${tarifa.valor.toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Vigente desde: {new Date(tarifa.vigente_desde).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  {editingTarifa?.tipo === tarifa.tipo ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {loading ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleEdit(tarifa)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Modificar
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {tarifas.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay tarifas configuradas
        </div>
      )}
    </div>
  );
};

export default TarifasTab;