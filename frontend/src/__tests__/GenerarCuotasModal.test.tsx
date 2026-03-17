import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import GenerarCuotasModal from '../components/GenerarCuotasModal';
import api from '../lib/api';

// Mock the API
vi.mock('../lib/api');
const mockedApi = vi.mocked(api);

// Mock alert
const mockAlert = vi.fn();
global.alert = mockAlert;

describe('GenerarCuotasModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal when open', () => {
    render(
      <GenerarCuotasModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Generar Cuotas Mensuales')).toBeInTheDocument();
    expect(screen.getByText(/Esta acción generará cuotas para todos los socios activos/)).toBeInTheDocument();
    expect(screen.getByLabelText('Monto de la cuota:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generar Cuotas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <GenerarCuotasModal
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText('Generar Cuotas Mensuales')).not.toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <GenerarCuotasModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button (×) is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <GenerarCuotasModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await user.click(screen.getByText('×'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should show validation error for invalid amount', async () => {
    const user = userEvent.setup();
    
    render(
      <GenerarCuotasModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Try to submit with empty amount
    await user.click(screen.getByRole('button', { name: 'Generar Cuotas' }));
    expect(mockAlert).toHaveBeenCalledWith('Por favor ingrese un monto válido');

    // Try to submit with negative amount
    await user.type(screen.getByLabelText('Monto de la cuota:'), '-100');
    await user.click(screen.getByRole('button', { name: 'Generar Cuotas' }));
    expect(mockAlert).toHaveBeenCalledWith('Por favor ingrese un monto válido');

    // Try to submit with zero amount
    await user.clear(screen.getByLabelText('Monto de la cuota:'));
    await user.type(screen.getByLabelText('Monto de la cuota:'), '0');
    await user.click(screen.getByRole('button', { name: 'Generar Cuotas' }));
    expect(mockAlert).toHaveBeenCalledWith('Por favor ingrese un monto válido');
  });

  it('should successfully generate cuotas with valid amount', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      data: {
        message: 'Cuotas generadas exitosamente para 5 socios activos',
        cuotasGeneradas: 5,
      },
    };

    mockedApi.post.mockResolvedValueOnce(mockResponse);

    render(
      <GenerarCuotasModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Enter valid amount
    await user.type(screen.getByLabelText('Monto de la cuota:'), '5000');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: 'Generar Cuotas' }));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/cuotas/generar', {
        monto: 5000,
      });
    });

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Cuotas generadas exitosamente para 5 socios activos');
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup();
    const mockError = {
      response: {
        data: {
          error: {
            message: 'Error al generar cuotas',
          },
        },
      },
    };

    mockedApi.post.mockRejectedValueOnce(mockError);

    render(
      <GenerarCuotasModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Enter valid amount
    await user.type(screen.getByLabelText('Monto de la cuota:'), '5000');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: 'Generar Cuotas' }));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/cuotas/generar', {
        monto: 5000,
      });
    });

    // Should not call success callbacks on error
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should disable form elements while loading', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed API response
    mockedApi.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(
      <GenerarCuotasModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Enter valid amount
    await user.type(screen.getByLabelText('Monto de la cuota:'), '5000');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: 'Generar Cuotas' }));

    // Check that elements are disabled during loading
    expect(screen.getByLabelText('Monto de la cuota:')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Generando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });

  it('should clear form when modal is closed', async () => {
    const user = userEvent.setup();
    
    render(
      <GenerarCuotasModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Enter some amount
    const input = screen.getByLabelText('Monto de la cuota:');
    await user.type(input, '5000');
    expect(input).toHaveValue(5000);

    // Close modal
    await user.click(screen.getByText('×'));

    // Reopen modal (simulate reopening)
    render(
      <GenerarCuotasModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Input should be empty
    expect(screen.getByLabelText('Monto de la cuota:')).toHaveValue(null);
  });
});