import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Turnos from '../pages/Turnos';
import * as AuthContext from '../contexts/AuthContext';
import api from '../lib/api';
import { Rol, EstadoCancha, EstadoTurno } from '../types';

vi.mock('../lib/api');
vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

const mockUser = {
  id: '1',
  nombre: 'Test',
  apellido: 'User',
  email: 'test@test.com',
  telefono: '123456789',
  rol: Rol.SOCIO,
  activo: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

const mockCanchas = [
  { id: 'c1', numero: 1, estado: EstadoCancha.DISPONIBLE },
  { id: 'c2', numero: 2, estado: EstadoCancha.DISPONIBLE },
];

const mockConfiguracion = {
  apertura: '08:00:00',
  cierre: '22:00:00',
  luz_inicio: '18:30:00',
  luz_fin: '19:00:00',
  duracion_semana_min: 60,
  duracion_finde_min: 90,
};

const mockTarifas = [
  { tipo: 'turno_no_socio', valor: 10000 },
  { tipo: 'luz', valor: 4000 },
];

const mockTurnosVigentes = [
  {
    id: 't1',
    fecha_inicio: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    fecha_fin: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    estado: EstadoTurno.ACTIVO,
    requiere_luz: false,
    costo_turno: 10000,
    costo_luz: 0,
    created_at: new Date().toISOString(),
    cancha: { id: 'c1', numero: 1, estado: EstadoCancha.DISPONIBLE },
  },
];

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Turnos Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock auth context
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    // Mock API calls
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/canchas') return Promise.resolve({ data: mockCanchas });
      if (url === '/configuracion') return Promise.resolve({ data: mockConfiguracion });
      if (url === '/tarifas') return Promise.resolve({ data: mockTarifas });
      if (url === '/turnos') return Promise.resolve({ data: mockTurnosVigentes });
      if (url === '/turnos/historial') return Promise.resolve({ data: [] });
      return Promise.reject(new Error('Not found'));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the turnos page with tabs', async () => {
    renderWithProviders(<Turnos />);
    
    await waitFor(() => {
      expect(screen.getByText('Gestión de Turnos')).toBeInTheDocument();
      expect(screen.getByText('Reservar Turno')).toBeInTheDocument();
      expect(screen.getByText('Mis Turnos Vigentes')).toBeInTheDocument();
    });
  });


  it('shows historial tab only for Socio users', async () => {
    renderWithProviders(<Turnos />);
    
    await waitFor(() => {
      expect(screen.getByText('Historial')).toBeInTheDocument();
    });
  });

  it('loads initial data on mount', async () => {
    renderWithProviders(<Turnos />);
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/canchas');
      expect(api.get).toHaveBeenCalledWith('/configuracion');
      expect(api.get).toHaveBeenCalledWith('/tarifas');
    });
  });

  it('displays available canchas in the select', async () => {
    renderWithProviders(<Turnos />);
    
    await waitFor(() => {
      const select = screen.getByLabelText('Cancha:') as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(screen.getByText('Cancha 1')).toBeInTheDocument();
      expect(screen.getByText('Cancha 2')).toBeInTheDocument();
    });
  });

  it('generates time slots based on configuration', async () => {
    renderWithProviders(<Turnos />);
    
    await waitFor(() => {
      const timeSelect = screen.getByLabelText('Hora:') as HTMLSelectElement;
      expect(timeSelect).toBeInTheDocument();
      // Should have time slots from 08:00 to 22:00
      const options = Array.from(timeSelect.options).map(o => o.value).filter(v => v);
      expect(options.length).toBeGreaterThan(0);
      expect(options[0]).toBe('08:00');
    });
  });

  it('shows reservation preview when all fields are filled', async () => {
    renderWithProviders(<Turnos />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Cancha:')).toBeInTheDocument();
    });

    const canchaSelect = screen.getByLabelText('Cancha:') as HTMLSelectElement;
    const fechaInput = screen.getByLabelText('Fecha:') as HTMLInputElement;
    const horaSelect = screen.getByLabelText('Hora:') as HTMLSelectElement;

    fireEvent.change(canchaSelect, { target: { value: 'c1' } });
    fireEvent.change(fechaInput, { target: { value: '2024-12-25' } });
    fireEvent.change(horaSelect, { target: { value: '10:00' } });

    await waitFor(() => {
      expect(screen.getByText('Resumen de la Reserva')).toBeInTheDocument();
    });
  });


  it('submits reservation when form is complete', async () => {
    (api.post as any).mockResolvedValue({ data: { id: 'new-turno' } });
    
    renderWithProviders(<Turnos />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Cancha:')).toBeInTheDocument();
    });

    const canchaSelect = screen.getByLabelText('Cancha:') as HTMLSelectElement;
    const fechaInput = screen.getByLabelText('Fecha:') as HTMLInputElement;
    const horaSelect = screen.getByLabelText('Hora:') as HTMLSelectElement;

    fireEvent.change(canchaSelect, { target: { value: 'c1' } });
    fireEvent.change(fechaInput, { target: { value: '2024-12-25' } });
    fireEvent.change(horaSelect, { target: { value: '10:00' } });

    const submitButton = screen.getByText('Confirmar Reserva');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/turnos', expect.objectContaining({
        cancha_id: 'c1',
        fecha_hora_inicio: expect.stringContaining('2024-12-25T10:00'),
      }));
    });
  });

  it('displays error message when reservation fails', async () => {
    (api.post as any).mockRejectedValue({
      response: {
        data: {
          error: { message: 'Ya alcanzó el límite de 2 turnos por día.' }
        }
      }
    });
    
    renderWithProviders(<Turnos />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Cancha:')).toBeInTheDocument();
    });

    const canchaSelect = screen.getByLabelText('Cancha:') as HTMLSelectElement;
    const fechaInput = screen.getByLabelText('Fecha:') as HTMLInputElement;
    const horaSelect = screen.getByLabelText('Hora:') as HTMLSelectElement;

    fireEvent.change(canchaSelect, { target: { value: 'c1' } });
    fireEvent.change(fechaInput, { target: { value: '2024-12-25' } });
    fireEvent.change(horaSelect, { target: { value: '10:00' } });

    const submitButton = screen.getByText('Confirmar Reserva');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Ya alcanzó el límite de 2 turnos por día.')).toBeInTheDocument();
    });
  });


  it('loads turnos vigentes when switching to vigentes tab', async () => {
    renderWithProviders(<Turnos />);
    
    await waitFor(() => {
      expect(screen.getByText('Mis Turnos Vigentes')).toBeInTheDocument();
    });

    const vigentesTab = screen.getByText('Mis Turnos Vigentes');
    fireEvent.click(vigentesTab);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/turnos');
    });
  });

  it('displays turnos vigentes correctly', async () => {
    renderWithProviders(<Turnos />);
    
    await waitFor(() => {
      expect(screen.getByText('Mis Turnos Vigentes')).toBeInTheDocument();
    });

    const vigentesTab = screen.getByText('Mis Turnos Vigentes');
    fireEvent.click(vigentesTab);

    await waitFor(() => {
      expect(screen.getByText('Cancha 1')).toBeInTheDocument();
      expect(screen.getByText('Cancelar Turno')).toBeInTheDocument();
    });
  });

  it('allows cancellation of turno with sufficient notice', async () => {
    (api.delete as any).mockResolvedValue({ data: { message: 'Turno cancelado' } });
    window.confirm = vi.fn(() => true);
    
    renderWithProviders(<Turnos />);
    
    await waitFor(() => {
      expect(screen.getByText('Mis Turnos Vigentes')).toBeInTheDocument();
    });

    const vigentesTab = screen.getByText('Mis Turnos Vigentes');
    fireEvent.click(vigentesTab);

    await waitFor(() => {
      expect(screen.getByText('Cancelar Turno')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancelar Turno');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/turnos/t1');
    });
  });

  it('shows historial for Socio users', async () => {
    renderWithProviders(<Turnos />);
    
    await waitFor(() => {
      expect(screen.getByText('Historial')).toBeInTheDocument();
    });

    const historialTab = screen.getByText('Historial');
    fireEvent.click(historialTab);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/turnos/historial');
    });
  });
});
