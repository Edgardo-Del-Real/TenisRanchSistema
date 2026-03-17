import React, { useState, useEffect } from 'react';
import { EstadisticasGenerales, EstadisticasFinancieras, FiltroEstadisticas } from '../types';
import api from '../lib/api';
import { handleApiError } from '../lib/errorHandler';

const Estadisticas: React.FC = () => {
  const [estadisticasGenerales, setEstadisticasGenerales] = useState<EstadisticasGenerales | null>(null);
  const [estadisticasFinancieras, setEstadisticasFinancieras] = useState<EstadisticasFinancieras | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltroEstadisticas>({});

  const fetchEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filtros.fechaInicio) {
        params.append('fechaInicio', filtros.fechaInicio);
      }
      if (filtros.fechaFin) {
        params.append('fechaFin', filtros.fechaFin);
      }

      const [generalesResponse, financierasResponse] = await Promise.all([
        api.get(`/estadisticas/generales?${params.toString()}`),
        api.get(`/estadisticas/financieras?${params.toString()}`)
      ]);

      setEstadisticasGenerales(generalesResponse.data);
      setEstadisticasFinancieras(financierasResponse.data);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstadisticas();
  }, [filtros]);

  const handleFiltroChange = (campo: keyof FiltroEstadisticas, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor || undefined
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({});
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-vh-100">
        <div className="loading-spinner"></div>
        <span className="ml-4 font-bold text-slate-600">Analizando datos del club...</span>
      </div>
    );
  }

  return (
    <div className="estadisticas-page space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 leading-none mb-2">📊 Panel de Estadísticas</h1>
          <p className="text-slate-500 font-medium">Visualización detallada del rendimiento y finanzas del club</p>
        </div>

        {/* Filtros de período */}
        <div className="card !mb-0 shadow-sm border-slate-200">
          <div className="p-4 flex flex-wrap items-end gap-4">
            <div className="form-group mb-0">
              <label htmlFor="fechaInicio" className="form-label !mb-1 text-[10px]">Desde</label>
              <input
                type="date"
                id="fechaInicio"
                value={filtros.fechaInicio || ''}
                onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
                className="form-input !py-1.5 !text-sm"
              />
            </div>
            <div className="form-group mb-0">
              <label htmlFor="fechaFin" className="form-label !mb-1 text-[10px]">Hasta</label>
              <input
                type="date"
                id="fechaFin"
                value={filtros.fechaFin || ''}
                onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
                className="form-input !py-1.5 !text-sm"
              />
            </div>
            <button
              onClick={limpiarFiltros}
              className="btn btn-secondary !py-2 !px-4 text-xs h-[38px]"
              type="button"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger animate-shake">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {estadisticasGenerales && estadisticasFinancieras && (
        <div className="space-y-8 pb-10">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="stat-card bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm hover:border-green-500 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">👥</div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">General</span>
              </div>
              <h3 className="text-slate-500 text-xs font-bold uppercase mb-1">Socios Activos</h3>
              <div className="text-3xl font-black text-slate-900">{estadisticasGenerales.totalSociosActivos}</div>
            </div>

            <div className="stat-card bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm hover:border-blue-500 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">🎾</div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Actividad</span>
              </div>
              <h3 className="text-slate-500 text-xs font-bold uppercase mb-1">Total Turnos</h3>
              <div className="text-3xl font-black text-slate-900">{estadisticasGenerales.totalTurnos}</div>
            </div>

            <div className="stat-card bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm hover:border-emerald-500 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">💰</div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Finanzas</span>
              </div>
              <h3 className="text-slate-500 text-xs font-bold uppercase mb-1">Ingresos Cuotas</h3>
              <div className="text-2xl font-black text-emerald-600 truncate">{formatCurrency(estadisticasFinancieras.recaudacionCuotas)}</div>
            </div>

            <div className="stat-card bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm hover:border-amber-500 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl">⚡</div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Consumo</span>
              </div>
              <h3 className="text-slate-500 text-xs font-bold uppercase mb-1">Cargos por Luz</h3>
              <div className="text-2xl font-black text-amber-600 truncate">{formatCurrency(estadisticasFinancieras.cargosLuz)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Canchas Mas Utilizadas */}
            <div className="lg:col-span-1 card shadow-lg border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-black text-slate-800 flex items-center">
                  <span className="mr-2">🏆</span> Ranking de Canchas
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {estadisticasGenerales.canchasMasUtilizadas.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 italic">No hay datos disponibles</div>
                  ) : (
                    estadisticasGenerales.canchasMasUtilizadas.map((cancha, index) => (
                      <div key={cancha.numero} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                          index === 0 ? 'bg-yellow-400 text-white' : 
                          index === 1 ? 'bg-slate-300 text-slate-700' : 
                          'bg-orange-200 text-orange-800'
                        }`}>
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-bold text-slate-700">Cancha {cancha.numero}</span>
                            <span className="text-xs font-black text-slate-500">{cancha.cantidad} turnos</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-green-500 h-full rounded-full transition-all duration-1000" 
                              style={{ width: `${(cancha.cantidad / estadisticasGenerales.totalTurnos) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Horas Pico */}
            <div className="lg:col-span-1 card shadow-lg border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-black text-slate-800 flex items-center">
                  <span className="mr-2">⏰</span> Horarios de Mayor Uso
                </h3>
              </div>
              <div className="p-0 table-container border-none !shadow-none">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell !py-3 !text-[10px]">Hora</th>
                      <th className="table-header-cell !py-3 !text-[10px]">Utilización</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {estadisticasGenerales.horasPico.slice(0, 6).map((hora) => (
                      <tr key={hora.hora} className="table-row">
                        <td className="table-cell !py-3 text-sm font-black">{formatHour(hora.hora)}</td>
                        <td className="table-cell !py-3">
                          <div className="flex items-center">
                            <span className="text-xs font-bold text-slate-600 mr-2 w-8">{hora.cantidad}</span>
                            <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden min-w-[60px]">
                              <div 
                                className="bg-blue-500 h-full transition-all duration-1000" 
                                style={{ width: `${(hora.cantidad / Math.max(...estadisticasGenerales.horasPico.map(h => h.cantidad))) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumen Financiero Consolidado */}
            <div className="lg:col-span-1">
              <div className="card shadow-2xl border-none bg-slate-900 text-white overflow-hidden h-full">
                <div className="p-6 bg-slate-800/50">
                  <h3 className="text-xl font-black flex items-center">
                    <span className="mr-2">⚖️</span> Balance Consolidado
                  </h3>
                </div>
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-center group">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Total Ingresos</span>
                    <span className="text-xl font-black text-green-400 transition-all group-hover:scale-110">
                      {formatCurrency(
                        estadisticasFinancieras.recaudacionCuotas + 
                        estadisticasFinancieras.recaudacionTurnosNoSocio + 
                        estadisticasFinancieras.cargosLuz
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Total Gastos (Luz)</span>
                    <span className="text-xl font-black text-red-400 transition-all group-hover:scale-110">
                      -{formatCurrency(estadisticasFinancieras.pagosLuz)}
                    </span>
                  </div>
                  <div className="h-px bg-slate-700 w-full my-4"></div>
                  <div className="pt-2">
                    <div className="text-slate-400 font-bold uppercase text-[11px] tracking-[0.2em] mb-2">Neto Disponible</div>
                    <div className="text-5xl font-black text-white bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent">
                      {formatCurrency(
                        estadisticasFinancieras.recaudacionCuotas + 
                        estadisticasFinancieras.recaudacionTurnosNoSocio + 
                        estadisticasFinancieras.cargosLuz - 
                        estadisticasFinancieras.pagosLuz
                      )}
                    </div>
                  </div>

                  <div className="pt-6 grid grid-cols-2 gap-4">
                    <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                      <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Eficiencia Luz</div>
                      <div className="text-sm font-bold text-blue-400">
                        {estadisticasFinancieras.pagosLuz > 0 
                          ? `${Math.round((estadisticasFinancieras.cargosLuz / estadisticasFinancieras.pagosLuz) * 100)}%`
                          : '100%'}
                      </div>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                      <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Margen Neto</div>
                      <div className="text-sm font-bold text-green-400">
                        {Math.round(((estadisticasFinancieras.recaudacionCuotas + estadisticasFinancieras.recaudacionTurnosNoSocio + estadisticasFinancieras.cargosLuz - estadisticasFinancieras.pagosLuz) / (estadisticasFinancieras.recaudacionCuotas + estadisticasFinancieras.recaudacionTurnosNoSocio + estadisticasFinancieras.cargosLuz)) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Estadisticas;