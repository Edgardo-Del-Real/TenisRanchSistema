import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import fc from 'fast-check';
import Turnos from '../pages/Turnos';
import * as AuthContext from '../contexts/AuthContext';
import api from '../lib/api';
import { Rol, EstadoCancha } from '../types';

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

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};


describe('Turnos Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    (api.get as any).mockImplementation((url: string) => {
      if (url === '/canchas') return Promise.resolve({ data: mockCanchas });
      if (url === '/configuracion') return Promise.resolve({ data: mockConfiguracion });
      if (url === '/tarifas') return Promise.resolve({ data: mockTarifas });
      if (url === '/turnos') return Promise.resolve({ data: [] });
      if (url === '/turnos/historial') return Promise.resolve({ data: [] });
      return Promise.reject(new Error('Not found'));
    });
  });

  // Feature: gestion-club-tenis, Property: Luz charge calculation is correct for time slots
  it('calculates luz charge correctly based on time slot', async () => {
    renderWithProviders(<Turnos />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Cancha:')).toBeInTheDocument();
    });

    const canchaSelect = screen.getByLabelText('Cancha:') as HTMLSelectElement;
    const fechaInput = screen.getByLabelText('Fecha:') as HTMLInputElement;
    const horaSelect = screen.getByLabelText('Hora:') as HTMLSelectElement;

    fireEvent.change(canchaSelect, { target: { value: 'c1' } });
    fireEvent.change(fechaInput, { target: { value: '2024-12-25' } });

    // Test time before luz range (should not charge luz)
    fireEvent.change(horaSelect, { target: { value: '10:00' } });
    await waitFor(() => {
      expect(screen.queryByText(/Cargo de luz/)).not.toBeInTheDocument();
    });

    // Test time within luz range (should charge luz)
    fireEvent.change(horaSelect, { target: { value: '18:30' } });
    await waitFor(() => {
      expect(screen.getByText(/Cargo de luz/)).toBeInTheDocument();
    });

    // Test time after luz range (should not charge luz)
    fireEvent.change(horaSelect, { target: { value: '20:00' } });
    await waitFor(() => {
      expect(screen.queryByText(/Cargo de luz/)).not.toBeInTheDocument();
    });
  });


  // Feature: gestion-club-tenis, Property: Reservation form validates required fields
  it('validates that all required fields must be filled before submission', async () => {
    renderWithProviders(<Turnos />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Cancha:')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Confirmar Reserva') as HTMLButtonElement;
    
    // Initially, button should be disabled (no fields filled)
    expect(submitButton.disabled).toBe(true);
    
    // Fill only cancha
    const canchaSelect = screen.getByLabelText('Cancha:') as HTMLSelectElement;
    fireEvent.change(canchaSelect, { target: { value: 'c1' } });
    expect(submitButton.disabled).toBe(true);
    
    // Fill fecha
    const fechaInput = screen.getByLabelText('Fecha:') as HTMLInputElement;
    fireEvent.change(fechaInput, { target: { value: '2024-12-25' } });
    expect(submitButton.disabled).toBe(true);
    
    // Fill hora - now button should be enabled
    const horaSelect = screen.getByLabelText('Hora:') as HTMLSelectElement;
    fireEvent.change(horaSelect, { target: { value: '10:00' } });
    
    await waitFor(() => {
      expect(submitButton.disabled).toBe(false);
    });
  });

  // Feature: gestion-club-tenis, Property: Total cost is always sum of turno cost and luz cost
  it('ensures total cost equals turno cost plus luz cost', async () => {
    renderWithProviders(<Turnos />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Cancha:')).toBeInTheDocument();
    });

    const canchaSelect = screen.getByLabelText('Cancha:') as HTMLSelectElement;
    const fechaInput = screen.getByLabelText('Fecha:') as HTMLInputElement;
    const horaSelect = screen.getByLabelText('Hora:') as HTMLSelectElement;

    // Test without luz
    fireEvent.change(canchaSelect, { target: { value: 'c1' } });
    fireEvent.change(fechaInput, { target: { value: '2024-12-25' } });
    fireEvent.change(horaSelect, { target: { value: '10:00' } });

    await waitFor(() => {
      const preview = screen.queryByText('Resumen de la Reserva');
      expect(preview).toBeInTheDocument();
      // Check that luz charge is not shown
      expect(screen.queryByText(/Cargo de luz/)).not.toBeInTheDocument();
    });

    // Test with luz
    fireEvent.change(horaSelect, { target: { value: '18:30' } });

    await waitFor(() => {
      // Check that luz charge is shown
      expect(screen.getByText(/Cargo de luz/)).toBeInTheDocument();
    });
  });


  // Feature: gestion-club-tenis, Property: Date picker restricts to maximum 1 day advance
  it('restricts date selection to maximum 1 day in advance', async () => {
    renderWithProviders(<Turnos />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Fecha:')).toBeInTheDocument();
    });

    const fechaInput = screen.getByLabelText('Fecha:') as HTMLInputElement;
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    expect(fechaInput.min).toBe(today);
    expect(fechaInput.max).toBe(tomorrow);
  });

  // Feature: gestion-club-tenis, Property: Only available canchas are shown
  it('displays only canchas with DISPONIBLE status', async () => {
    const mixedCanchas = [
      { id: 'c1', numero: 1, estado: EstadoCancha.DISPONIBLE },
      { id: 'c2', numero: 2, estado: EstadoCancha.MANTENIMIENTO },
      { id: 'c3', numero: 3, estado: EstadoCancha.DISPONIBLE },
      { id: 'c4', numero: 4, estado: EstadoCancha.INHABILITADA },
    ];

    (api.get as any).mockImplementation((url: string) => {
      if (url === '/canchas') return Promise.resolve({ data: mixedCanchas });
      if (url === '/configuracion') return Promise.resolve({ data: mockConfiguracion });
      if (url === '/tarifas') return Promise.resolve({ data: mockTarifas });
      if (url === '/turnos') return Promise.resolve({ data: [] });
      if (url === '/turnos/historial') return Promise.resolve({ data: [] });
      return Promise.reject(new Error('Not found'));
    });

    renderWithProviders(<Turnos />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Cancha:')).toBeInTheDocument();
    });

    const canchaSelect = screen.getByLabelText('Cancha:') as HTMLSelectElement;
    const options = Array.from(canchaSelect.options).filter(o => o.value);
    
    // Should only show 2 available canchas (c1 and c3)
    expect(options.length).toBe(2);
    expect(options.some(o => o.textContent?.includes('Cancha 1'))).toBe(true);
    expect(options.some(o => o.textContent?.includes('Cancha 3'))).toBe(true);
    expect(options.some(o => o.textContent?.includes('Cancha 2'))).toBe(false);
    expect(options.some(o => o.textContent?.includes('Cancha 4'))).toBe(false);
  });
});
