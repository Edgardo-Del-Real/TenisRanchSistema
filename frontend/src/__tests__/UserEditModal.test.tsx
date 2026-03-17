import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import UserEditModal from '../components/UserEditModal';
import { Rol } from '../types';
import api from '../lib/api';

// Mock the API
vi.mock('../lib/api');
const mockedApi = vi.mocked(api);

const mockUser = {
  id: '1',
  nombre: 'Juan',
  apellido: 'Pérez',
  email: 'juan@example.com',
  telefono: '123456789',
  rol: Rol.SOCIO,
  activo: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const defaultProps = {
  user: mockUser,
  onClose: vi.fn(),
  onUserUpdated: vi.fn(),
};

describe('UserEditModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.put.mockResolvedValue({ data: {} });
    mockedApi.patch.mockResolvedValue({ data: {} });
  });

  it('renders modal with user data', async () => {
    render(<UserEditModal {...defaultProps} />);
    
    expect(screen.getByText('Editar Usuario')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Juan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Pérez')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123456789')).toBeInTheDocument();
    
    // Check that the select has the correct value
    const roleSelect = screen.getByRole('combobox', { name: /rol/i });
    expect(roleSelect).toHaveValue(Rol.SOCIO);
    
    expect(screen.getByText('juan@example.com')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    render(<UserEditModal {...defaultProps} />);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes modal when cancel button is clicked', () => {
    render(<UserEditModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes modal when overlay is clicked', () => {
    render(<UserEditModal {...defaultProps} />);
    
    const overlay = screen.getByText('Editar Usuario').closest('.modal-overlay');
    fireEvent.click(overlay!);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not close modal when modal content is clicked', () => {
    render(<UserEditModal {...defaultProps} />);
    
    const modalContent = screen.getByText('Editar Usuario').closest('.modal-content');
    fireEvent.click(modalContent!);
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('updates user data when form is submitted', async () => {
    render(<UserEditModal {...defaultProps} />);
    
    // Change user data
    const nombreInput = screen.getByDisplayValue('Juan');
    const apellidoInput = screen.getByDisplayValue('Pérez');
    const telefonoInput = screen.getByDisplayValue('123456789');
    
    fireEvent.change(nombreInput, { target: { value: 'Juan Carlos' } });
    fireEvent.change(apellidoInput, { target: { value: 'Pérez García' } });
    fireEvent.change(telefonoInput, { target: { value: '987654321' } });
    
    // Submit form
    const submitButton = screen.getByText('Guardar Cambios');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockedApi.put).toHaveBeenCalledWith('/usuarios/1', {
        nombre: 'Juan Carlos',
        apellido: 'Pérez García',
        telefono: '987654321',
      });
    });
    
    expect(defaultProps.onUserUpdated).toHaveBeenCalled();
  });

  it('updates user role when role is changed', async () => {
    render(<UserEditModal {...defaultProps} />);
    
    // Change role
    const roleSelect = screen.getByRole('combobox', { name: /rol/i });
    fireEvent.change(roleSelect, { target: { value: Rol.ADMINISTRADOR } });
    
    // Submit form
    const submitButton = screen.getByText('Guardar Cambios');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockedApi.put).toHaveBeenCalledWith('/usuarios/1', {
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '123456789',
      });
      expect(mockedApi.patch).toHaveBeenCalledWith('/usuarios/1/rol', {
        rol: Rol.ADMINISTRADOR,
      });
    });
    
    expect(defaultProps.onUserUpdated).toHaveBeenCalled();
  });

  it('does not update role if role is not changed', async () => {
    render(<UserEditModal {...defaultProps} />);
    
    // Submit form without changing role
    const submitButton = screen.getByText('Guardar Cambios');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockedApi.put).toHaveBeenCalled();
      expect(mockedApi.patch).not.toHaveBeenCalled();
    });
  });

  it('shows loading state during submission', async () => {
    // Make API call take some time
    mockedApi.put.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<UserEditModal {...defaultProps} />);
    
    const submitButton = screen.getByText('Guardar Cambios');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Guardando...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.getByText('Guardar Cambios')).toBeInTheDocument();
    });
  });

  it('displays error message when API call fails', async () => {
    mockedApi.put.mockRejectedValue({
      response: { data: { message: 'Error del servidor' } }
    });
    
    render(<UserEditModal {...defaultProps} />);
    
    const submitButton = screen.getByText('Guardar Cambios');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Error del servidor')).toBeInTheDocument();
    });
  });

  it('displays generic error message when API error has no message', async () => {
    mockedApi.put.mockRejectedValue(new Error('Network error'));
    
    render(<UserEditModal {...defaultProps} />);
    
    const submitButton = screen.getByText('Guardar Cambios');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Error al actualizar usuario')).toBeInTheDocument();
    });
  });

  it('validates required fields', () => {
    render(<UserEditModal {...defaultProps} />);
    
    const nombreInput = screen.getByDisplayValue('Juan');
    const apellidoInput = screen.getByDisplayValue('Pérez');
    const telefonoInput = screen.getByDisplayValue('123456789');
    
    expect(nombreInput).toHaveAttribute('required');
    expect(apellidoInput).toHaveAttribute('required');
    expect(telefonoInput).toHaveAttribute('required');
  });

  it('displays user information that cannot be edited', () => {
    render(<UserEditModal {...defaultProps} />);
    
    expect(screen.getByText('juan@example.com')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('31/12/2023')).toBeInTheDocument(); // Formatted date
  });
});