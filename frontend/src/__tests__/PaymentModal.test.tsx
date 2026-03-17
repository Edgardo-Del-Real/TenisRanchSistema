import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentModal from '../components/PaymentModal';
import { EstadoCuota } from '../types';
import api from '../lib/api';

// Mock the API
jest.mock('../lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

const mockCuota = {
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
};

const defaultProps = {
  cuota: mockCuota,
  onClose: jest.fn(),
  onPaymentRegistered: jest.fn(),
};

describe('PaymentModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.post.mockResolvedValue({ data: {} });
  });

  it('renders modal with cuota information', () => {
    render(<PaymentModal {...defaultProps} />);

    expect(screen.getByText('Registrar Pago de Cuota')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Marzo 2024')).toBeInTheDocument();
    expect(screen.getByText('$15.000')).toBeInTheDocument(); // Monto total
    expect(screen.getByText('$5.000')).toBeInTheDocument(); // Monto abonado
    expect(screen.getByText('$10.000')).toBeInTheDocument(); // Saldo pendiente
  });

  it('closes modal when close button is clicked', () => {
    render(<PaymentModal {...defaultProps} />);

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes modal when cancel button is clicked', () => {
    render(<PaymentModal {...defaultProps} />);

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes modal when overlay is clicked', () => {
    render(<PaymentModal {...defaultProps} />);

    const overlay = screen.getByText('Registrar Pago de Cuota').closest('.modal-overlay');
    fireEvent.click(overlay!);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not close modal when modal content is clicked', () => {
    render(<PaymentModal {...defaultProps} />);

    const modalContent = screen.getByText('Información de la Cuota').closest('.modal-content');
    fireEvent.click(modalContent!);

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('sets total amount when "Pagar Total" button is clicked', () => {
    render(<PaymentModal {...defaultProps} />);

    const payTotalButton = screen.getByText('Pagar Total');
    const amountInput = screen.getByLabelText('Monto a Pagar:') as HTMLInputElement;

    fireEvent.click(payTotalButton);

    expect(amountInput.value).toBe('10000');
  });

  it('registers payment when form is submitted', async () => {
    render(<PaymentModal {...defaultProps} />);

    const amountInput = screen.getByLabelText('Monto a Pagar:');
    const submitButton = screen.getByText('Registrar Pago');

    fireEvent.change(amountInput, { target: { value: '5000' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/cuotas/1/pagos', {
        monto: 5000,
      });
    });

    expect(defaultProps.onPaymentRegistered).toHaveBeenCalled();
  });

  it('shows error when amount exceeds pending balance', () => {
    render(<PaymentModal {...defaultProps} />);

    const amountInput = screen.getByLabelText('Monto a Pagar:');
    const submitButton = screen.getByText('Registrar Pago');

    fireEvent.change(amountInput, { target: { value: '15000' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('El monto no puede ser mayor al saldo pendiente')).toBeInTheDocument();
  });

  it('shows error when amount is invalid', () => {
    render(<PaymentModal {...defaultProps} />);

    const amountInput = screen.getByLabelText('Monto a Pagar:');
    const submitButton = screen.getByText('Registrar Pago');

    fireEvent.change(amountInput, { target: { value: '-100' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('El monto debe ser un número válido mayor a 0')).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    mockedApi.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<PaymentModal {...defaultProps} />);

    const amountInput = screen.getByLabelText('Monto a Pagar:');
    const submitButton = screen.getByText('Registrar Pago');

    fireEvent.change(amountInput, { target: { value: '5000' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Registrando...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Registrar Pago')).toBeInTheDocument();
    });
  });

  it('displays error message when API call fails', async () => {
    mockedApi.post.mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Error del servidor'
          }
        }
      }
    });

    render(<PaymentModal {...defaultProps} />);

    const amountInput = screen.getByLabelText('Monto a Pagar:');
    const submitButton = screen.getByText('Registrar Pago');

    fireEvent.change(amountInput, { target: { value: '5000' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Error del servidor')).toBeInTheDocument();
    });
  });

  it('validates required fields', () => {
    render(<PaymentModal {...defaultProps} />);

    const amountInput = screen.getByLabelText('Monto a Pagar:') as HTMLInputElement;

    expect(amountInput).toHaveAttribute('required');
    expect(amountInput).toHaveAttribute('min', '0.01');
    expect(amountInput).toHaveAttribute('max', '10000');
  });
});