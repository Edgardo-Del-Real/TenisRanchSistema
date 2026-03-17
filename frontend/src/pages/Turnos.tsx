import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Rol, EstadoCancha, EstadoTurno } from '../types';
import api from '../lib/api';
import { handleApiError } from '../lib/errorHandler';

interface Cancha {
  id: string;
  numero: number;
  estado: EstadoCancha;
}

interface Turno {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoTurno;
  requiere_luz: boolean;
  costo_turno: number;
  costo_luz: number;
  created_at: string;
  cancha: {
    id: string;
    numero: number;
    estado: EstadoCancha;
  };
  usuario?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: Rol;
  };
}

interface ConfiguracionClub {
  apertura: string;
  cierre: string;
  luz_inicio: string;
  luz_fin: string;
  duracion_semana_min: number;
  duracion_finde_min: number;
}

interface Tarifa {
  tipo: string;
  valor: number;
}

const Turnos: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'reservar' | 'vigentes' | 'historial'>('reservar');
  
  // Reservation state
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [configuracion, setConfiguracion] = useState<ConfiguracionClub | null>(null);
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [selectedCancha, setSelectedCancha] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reservationPreview, setReservationPreview] = useState<any>(null);
  
  // Turnos state
  const [turnosVigentes, setTurnosVigentes] = useState<Turno[]>([]);
  const [turnosHistorial, setTurnosHistorial] = useState<Turno[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'vigentes') {
      loadTurnosVigentes();
    } else if (activeTab === 'historial' && user?.rol === Rol.SOCIO) {
      loadTurnosHistorial();
    }
  }, [activeTab]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [canchasRes, configRes, tarifasRes] = await Promise.all([
        api.get('/canchas'),
        api.get('/configuracion'),
        api.get('/tarifas'),
      ]);
      
      setCanchas(canchasRes.data.filter((c: Cancha) => c.estado === EstadoCancha.DISPONIBLE));
      setConfiguracion(configRes.data);
      setTarifas(tarifasRes.data);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadTurnosVigentes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/turnos');
      setTurnosVigentes(response.data);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadTurnosHistorial = async () => {
    try {
      setLoading(true);
      const response = await api.get('/turnos/historial');
      setTurnosHistorial(response.data);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const calculateReservationPreview = () => {
    if (!selectedDate || !selectedTime || !configuracion || tarifas.length === 0) {
      return;
    }

    const dateTime = new Date(`${selectedDate}T${selectedTime}`);
    const dayOfWeek = dateTime.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const duration = isWeekend ? configuracion.duracion_finde_min : configuracion.duracion_semana_min;
    
    const endTime = new Date(dateTime.getTime() + duration * 60000);
    
    // Check if luz is required - compare time strings
    const timeStr = selectedTime + ':00';
    const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}:00`;
    const luzStart = configuracion.luz_inicio;
    const luzEnd = configuracion.luz_fin;
    
    // Check if turno overlaps with luz range
    const requiresLuz = (timeStr >= luzStart && timeStr < luzEnd) || 
                        (endTimeStr > luzStart && endTimeStr <= luzEnd) ||
                        (timeStr <= luzStart && endTimeStr >= luzEnd);
    
    const tarifaTurno = tarifas.find(t => t.tipo === 'turno_no_socio');
    const tarifaLuz = tarifas.find(t => t.tipo === 'luz');
    
    const costoTurno = tarifaTurno?.valor || 0;
    const costoLuz = requiresLuz ? (tarifaLuz?.valor || 0) : 0;
    
    setReservationPreview({
      fecha_inicio: dateTime.toISOString(),
      fecha_fin: endTime.toISOString(),
      duracion: duration,
      requiere_luz: requiresLuz,
      costo_turno: costoTurno,
      costo_luz: costoLuz,
      total: costoTurno + costoLuz,
    });
  };

  useEffect(() => {
    calculateReservationPreview();
  }, [selectedDate, selectedTime, configuracion, tarifas]);

  const handleReservar = async () => {
    if (!selectedCancha || !selectedDate || !selectedTime) {
      setError('Por favor complete todos los campos');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const fechaHoraInicio = `${selectedDate}T${selectedTime}`;
      
      await api.post('/turnos', {
        cancha_id: selectedCancha,
        fecha_hora_inicio: fechaHoraInicio,
      });

      setSuccess('¡Turno reservado exitosamente!');
      setSelectedCancha('');
      setSelectedDate('');
      setSelectedTime('');
      setReservationPreview(null);
      
      // Reload data
      setTimeout(() => {
        setSuccess(null);
        loadInitialData();
      }, 2000);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (turnoId: string) => {
    if (!window.confirm('¿Está seguro de que desea cancelar este turno?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await api.delete(`/turnos/${turnoId}`);
      
      setSuccess('Turno cancelado exitosamente');
      loadTurnosVigentes();
      
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    if (!configuracion) return [];
    
    const slots = [];
    const [startHour, startMin] = configuracion.apertura.split(':').map(Number);
    const [endHour, endMin] = configuracion.cierre.split(':').map(Number);
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push(timeStr);
      }
    }
    
    return slots;
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const canCancelTurno = (fechaInicio: string) => {
    const now = new Date();
    const inicio = new Date(fechaInicio);
    const diffMs = inicio.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours >= 1;
  };

  if (loading && !configuracion) {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Turnos</h1>
        <p className="text-gray-600">
          Reserva y administra tus turnos de tenis
        </p>
      </div>

      {/* Tabs */}
      <div className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'reservar' ? 'nav-tab-active' : 'nav-tab-inactive'}`}
          onClick={() => setActiveTab('reservar')}
        >
          Reservar Turno
        </button>
        <button
          className={`nav-tab ${activeTab === 'vigentes' ? 'nav-tab-active' : 'nav-tab-inactive'}`}
          onClick={() => setActiveTab('vigentes')}
        >
          Mis Turnos Vigentes
        </button>
        {user?.rol === Rol.SOCIO && (
          <button
            className={`nav-tab ${activeTab === 'historial' ? 'nav-tab-active' : 'nav-tab-inactive'}`}
            onClick={() => setActiveTab('historial')}
          >
            Historial
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-danger animate-slide-down">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success animate-slide-down">
          {success}
        </div>
      )}

      {/* Reservar Tab */}
      {activeTab === 'reservar' && (
        <div className="card animate-slide-up">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Nueva Reserva</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form Section */}
              <div className="space-y-6">
                <div className="form-group">
                  <label htmlFor="cancha" className="form-label">
                    Cancha
                  </label>
                  <select
                    id="cancha"
                    value={selectedCancha}
                    onChange={(e) => setSelectedCancha(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Seleccione una cancha</option>
                    {canchas.map((cancha) => (
                      <option key={cancha.id} value={cancha.id}>
                        Cancha {cancha.numero}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="fecha" className="form-label">
                    Fecha
                  </label>
                  <input
                    type="date"
                    id="fecha"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getMinDate()}
                    max={getMaxDate()}
                    className="form-input"
                  />
                  <p className="form-help">
                    Puede reservar hasta 1 día de anticipación
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="hora" className="form-label">
                    Hora
                  </label>
                  <select
                    id="hora"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Seleccione un horario</option>
                    {generateTimeSlots().map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview Section */}
              <div>
                {reservationPreview ? (
                  <div className="card bg-primary-50 border-primary-200">
                    <div className="card-header bg-primary-100 border-primary-200">
                      <h3 className="text-lg font-semibold text-primary-900">Resumen de la Reserva</h3>
                    </div>
                    <div className="card-body space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-primary-200 last:border-b-0">
                        <span className="text-primary-700">Duración:</span>
                        <strong className="text-primary-900">{reservationPreview.duracion} minutos</strong>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-primary-200 last:border-b-0">
                        <span className="text-primary-700">Costo del turno:</span>
                        <strong className="text-primary-900">{formatCurrency(reservationPreview.costo_turno)}</strong>
                      </div>
                      {reservationPreview.requiere_luz && (
                        <div className="flex justify-between items-center py-2 border-b border-primary-200 last:border-b-0">
                          <span className="text-warning-700 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4z"/>
                            </svg>
                            Cargo de luz:
                          </span>
                          <strong className="text-warning-900">{formatCurrency(reservationPreview.costo_luz)}</strong>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-3 border-t-2 border-primary-300 mt-4">
                        <span className="text-lg font-semibold text-primary-800">Total:</span>
                        <strong className="text-xl font-bold text-primary-900">{formatCurrency(reservationPreview.total)}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card bg-gray-50">
                    <div className="card-body text-center py-12">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-gray-500">
                        Complete los campos para ver el resumen
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleReservar}
                disabled={loading || !selectedCancha || !selectedDate || !selectedTime}
                className="btn btn-primary btn-lg"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="loading-spinner w-5 h-5"></div>
                    <span>Reservando...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Confirmar Reserva
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Turnos Vigentes Tab */}
      {activeTab === 'vigentes' && (
        <div className="animate-slide-up">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Mis Turnos Vigentes</h2>
          </div>
          
          {turnosVigentes.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a2 2 0 100-4 2 2 0 000 4zm0 0v4a2 2 0 002 2h6a2 2 0 002-2v-4" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No tiene turnos vigentes</p>
                <p className="text-gray-400 text-sm mt-2">Reserve un turno para verlo aquí</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {turnosVigentes.map((turno, index) => (
                <div key={turno.id} className="card hover:shadow-lg transition-all duration-200 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="card-header flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">🏟️ Cancha {turno.cancha.numero}</h3>
                    <span className="state-badge state-active">✓ Vigente</span>
                  </div>
                  <div className="card-body space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-sm text-gray-600">📅 Fecha y hora:</span>
                      <strong className="text-sm text-gray-900">{formatDateTime(turno.fecha_inicio)}</strong>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-sm text-gray-600">⏱️ Duración:</span>
                      <strong className="text-sm text-gray-900">
                        {Math.round((new Date(turno.fecha_fin).getTime() - new Date(turno.fecha_inicio).getTime()) / 60000)} min
                      </strong>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-sm text-gray-600">💰 Costo turno:</span>
                      <strong className="text-sm text-gray-900">{formatCurrency(turno.costo_turno)}</strong>
                    </div>
                    {turno.requiere_luz && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-sm text-warning-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4z"/>
                          </svg>
                          Cargo luz:
                        </span>
                        <strong className="text-sm text-warning-900">{formatCurrency(turno.costo_luz)}</strong>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-3 border-t-2 border-gray-200 mt-4">
                      <span className="font-semibold text-gray-700">Total:</span>
                      <strong className="text-lg font-bold text-gray-900">{formatCurrency(turno.costo_turno + turno.costo_luz)}</strong>
                    </div>
                  </div>
                  <div className="border-t-2 border-gray-100 pt-4 flex gap-2">
                    {canCancelTurno(turno.fecha_inicio) ? (
                      <button
                        onClick={() => handleCancelar(turno.id)}
                        className="btn-sub btn-sub-danger flex-1"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="loading-spinner w-3 h-3"></div>
                            <span>Cancelando...</span>
                          </div>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancelar Turno
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex-1 p-3 bg-gradient-to-r from-warning-50 to-warning-100 border-l-4 border-warning-400 rounded-md">
                        <p className="text-xs font-bold text-warning-900">⏰ No se puede cancelar</p>
                        <p className="text-xs text-warning-800">(falta menos de 1 hora)</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Historial Tab (Socio only) */}
      {activeTab === 'historial' && user?.rol === Rol.SOCIO && (
        <div className="animate-slide-up">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Historial de Turnos</h2>
          </div>
          
          {turnosHistorial.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No hay turnos en el historial</p>
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Fecha y Hora</th>
                    <th className="table-header-cell">Cancha</th>
                    <th className="table-header-cell">Duración</th>
                    <th className="table-header-cell">Luz</th>
                    <th className="table-header-cell">Costo</th>
                    <th className="table-header-cell">Estado</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {turnosHistorial.map((turno) => (
                    <tr key={turno.id} className="table-row">
                      <td className="table-cell font-medium">{formatDateTime(turno.fecha_inicio)}</td>
                      <td className="table-cell">Cancha {turno.cancha.numero}</td>
                      <td className="table-cell">
                        {Math.round((new Date(turno.fecha_fin).getTime() - new Date(turno.fecha_inicio).getTime()) / 60000)} min
                      </td>
                      <td className="table-cell">
                        {turno.requiere_luz ? (
                          <span className="flex items-center text-warning-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4z"/>
                            </svg>
                            Sí
                          </span>
                        ) : (
                          'No'
                        )}
                      </td>
                      <td className="table-cell font-semibold">{formatCurrency(turno.costo_turno + turno.costo_luz)}</td>
                      <td className="table-cell">
                        <span className={`badge ${turno.estado === EstadoTurno.ACTIVO ? 'badge-success' : 'badge-danger'}`}>
                          {turno.estado === EstadoTurno.ACTIVO ? 'Completado' : 'Cancelado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Turnos;
