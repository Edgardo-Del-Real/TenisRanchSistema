import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Tarifa, ConfiguracionClub, TipoTarifa } from '../types';
import TarifasTab from '../components/TarifasTab';
import ConfiguracionTab from '../components/ConfiguracionTab';
import HistorialTab from '../components/HistorialTab';

const Tarifas: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tarifas' | 'configuracion' | 'historial'>('tarifas');
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [configuracion, setConfiguracion] = useState<ConfiguracionClub | null>(null);
  const [historial, setHistorial] = useState<Tarifa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters for historial
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [montoMin, setMontoMin] = useState('');
  const [montoMax, setMontoMax] = useState('');

  // Form states
  const [editingTarifa, setEditingTarifa] = useState<{ tipo: TipoTarifa; valor: number } | null>(null);
  const [editingConfig, setEditingConfig] = useState(false);

  useEffect(() => {
    loadTarifas();
    loadConfiguracion();
  }, []);

  const loadTarifas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tarifas');
      setTarifas(response.data);
    } catch (err: any) {
      setError('Error al cargar las tarifas');
    } finally {
      setLoading(false);
    }
  };

  const loadConfiguracion = async () => {
    try {
      const response = await api.get('/configuracion');
      setConfiguracion(response.data);
    } catch (err: any) {
      setError('Error al cargar la configuración');
    }
  };

  const loadHistorial = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (fechaDesde) params.append('fecha_desde', fechaDesde);
      if (fechaHasta) params.append('fecha_hasta', fechaHasta);
      if (montoMin) params.append('monto_min', montoMin);
      if (montoMax) params.append('monto_max', montoMax);
      
      const response = await api.get(`/tarifas/historial?${params.toString()}`);
      setHistorial(response.data);
    } catch (err: any) {
      setError('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Gestión de Tarifas y Configuración</h1>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'tarifas', label: 'Tarifas Actuales' },
            { key: 'configuracion', label: 'Configuración del Club' },
            { key: 'historial', label: 'Historial de Tarifas' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'tarifas' && (
        <TarifasTab 
          tarifas={tarifas}
          editingTarifa={editingTarifa}
          setEditingTarifa={setEditingTarifa}
          onUpdate={loadTarifas}
          setError={setError}
          setSuccess={setSuccess}
        />
      )}
      
      {activeTab === 'configuracion' && (
        <ConfiguracionTab 
          configuracion={configuracion}
          editingConfig={editingConfig}
          setEditingConfig={setEditingConfig}
          onUpdate={loadConfiguracion}
          setError={setError}
          setSuccess={setSuccess}
        />
      )}
      
      {activeTab === 'historial' && (
        <HistorialTab 
          historial={historial}
          fechaDesde={fechaDesde}
          setFechaDesde={setFechaDesde}
          fechaHasta={fechaHasta}
          setFechaHasta={setFechaHasta}
          montoMin={montoMin}
          setMontoMin={setMontoMin}
          montoMax={montoMax}
          setMontoMax={setMontoMax}
          onLoad={loadHistorial}
          loading={loading}
        />
      )}
    </div>
  );
};

export default Tarifas;