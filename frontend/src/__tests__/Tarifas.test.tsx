import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Tarifas from '../pages/Tarifas';
import { AuthProvider } from '../contexts/AuthContext';
import { Rol, TipoTarifa } from '../types';
import api from '../lib/api';

// Mock the API
vi.mock('../lib/api');
const mockedApi = vi.mocked(api);

// Mock data
const mockTarifas = [
  {
    id: '1',
    tipo: TipoTarifa.TURNO_NO_SOCIO,
    valor: 15000,
    vigente_desde: '2024-01-01T00:00:00Z',
    modificado_por: 'admin'
  },
  {
    id: '2',
    tipo: TipoTarifa.LUZ,
    valor: 4000,
    vigente_desde: '2024-01-01T00:00:00Z',
    modificado_por: 'admin'
  },
  {
    id: '3',
    tipo: TipoTarifa.CUOTA,
    valor: 25000,
    vigente_desde: '2024-01-01T00:00:00Z',
    modificado_por: 'admin'
  }
];

const mockConfiguracion = {
  id: '1',
  apertura: '08:00:00',
  cierre: '22:00:00',
  luz_inicio: '18:30:00',
  luz_fin: '19:00:00',
  duracion_semana_min: 60,
  duracion_finde_min: 90,
  updated_at: '2024-01-01T00:00:00Z'
};

const mockAuthValue = {
  user: {
    id: '1',
    nombre: 'Admin',
    apellido: 'User',
    email: 'admin@example.com',
    telefono: '123456789',
    rol: Rol.ADMINISTRADOR,
    activo: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  updateUser: vi.fn()
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Tarifas Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.get.mockImplementation((url) => {
      if (url === '/tarifas') {
        return Promise.resolve({ data: mockTarifas });
      }
      if (url === '/configuracion') {
        return Promise.resolve({ data: mockConfiguracion });
      }
      if (url.startsWith('/tarifas/historial')) {
        return Promise.resolve({ data: mockTarifas });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
    mockedApi.put.mockResolvedValue({ data: {} });
  });

  it('renders the tarifas page with tabs', async () => {
    renderWithProviders(<Tarifas />);
    
    await waitFor(() => {
      expect(screen.getByText('Gestión de Tarifas y Configuración')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Tarifas Actuales' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Configuración del Club' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Historial de Tarifas' })).toBeInTheDocument();
    });
  });

  it('loads and displays current rates', async () => {
    renderWithProviders(<Tarifas />);
    
    await waitFor(() => {
      expect(screen.getByText('Turno No Socio')).toBeInTheDocument();
      expect(screen.getByText('Luz')).toBeInTheDocument();
      expect(screen.getByText('Cuota Mensual')).toBeInTheDocument();
      expect(screen.getByText('$15.000')).toBeInTheDocument();
      expect(screen.getByText('$4.000')).toBeInTheDocument();
      expect(screen.getByText('$25.000')).toBeInTheDocument();
    });
  });

  it('allows editing rates', async () => {
    renderWithProviders(<Tarifas />);
    
    await waitFor(() => {
      expect(screen.getByText('Turno No Socio')).toBeInTheDocument();
    });

    // Click modify button for first rate
    const modifyButtons = screen.getAllByText('Modificar');
    fireEvent.click(modifyButtons[0]);

    // Should show input field and save/cancel buttons
    expect(screen.getByDisplayValue('15000')).toBeInTheDocument();
    expect(screen.getByText('Guardar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('switches to configuration tab', async () => {
    renderWithProviders(<Tarifas />);
    
    await waitFor(() => {
      expect(screen.getByText('Gestión de Tarifas y Configuración')).toBeInTheDocument();
    });

    // Click configuration tab
    fireEvent.click(screen.getByRole('button', { name: 'Configuración del Club' }));

    await waitFor(() => {
      expect(screen.getByText('Horarios de Funcionamiento')).toBeInTheDocument();
      expect(screen.getByText('Franja de Iluminación')).toBeInTheDocument();
      expect(screen.getByText('Duración de Turnos')).toBeInTheDocument();
    });
  });

  it('switches to history tab and shows filters', async () => {
    renderWithProviders(<Tarifas />);
    
    await waitFor(() => {
      expect(screen.getByText('Gestión de Tarifas y Configuración')).toBeInTheDocument();
    });

    // Click history tab
    fireEvent.click(screen.getByRole('button', { name: 'Historial de Tarifas' }));

    await waitFor(() => {
      expect(screen.getByText('Filtros')).toBeInTheDocument();
      expect(screen.getByLabelText('Fecha Desde')).toBeInTheDocument();
      expect(screen.getByLabelText('Fecha Hasta')).toBeInTheDocument();
      expect(screen.getByLabelText('Monto Mínimo')).toBeInTheDocument();
      expect(screen.getByLabelText('Monto Máximo')).toBeInTheDocument();
    });
  });
});