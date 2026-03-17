import React, { useState } from 'react';
import api from '../lib/api';
import { ConfiguracionClub } from '../types';

interface ConfiguracionTabProps {
  configuracion: ConfiguracionClub | null;
  editingConfig: boolean;
  setEditingConfig: (editing: boolean) => void;
  onUpdate: () => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
}

const ConfiguracionTab: React.FC<ConfiguracionTabProps> = ({
  configuracion,
  editingConfig,
  setEditingConfig,
  onUpdate,
  setError,
  setSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    apertura: '',
    cierre: '',
    luz_inicio: '',
    luz_fin: '',
    duracion_semana_min: 60,
    duracion_finde_min: 90
  });

  React.useEffect(() => {
    if (configuracion && editingConfig) {
      setFormData({
        apertura: configuracion.apertura,
        cierre: configuracion.cierre,
        luz_inicio: configuracion.luz_inicio,
        luz_fin: configuracion.luz_fin,
        duracion_semana_min: configuracion.duracion_semana_min,
        duracion_finde_min: configuracion.duracion_finde_min
      });
    }
  }, [configuracion, editingConfig]);

  const handleEdit = () => {
    if (configuracion) {
      setFormData({
        apertura: configuracion.apertura,
        cierre: configuracion.cierre,
        luz_inicio: configuracion.luz_inicio,
        luz_fin: configuracion.luz_fin,
        duracion_semana_min: configuracion.duracion_semana_min,
        duracion_finde_min: configuracion.duracion_finde_min
      });
      setEditingConfig(true);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await api.put('/configuracion', formData);
      
      setSuccess('Configuración actualizada correctamente');
      setEditingConfig(false);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingConfig(false);
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Remove seconds for display
  };

  if (!configuracion) {
    return (
      <div className="text-center py-8 text-gray-500">
        Cargando configuración...
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Configuración del Club</h2>
        {!editingConfig && (
          <button
            onClick={handleEdit}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Modificar Configuración
          </button>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Horarios de Funcionamiento */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Horarios de Funcionamiento</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Apertura</label>
                {editingConfig ? (
                  <input
                    type="time"
                    value={formatTime(formData.apertura)}
                    onChange={(e) => setFormData({
                      ...formData,
                      apertura: e.target.value + ':00'
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{formatTime(configuracion.apertura)}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Cierre</label>
                {editingConfig ? (
                  <input
                    type="time"
                    value={formatTime(formData.cierre)}
                    onChange={(e) => setFormData({
                      ...formData,
                      cierre: e.target.value + ':00'
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{formatTime(configuracion.cierre)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Franja de Luz */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Franja de Iluminación</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Inicio de Luz</label>
                {editingConfig ? (
                  <input
                    type="time"
                    value={formatTime(formData.luz_inicio)}
                    onChange={(e) => setFormData({
                      ...formData,
                      luz_inicio: e.target.value + ':00'
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{formatTime(configuracion.luz_inicio)}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Fin de Luz</label>
                {editingConfig ? (
                  <input
                    type="time"
                    value={formatTime(formData.luz_fin)}
                    onChange={(e) => setFormData({
                      ...formData,
                      luz_fin: e.target.value + ':00'
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{formatTime(configuracion.luz_fin)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Duración de Turnos */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Duración de Turnos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Días de Semana (minutos)</label>
                {editingConfig ? (
                  <input
                    type="number"
                    value={formData.duracion_semana_min}
                    onChange={(e) => setFormData({
                      ...formData,
                      duracion_semana_min: parseInt(e.target.value) || 60
                    })}
                    min="1"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{configuracion.duracion_semana_min} minutos</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Fines de Semana (minutos)</label>
                {editingConfig ? (
                  <input
                    type="number"
                    value={formData.duracion_finde_min}
                    onChange={(e) => setFormData({
                      ...formData,
                      duracion_finde_min: parseInt(e.target.value) || 90
                    })}
                    min="1"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{configuracion.duracion_finde_min} minutos</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {editingConfig && (
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          Última actualización: {new Date(configuracion.updated_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionTab;