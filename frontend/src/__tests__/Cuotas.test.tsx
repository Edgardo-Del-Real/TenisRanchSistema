import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Cuotas from '../pages/Cuotas';
import { AuthProvider } from '../contexts/AuthContext';
import { Rol, EstadoCuota } from '../types';
import api from '../lib/api';

// Mock the API
jest.mock('../lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock data
const mockCuotas = [
  {
    id: '1',
    socio: {
      nombre: 'Juan',
      apellido: 'Pérez',
    },
    mes: 3,
    anio: 2024,
    monto_total: 15000,
    monto_abonado: 5000,
    saldo_pendiente: 10000,
    estado: EstadoCuota.PARCIAL,
    created_at: '2024-03-01T00:00:00Z',
  },
  {
    id: '2',
    socio: {
      nombre: 'María',
      apellido: 'García',
    },
    mes: 3,
    anio: 2024,
    monto_total: 15000,
    monto_abonado: 0,
    saldo_pendiente: 15000,
    estado: EstadoCuota.PENDIENTE,
    created_at: '2024-03-01T00:00:00Z',
  },
];

const mockAuthValue = {
  user: {
    id: '1',
    nombre: 'Admin',
    apellido: 'User',
    email: 'admin@example.com',
    telefono: '123456789',
    rol: Rol.ADMINISTRADOR,
    activo: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider value={mockAuthValue as any}>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Cuotas Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.get.mockResolvedValue({ data: mockCuotas });
  });

  it('renders the cuotas page with title', async () => {
    renderWithProviders(<Cuotas />);

    await waitFor(() => {
      expect(screen.getByText('Gestión de Cuotas')).toBeInTheDocument();
    });
  });

  it('loads and displays cuotas', async () => {
    renderWithProviders(<Cuotas />);

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María García')).toBeInTheDocument();
      expect(screen.getByText('Marzo 2024')).toBeInTheDocument();
    });
  });

  it('displays search and filter controls', async () => {
    renderWithProviders(<Cuotas />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar por nombre y/o apellido del socio...')).toBeInTheDocument();
      expect(screen.getByLabelText('Estado:')).toBeInTheDocument();
      expect(screen.getByLabelText('Fecha Desde:')).toBeInTheDocument();
      expect(screen.getByLabelText('Fecha Hasta:')).toBeInTheDocument();
      expect(screen.getByText('Limpiar Filtros')).toBeInTheDocument();
    });
  });

  it('shows register payment button for unpaid cuotas', async () => {
    renderWithProviders(<Cuotas />);

    await waitFor(() => {
      const paymentButtons = screen.getAllByText('Registrar Pago');
      expect(paymentButtons).toHaveLength(2); // Both cuotas are not fully paid
    });
  });

  it('filters cuotas by search term', async () => {
    renderWithProviders(<Cuotas />);

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar por nombre y/o apellido del socio...');
    fireEvent.change(searchInput, { target: { value: 'Juan' } });
    fireEvent.click(screen.getByText('Buscar'));

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith('/cuotas?nombre=Juan');
    });
  });

  it('filters cuotas by status', async () => {
    renderWithProviders(<Cuotas />);

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    const statusFilter = screen.getByLabelText('Estado:');
    fireEvent.change(statusFilter, { target: { value: EstadoCuota.PENDIENTE } });

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith(`/cuotas?estado=${EstadoCuota.PENDIENTE}`);
    });
  });

  it('has clear filters functionality', async () => {
    renderWithProviders(<Cuotas />);

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Limpiar Filtros');
    expect(clearButton).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockedApi.get.mockRejectedValue({
      response: { data: { message: 'Error del servidor' } }
    });

    renderWithProviders(<Cuotas />);

    await waitFor(() => {
      expect(screen.getByText('Error del servidor')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    renderWithProviders(<Cuotas />);
    expect(screen.getByText('Cargando cuotas...')).toBeInTheDocument();
  });

  it('shows no data message when no cuotas found', async () => {
    mockedApi.get.mockResolvedValue({ data: [] });

    renderWithProviders(<Cuotas />);

    await waitFor(() => {
      expect(screen.getByText('No se encontraron cuotas')).toBeInTheDocument();
    });
  });
});