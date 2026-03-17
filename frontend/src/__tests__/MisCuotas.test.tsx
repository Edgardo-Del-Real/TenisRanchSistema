import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MisCuotas from '../pages/MisCuotas';
import * as AuthContext from '../contexts/AuthContext';
import { Rol, EstadoCuota } from '../types';
import api from '../lib/api';

// Mock the API
vi.mock('../lib/api');
vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

const mockedApi = api as any;

// Mock data
const mockCuotasSocio = [
  {
    id: '1',
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
    mes: 2,
    anio: 2024,
    monto_total: 15000,
    monto_abonado: 0,
    saldo_pendiente: 15000,
    estado: EstadoCuota.PENDIENTE,
    created_at: '2024-02-01T00:00:00Z',
  },
  {
    id: '3',
    mes: 1,
    anio: 2024,
    monto_total: 15000,
    monto_abonado: 15000,
    saldo_pendiente: 0,
    estado: EstadoCuota.PAGADA,
    created_at: '2024-01-01T00:00:00Z',
  },
];

const mockPagos = [
  {
    id: 'p1',
    monto: 3000,
    fecha_pago: '2024-03-05T10:00:00Z',
  },
  {
    id: 'p2',
    monto: 2000,
    fecha_pago: '2024-03-10T14:30:00Z',
  },
];

const mockAuthValue = {
  user: {
    id: 'socio-1',
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan@example.com',
    telefono: '123456789',
    rol: Rol.SOCIO,
    activo: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
};

const renderWithProviders = (component: React.ReactElement) => {
  (AuthContext.useAuth as any).mockReturnValue(mockAuthValue);
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('MisCuotas Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/cuotas') {
        return Promise.resolve({ data: mockCuotasSocio });
      }
      if (url.includes('/cuotas/') && url.includes('/pagos')) {
        return Promise.resolve({ data: mockPagos });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('renders the page with title and subtitle', async () => {
    renderWithProviders(<MisCuotas />);

    await waitFor(() => {
      expect(screen.getByText('Mis Cuotas')).toBeInTheDocument();
      expect(screen.getByText('Consulta el estado de tus cuotas mensuales y el historial de pagos')).toBeInTheDocument();
    });
  });

  it('loads and displays cuotas in grid format', async () => {
    renderWithProviders(<MisCuotas />);

    await waitFor(() => {
      expect(screen.getByText('Marzo 2024')).toBeInTheDocument();
      expect(screen.getByText('Febrero 2024')).toBeInTheDocument();
      expect(screen.getByText('Enero 2024')).toBeInTheDocument();
    });
  });

  it('displays cuota details correctly', async () => {
    renderWithProviders(<MisCuotas />);

    await waitFor(() => {
      // Check for currency formatting - should have at least 3 cuotas
      const currencyElements = screen.getAllByText(/\$\s*15\.000/);
      expect(currencyElements.length).toBeGreaterThanOrEqual(3);
      expect(screen.getByText(/\$\s*5\.000/)).toBeInTheDocument(); // Monto abonado
      expect(screen.getByText(/\$\s*10\.000/)).toBeInTheDocument(); // Saldo pendiente
    });
  });

  it('displays correct status badges', async () => {
    renderWithProviders(<MisCuotas />);

    await waitFor(() => {
      expect(screen.getByText('Parcial')).toBeInTheDocument();
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
      expect(screen.getByText('Pagada')).toBeInTheDocument();
    });
  });

  it('shows payment history button only for cuotas with payments', async () => {
    renderWithProviders(<MisCuotas />);

    await waitFor(() => {
      const historyButtons = screen.getAllByText('Ver historial de pagos');
      // Should have 2 buttons: one for PARCIAL and one for PAGADA
      expect(historyButtons).toHaveLength(2);
    });
  });

  it('opens payment history modal when clicking on cuota with payments', async () => {
    renderWithProviders(<MisCuotas />);

    await waitFor(() => {
      expect(screen.getByText('Marzo 2024')).toBeInTheDocument();
    });

    // Click on the cuota card
    const cuotaCard = screen.getByText('Marzo 2024').closest('.cuota-card');
    fireEvent.click(cuotaCard!);

    await waitFor(() => {
      expect(screen.getByText('Historial de Pagos')).toBeInTheDocument();
      expect(screen.getByText('Pagos Realizados')).toBeInTheDocument();
    });
  });

  it('displays payment history correctly in modal', async () => {
    renderWithProviders(<MisCuotas />);

    await waitFor(() => {
      expect(screen.getByText('Marzo 2024')).toBeInTheDocument();
    });

    // Click on the cuota card
    const cuotaCard = screen.getByText('Marzo 2024').closest('.cuota-card');
    fireEvent.click(cuotaCard!);

    await waitFor(() => {
      expect(screen.getByText('Historial de Pagos')).toBeInTheDocument();
      // Check for payment amounts in the table
      const paymentAmounts = screen.getAllByText(/\$\s*[23]\.000/);
      expect(paymentAmounts.length).toBeGreaterThan(0);
    });
  });

  it('closes payment history modal when clicking close button', async () => {
    renderWithProviders(<MisCuotas />);

    await waitFor(() => {
      expect(screen.getByText('Marzo 2024')).toBeInTheDocument();
    });

    // Open modal
    const cuotaCard = screen.getByText('Marzo 2024').closest('.cuota-card');
    fireEvent.click(cuotaCard!);

    await waitFor(() => {
      expect(screen.getByText('Historial de Pagos')).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByText('Cerrar');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Historial de Pagos')).not.toBeInTheDocument();
    });
  });

  it('closes modal when clicking overlay', async () => {
    renderWithProviders(<MisCuotas />);

    await waitFor(() => {
      expect(screen.getByText('Marzo 2024')).toBeInTheDocument();
    });

    // Open modal
    const cuotaCard = screen.getByText('Marzo 2024').closest('.cuota-card');
    fireEvent.click(cuotaCard!);

    await waitFor(() => {
      expect(screen.getByText('Historial de Pagos')).toBeInTheDocument();
    });

    // Click overlay
    const overlay = document.querySelector('.modal-overlay');
    fireEvent.click(overlay!);

    await waitFor(() => {
      expect(screen.queryByText('Historial de Pagos')).not.toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockedApi.get.mockRejectedValue({
      response: { data: { message: 'Error del servidor' } }
    });

    renderWithProviders(<MisCuotas />);

    await waitFor(() => {
      expect(screen.getByText('Error del servidor')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    renderWithProviders(<MisCuotas />);
    expect(screen.getByText('Cargando cuotas...')).toBeInTheDocument();
  });

  it('shows no data message when no cuotas found', async () => {
    mockedApi.get.mockResolvedValue({ data: [] });

    renderWithProviders(<MisCuotas />);

    await waitFor(() => {
      expect(screen.getByText('No tienes cuotas registradas')).toBeInTheDocument();
    });
  });

  it('highlights selected cuota card', async () => {
    renderWithProviders(<MisCuotas />);

    await waitFor(() => {
      expect(screen.getByText('Marzo 2024')).toBeInTheDocument();
    });

    const cuotaCard = screen.getByText('Marzo 2024').closest('.cuota-card');
    fireEvent.click(cuotaCard!);

    await waitFor(() => {
      expect(cuotaCard).toHaveClass('selected');
    });
  });

  it('formats currency correctly', async () => {
    renderWithProviders(<MisCuotas />);

    await waitFor(() => {
      // Check for Argentine peso formatting
      const currencyElements = screen.getAllByText(/\$/);
      expect(currencyElements.length).toBeGreaterThan(0);
    });
  });

  it('formats dates correctly', async () => {
    renderWithProviders(<MisCuotas />);

    await waitFor(() => {
      // Check for date formatting (DD/MM/YYYY)
      const dateElements = screen.getAllByText(/\d{2}\/\d{2}\/\d{4}/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  it('displays generation date for each cuota', async () => {
    renderWithProviders(<MisCuotas />);

    await waitFor(() => {
      const dateLabels = screen.getAllByText('Fecha de Generación:');
      expect(dateLabels).toHaveLength(3); // One for each cuota
    });
  });

  it('shows payment summary in modal', async () => {
    renderWithProviders(<MisCuotas />);

    await waitFor(() => {
      expect(screen.getByText('Marzo 2024')).toBeInTheDocument();
    });

    const cuotaCard = screen.getByText('Marzo 2024').closest('.cuota-card');
    fireEvent.click(cuotaCard!);

    await waitFor(() => {
      // Use getAllByText since these labels appear in both cards and modal
      expect(screen.getAllByText('Monto Total:').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Monto Abonado:').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Saldo Pendiente:').length).toBeGreaterThan(0);
    });
  });

  it('handles empty payment history', async () => {
    mockedApi.get.mockImplementation((url) => {
      if (url === '/cuotas') {
        return Promise.resolve({ data: mockCuotasSocio });
      }
      if (url.includes('/cuotas/') && url.includes('/pagos')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Not found'));
    });

    renderWithProviders(<MisCuotas />);

    await waitFor(() => {
      expect(screen.getByText('Marzo 2024')).toBeInTheDocument();
    });

    const cuotaCard = screen.getByText('Marzo 2024').closest('.cuota-card');
    fireEvent.click(cuotaCard!);

    await waitFor(() => {
      expect(screen.getByText('No hay pagos registrados')).toBeInTheDocument();
    });
  });

  it('calls API with correct endpoint for cuotas', async () => {
    renderWithProviders(<MisCuotas />);

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith('/cuotas');
    });
  });

  it('calls API with correct endpoint for pagos', async () => {
    renderWithProviders(<MisCuotas />);

    await waitFor(() => {
      expect(screen.getByText('Marzo 2024')).toBeInTheDocument();
    });

    const cuotaCard = screen.getByText('Marzo 2024').closest('.cuota-card');
    fireEvent.click(cuotaCard!);

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith('/cuotas/1/pagos');
    });
  });
});
