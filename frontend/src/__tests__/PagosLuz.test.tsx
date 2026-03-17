import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import PagosLuz from '../pages/PagosLuz';
import api from '../lib/api';

// Mock the API
vi.mock('../lib/api');
const mockedApi = vi.mocked(api);

// Mock data
const mockPagos = [
  {
    id: '1',
    monto: 15000,
    fecha_pago: '2024-01-15T10:00:00Z',
    descripcion: 'Pago de luz enero',
    registrado_por: 'admin-id',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    monto: 18000,
    fecha_pago: '2024-02-15T10:00:00Z',
    descripcion: null,
    registrado_por: 'admin-id',
    created_at: '2024-02-15T10:00:00Z',
  },
];

describe('PagosLuz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title and register button', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagos });

    render(<PagosLuz />);

    await waitFor(() => {
      expect(screen.getByText('Pagos de Luz')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Registrar Pago')).toBeInTheDocument();
  });

  it('loads and displays light payments history', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagos });

    render(<PagosLuz />);

    await waitFor(() => {
      expect(screen.getByText('Historial de Pagos')).toBeInTheDocument();
    });

    // Check if payments are displayed (note the space in currency format)
    expect(screen.getByText('$ 15.000')).toBeInTheDocument();
    expect(screen.getByText('$ 18.000')).toBeInTheDocument();
    expect(screen.getByText('Pago de luz enero')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument(); // For null description
  });

  it('opens registration form when register button is clicked', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] });

    render(<PagosLuz />);

    await waitFor(() => {
      expect(screen.getByText('Registrar Pago')).toBeInTheDocument();
    });

    // Click the main register button (not the form submit button)
    const registerButtons = screen.getAllByText('Registrar Pago');
    fireEvent.click(registerButtons[0]); // First one is the main button

    expect(screen.getByText('Registrar Pago de Luz')).toBeInTheDocument();
    expect(screen.getByLabelText('Monto *')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
  });

  it('submits payment registration form successfully', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] });
    mockedApi.post.mockResolvedValueOnce({ data: { success: true } });
    mockedApi.get.mockResolvedValueOnce({ data: mockPagos });

    render(<PagosLuz />);

    await waitFor(() => {
      const registerButtons = screen.getAllByText('Registrar Pago');
      fireEvent.click(registerButtons[0]);
    });

    // Fill form
    const montoInput = screen.getByLabelText('Monto *');
    const descripcionInput = screen.getByLabelText('Descripción');

    fireEvent.change(montoInput, { target: { value: '15000' } });
    fireEvent.change(descripcionInput, { target: { value: 'Test payment' } });

    // Submit form using form submission
    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/pagos/luz', {
        monto: 15000,
        descripcion: 'Test payment',
      });
    });
  });

  it('displays empty state when no payments exist', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] });

    render(<PagosLuz />);

    await waitFor(() => {
      expect(screen.getByText('No se encontraron pagos de luz registrados')).toBeInTheDocument();
    });
  });

  it('closes modal when cancel button is clicked', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] });

    render(<PagosLuz />);

    await waitFor(() => {
      const registerButtons = screen.getAllByText('Registrar Pago');
      fireEvent.click(registerButtons[0]);
    });

    expect(screen.getByText('Registrar Pago de Luz')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancelar'));

    expect(screen.queryByText('Registrar Pago de Luz')).not.toBeInTheDocument();
  });
});