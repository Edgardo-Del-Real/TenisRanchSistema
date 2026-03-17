import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Estadisticas from '../pages/Estadisticas';
import api from '../lib/api';

// Mock the API
vi.mock('../lib/api');
const mockedApi = vi.mocked(api);

const mockEstadisticasGenerales = {
  totalSociosActivos: 25,
  totalTurnos: 150,
  canchasMasUtilizadas: [
    { numero: 1, cantidad: 60 },
    { numero: 2, cantidad: 50 },
    { numero: 3, cantidad: 40 }
  ],
  horasPico: [
    { hora: 19, cantidad: 30 },
    { hora: 20, cantidad: 25 },
    { hora: 18, cantidad: 20 }
  ]
};

const mockEstadisticasFinancieras = {
  recaudacionCuotas: 500000,
  recaudacionTurnosNoSocio: 150000,
  cargosLuz: 80000,
  pagosLuz: 120000
};

describe('Estadisticas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders statistics page with data', async () => {
    mockedApi.get.mockImplementation((url) => {
      if (url.includes('/estadisticas/generales')) {
        return Promise.resolve({ data: mockEstadisticasGenerales });
      }
      if (url.includes('/estadisticas/financieras')) {
        return Promise.resolve({ data: mockEstadisticasFinancieras });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<Estadisticas />);

    // Check if loading state is shown initially
    expect(screen.getByText('Cargando estadísticas...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Estadísticas del Club')).toBeInTheDocument();
    });

    // Check general statistics
    expect(screen.getByText('Estadísticas Generales')).toBeInTheDocument();
    expect(screen.getByText('Socios Activos')).toBeInTheDocument();
    expect(screen.getByText('Total de Turnos')).toBeInTheDocument();

    // Check financial statistics
    expect(screen.getByText('Estadísticas Financieras')).toBeInTheDocument();
    expect(screen.getByText('Recaudación por Cuotas')).toBeInTheDocument();
    expect(screen.getByText('Recaudación por Turnos No Socios')).toBeInTheDocument();

    // Check tables
    expect(screen.getByText('Canchas Más Utilizadas')).toBeInTheDocument();
    expect(screen.getByText('Cancha 1')).toBeInTheDocument();
    expect(screen.getByText('Horas Pico de Uso')).toBeInTheDocument();
    expect(screen.getByText('19:00')).toBeInTheDocument();

    // Check financial summary
    expect(screen.getByText('Resumen Financiero')).toBeInTheDocument();
    expect(screen.getByText('Total Ingresos:')).toBeInTheDocument();
    expect(screen.getByText('Balance Neto:')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockedApi.get.mockRejectedValue(new Error('API Error'));

    render(<Estadisticas />);

    await waitFor(() => {
      expect(screen.getByText('Error al cargar estadísticas')).toBeInTheDocument();
    });
  });

  it('shows empty state when no data is available', async () => {
    const emptyGenerales = {
      totalSociosActivos: 0,
      totalTurnos: 0,
      canchasMasUtilizadas: [],
      horasPico: []
    };

    const emptyFinancieras = {
      recaudacionCuotas: 0,
      recaudacionTurnosNoSocio: 0,
      cargosLuz: 0,
      pagosLuz: 0
    };

    mockedApi.get.mockImplementation((url) => {
      if (url.includes('/estadisticas/generales')) {
        return Promise.resolve({ data: emptyGenerales });
      }
      if (url.includes('/estadisticas/financieras')) {
        return Promise.resolve({ data: emptyFinancieras });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<Estadisticas />);

    await waitFor(() => {
      expect(screen.getByText('Estadísticas del Club')).toBeInTheDocument();
    });

    // Check that empty states are shown
    expect(screen.getAllByText('No hay datos disponibles')).toHaveLength(2);
    expect(screen.getByText('Socios Activos')).toBeInTheDocument();
  });
});