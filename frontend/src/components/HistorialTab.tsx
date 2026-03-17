import React from 'react';
import { Tarifa, TipoTarifa } from '../types';

interface HistorialTabProps {
  historial: Tarifa[];
  fechaDesde: string;
  setFechaDesde: (fecha: string) => void;
  fechaHasta: string;
  setFechaHasta: (fecha: string) => void;
  montoMin: string;
  setMontoMin: (monto: string) => void;
  montoMax: string;
  setMontoMax: (monto: string) => void;
  onLoad: () => void;
  loading: boolean;
}

const HistorialTab: React.FC<HistorialTabProps> = ({
  historial,
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  montoMin,
  setMontoMin,
  montoMax,
  setMontoMax,
  onLoad,
  loading
}) => {
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

  const handleClearFilters = () => {
    setFechaDesde('');
    setFechaHasta('');
    setMontoMin('');
    setMontoMax('');
  };

  React.useEffect(() => {
    onLoad();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Historial de Tarifas</h2>
      
      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-medium mb-3">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="fechaDesde" className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
            <input
              id="fechaDesde"
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label htmlFor="fechaHasta" className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
            <input
              id="fechaHasta"
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label htmlFor="montoMin" className="block text-sm font-medium text-gray-700 mb-1">Monto Mínimo</label>
            <input
              id="montoMin"
              type="number"
              value={montoMin}
              onChange={(e) => setMontoMin(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label htmlFor="montoMax" className="block text-sm font-medium text-gray-700 mb-1">Monto Máximo</label>
            <input
              id="montoMax"
              type="number"
              value={montoMax}
              onChange={(e) => setMontoMax(e.target.value)}
              placeholder="Sin límite"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <div className="mt-4 flex space-x-3">
          <button
            onClick={onLoad}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
          <button
            onClick={handleClearFilters}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">
          Cargando historial...
        </div>
      ) : historial.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo de Tarifa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Vigencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modificado Por
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historial.map((tarifa) => (
                  <tr key={tarifa.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getTarifaLabel(tarifa.tipo)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${tarifa.valor.toLocaleString('es-AR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(tarifa.vigente_desde).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {tarifa.modificado_por_usuario 
                          ? `${tarifa.modificado_por_usuario.nombre} ${tarifa.modificado_por_usuario.apellido}`
                          : tarifa.modificado_por || 'Sistema'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No se encontraron registros con los filtros aplicados
        </div>
      )}
      
      {historial.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Se encontraron {historial.length} registro(s)
        </div>
      )}
    </div>
  );
};

export default HistorialTab;