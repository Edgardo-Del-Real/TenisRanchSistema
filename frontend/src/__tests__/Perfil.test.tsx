import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Perfil from '../pages/Perfil';
import * as AuthContext from '../contexts/AuthContext';
import { Rol } from '../types';
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

// Mock window.open
const mockWindowOpen = vi.fn();
window.open = mockWindowOpen;

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
});

// Mock users
const mockSocioUser = {
  id: 'socio-1',
  nombre: 'Juan',
  apellido: 'Pérez',
  email: 'juan@example.com',
  telefono: '123456789',
  rol: Rol.SOCIO,
  activo: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockNoSocioUser = {
  id: 'no-socio-1',
  nombre: 'María',
  apellido: 'García',
  email: 'maria@example.com',
  telefono: '987654321',
  rol: Rol.NO_SOCIO,
  activo: true,
  created_at: '2023-06-15T00:00:00Z',
  updated_at: '2023-06-15T00:00:00Z',
};

const mockAdminUser = {
  id: 'admin-1',
  nombre: 'Admin',
  apellido: 'User',
  email: 'admin@example.com',
  telefono: '111222333',
  rol: Rol.ADMINISTRADOR,
  activo: true,
  created_at: '2022-01-01T00:00:00Z',
  updated_at: '2022-01-01T00:00:00Z',
};

const createMockAuthValue = (user: any) => ({
  user,
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
});

const renderWithProviders = (component: React.ReactElement, user: any = mockSocioUser) => {
  (AuthContext.useAuth as any).mockReturnValue(createMockAuthValue(user));
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Perfil Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowOpen.mockClear();
    mockReload.mockClear();
  });

  describe('Page Rendering', () => {
    it('renders the page with title and subtitle', () => {
      renderWithProviders(<Perfil />);

      expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
      expect(screen.getByText('Actualiza tu información personal y contraseña')).toBeInTheDocument();
    });

    it('displays user information correctly', () => {
      renderWithProviders(<Perfil />);

      expect(screen.getByText('juan@example.com')).toBeInTheDocument();
      expect(screen.getByText('Socio')).toBeInTheDocument();
      expect(screen.getByText('Activo')).toBeInTheDocument();
    });

    it('displays member since date correctly', () => {
      renderWithProviders(<Perfil />);

      // Date formatting may vary by timezone, just check that a date is displayed
      expect(screen.getByText(/Miembro desde:/i)).toBeInTheDocument();
      expect(screen.getByText(/\d{1,2} de \w+ de \d{4}/i)).toBeInTheDocument();
    });

    it('pre-fills form with user data', () => {
      renderWithProviders(<Perfil />);

      const nombreInput = screen.getByLabelText('Nombre') as HTMLInputElement;
      const telefonoInput = screen.getByLabelText('Teléfono') as HTMLInputElement;

      expect(nombreInput.value).toBe('Juan');
      expect(telefonoInput.value).toBe('123456789');
    });
  });

  describe('Role-Specific Features', () => {
    it('shows "Solicitar cambio a Socio" button for No_Socio users', () => {
      renderWithProviders(<Perfil />, mockNoSocioUser);

      expect(screen.getByText('¿Deseas convertirte en socio del club?')).toBeInTheDocument();
      expect(screen.getByText('Solicitar cambio a Socio')).toBeInTheDocument();
    });

    it('does not show "Solicitar cambio a Socio" button for Socio users', () => {
      renderWithProviders(<Perfil />, mockSocioUser);

      expect(screen.queryByText('¿Deseas convertirte en socio del club?')).not.toBeInTheDocument();
      expect(screen.queryByText('Solicitar cambio a Socio')).not.toBeInTheDocument();
    });

    it('does not show "Solicitar cambio a Socio" button for Admin users', () => {
      renderWithProviders(<Perfil />, mockAdminUser);

      expect(screen.queryByText('¿Deseas convertirte en socio del club?')).not.toBeInTheDocument();
      expect(screen.queryByText('Solicitar cambio a Socio')).not.toBeInTheDocument();
    });

    it('opens WhatsApp when clicking "Solicitar cambio a Socio"', async () => {
      mockedApi.get.mockResolvedValue({
        data: { whatsappUrl: 'https://wa.me/5491100000000?text=Test' }
      });

      renderWithProviders(<Perfil />, mockNoSocioUser);

      const solicitarButton = screen.getByText('Solicitar cambio a Socio');
      fireEvent.click(solicitarButton);

      await waitFor(() => {
        expect(mockedApi.get).toHaveBeenCalledWith('/usuarios/solicitar-socio');
        expect(mockWindowOpen).toHaveBeenCalledWith('https://wa.me/5491100000000?text=Test', '_blank');
      });
    });

    it('handles error when WhatsApp link generation fails', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<Perfil />, mockNoSocioUser);

      const solicitarButton = screen.getByText('Solicitar cambio a Socio');
      fireEvent.click(solicitarButton);

      await waitFor(() => {
        expect(screen.getByText('Error al generar el enlace de WhatsApp')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Update', () => {
    it('updates nombre successfully', async () => {
      mockedApi.patch.mockResolvedValue({ data: { success: true } });

      renderWithProviders(<Perfil />);

      const nombreInput = screen.getByLabelText('Nombre') as HTMLInputElement;
      fireEvent.change(nombreInput, { target: { value: 'Carlos' } });

      const submitButton = screen.getByText('Guardar Cambios');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.patch).toHaveBeenCalledWith('/usuarios/perfil', {
          nombre: 'Carlos',
        });
        expect(screen.getByText('Perfil actualizado exitosamente')).toBeInTheDocument();
      });
    });

    it('updates telefono successfully', async () => {
      mockedApi.patch.mockResolvedValue({ data: { success: true } });

      renderWithProviders(<Perfil />);

      const telefonoInput = screen.getByLabelText('Teléfono') as HTMLInputElement;
      fireEvent.change(telefonoInput, { target: { value: '999888777' } });

      const submitButton = screen.getByText('Guardar Cambios');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.patch).toHaveBeenCalledWith('/usuarios/perfil', {
          telefono: '999888777',
        });
      });
    });

    it('updates both nombre and telefono', async () => {
      mockedApi.patch.mockResolvedValue({ data: { success: true } });

      renderWithProviders(<Perfil />);

      const nombreInput = screen.getByLabelText('Nombre') as HTMLInputElement;
      const telefonoInput = screen.getByLabelText('Teléfono') as HTMLInputElement;

      fireEvent.change(nombreInput, { target: { value: 'Pedro' } });
      fireEvent.change(telefonoInput, { target: { value: '555444333' } });

      const submitButton = screen.getByText('Guardar Cambios');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.patch).toHaveBeenCalledWith('/usuarios/perfil', {
          nombre: 'Pedro',
          telefono: '555444333',
        });
      });
    });

    it('shows error when no changes are made', async () => {
      renderWithProviders(<Perfil />);

      const submitButton = screen.getByText('Guardar Cambios');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('No hay cambios para guardar')).toBeInTheDocument();
        expect(mockedApi.patch).not.toHaveBeenCalled();
      });
    });

    it('handles API error during update', async () => {
      mockedApi.patch.mockRejectedValue({
        response: { status: 400 }
      });

      renderWithProviders(<Perfil />);

      const nombreInput = screen.getByLabelText('Nombre') as HTMLInputElement;
      fireEvent.change(nombreInput, { target: { value: 'NewName' } });

      const submitButton = screen.getByText('Guardar Cambios');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Datos inválidos. Verifique la información ingresada.')).toBeInTheDocument();
      });
    });

    it('handles 401 unauthorized error', async () => {
      mockedApi.patch.mockRejectedValue({
        response: { status: 401 }
      });

      renderWithProviders(<Perfil />);

      const nombreInput = screen.getByLabelText('Nombre') as HTMLInputElement;
      fireEvent.change(nombreInput, { target: { value: 'NewName' } });

      const submitButton = screen.getByText('Guardar Cambios');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Sesión expirada. Por favor, inicie sesión nuevamente.')).toBeInTheDocument();
      });
    });

    it('disables form during submission', async () => {
      mockedApi.patch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(<Perfil />);

      const nombreInput = screen.getByLabelText('Nombre') as HTMLInputElement;
      fireEvent.change(nombreInput, { target: { value: 'NewName' } });

      const submitButton = screen.getByText('Guardar Cambios');
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(nombreInput).toBeDisabled();
    });

    it('reloads page after successful update', async () => {
      vi.useFakeTimers();
      mockedApi.patch.mockResolvedValue({ data: { success: true } });

      renderWithProviders(<Perfil />);

      const nombreInput = screen.getByLabelText('Nombre') as HTMLInputElement;
      fireEvent.change(nombreInput, { target: { value: 'NewName' } });

      const submitButton = screen.getByText('Guardar Cambios');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Perfil actualizado exitosamente')).toBeInTheDocument();
      });

      vi.advanceTimersByTime(1500);

      expect(mockReload).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('Password Change', () => {
    it('shows password fields when clicking change password button', () => {
      renderWithProviders(<Perfil />);

      const changePasswordButton = screen.getByText('+ Cambiar contraseña');
      fireEvent.click(changePasswordButton);

      expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmar Nueva Contraseña')).toBeInTheDocument();
    });

    it('hides password fields when clicking cancel', () => {
      renderWithProviders(<Perfil />);

      const changePasswordButton = screen.getByText('+ Cambiar contraseña');
      fireEvent.click(changePasswordButton);

      expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument();

      const cancelButton = screen.getByText('− Cancelar cambio de contraseña');
      fireEvent.click(cancelButton);

      expect(screen.queryByLabelText('Nueva Contraseña')).not.toBeInTheDocument();
    });

    it('validates password minimum length', async () => {
      renderWithProviders(<Perfil />);

      const changePasswordButton = screen.getByText('+ Cambiar contraseña');
      fireEvent.click(changePasswordButton);

      const newPasswordInput = screen.getByLabelText('Nueva Contraseña') as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText('Confirmar Nueva Contraseña') as HTMLInputElement;

      fireEvent.change(newPasswordInput, { target: { value: 'short' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'short' } });

      const submitButton = screen.getByText('Guardar Cambios');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('validates password confirmation match', async () => {
      renderWithProviders(<Perfil />);

      const changePasswordButton = screen.getByText('+ Cambiar contraseña');
      fireEvent.click(changePasswordButton);

      const newPasswordInput = screen.getByLabelText('Nueva Contraseña') as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText('Confirmar Nueva Contraseña') as HTMLInputElement;

      fireEvent.change(newPasswordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });

      const submitButton = screen.getByText('Guardar Cambios');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('requires new password when password fields are shown', async () => {
      renderWithProviders(<Perfil />);

      const changePasswordButton = screen.getByText('+ Cambiar contraseña');
      fireEvent.click(changePasswordButton);

      const submitButton = screen.getByText('Guardar Cambios');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Debe ingresar una nueva contraseña')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('updates password successfully', async () => {
      mockedApi.patch.mockResolvedValue({ data: { success: true } });

      renderWithProviders(<Perfil />);

      const changePasswordButton = screen.getByText('+ Cambiar contraseña');
      fireEvent.click(changePasswordButton);

      const newPasswordInput = screen.getByLabelText('Nueva Contraseña') as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText('Confirmar Nueva Contraseña') as HTMLInputElement;

      fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });

      const submitButton = screen.getByText('Guardar Cambios');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.patch).toHaveBeenCalledWith('/usuarios/perfil', {
          password: 'newpassword123',
        });
        expect(screen.getByText('Perfil actualizado exitosamente')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('updates password and other fields together', async () => {
      mockedApi.patch.mockResolvedValue({ data: { success: true } });

      renderWithProviders(<Perfil />);

      const nombreInput = screen.getByLabelText('Nombre') as HTMLInputElement;
      fireEvent.change(nombreInput, { target: { value: 'NewName' } });

      const changePasswordButton = screen.getByText('+ Cambiar contraseña');
      fireEvent.click(changePasswordButton);

      const newPasswordInput = screen.getByLabelText('Nueva Contraseña') as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText('Confirmar Nueva Contraseña') as HTMLInputElement;

      fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });

      const submitButton = screen.getByText('Guardar Cambios');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.patch).toHaveBeenCalledWith('/usuarios/perfil', {
          nombre: 'NewName',
          password: 'newpassword123',
        });
      }, { timeout: 2000 });
    });

    it('clears password fields after successful update', async () => {
      vi.useFakeTimers();
      mockedApi.patch.mockResolvedValue({ data: { success: true } });

      renderWithProviders(<Perfil />);

      const changePasswordButton = screen.getByText('+ Cambiar contraseña');
      fireEvent.click(changePasswordButton);

      const newPasswordInput = screen.getByLabelText('Nueva Contraseña') as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText('Confirmar Nueva Contraseña') as HTMLInputElement;

      fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });

      const submitButton = screen.getByText('Guardar Cambios');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Perfil actualizado exitosamente')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Password fields should be hidden after successful update
      expect(screen.queryByLabelText('Nueva Contraseña')).not.toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('UI Feedback', () => {
    it('clears error message when user starts typing', async () => {
      mockedApi.patch.mockRejectedValue({
        response: { status: 400 }
      });

      renderWithProviders(<Perfil />);

      const nombreInput = screen.getByLabelText('Nombre') as HTMLInputElement;
      fireEvent.change(nombreInput, { target: { value: 'Test' } });

      const submitButton = screen.getByText('Guardar Cambios');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Datos inválidos. Verifique la información ingresada.')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Type again to clear error
      fireEvent.change(nombreInput, { target: { value: 'Test2' } });

      await waitFor(() => {
        expect(screen.queryByText('Datos inválidos. Verifique la información ingresada.')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('shows loading state during submission', async () => {
      mockedApi.patch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(<Perfil />);

      const nombreInput = screen.getByLabelText('Nombre') as HTMLInputElement;
      fireEvent.change(nombreInput, { target: { value: 'NewName' } });

      const submitButton = screen.getByText('Guardar Cambios');
      fireEvent.click(submitButton);

      expect(screen.getByText('Guardando...')).toBeInTheDocument();
    });
  });

  describe('Role Badge Display', () => {
    it('displays correct badge for Administrador', () => {
      renderWithProviders(<Perfil />, mockAdminUser);

      expect(screen.getByText('Administrador')).toBeInTheDocument();
    });

    it('displays correct badge for Socio', () => {
      renderWithProviders(<Perfil />, mockSocioUser);

      expect(screen.getByText('Socio')).toBeInTheDocument();
    });

    it('displays correct badge for No Socio', () => {
      renderWithProviders(<Perfil />, mockNoSocioUser);

      expect(screen.getByText('No Socio')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading when user is null', () => {
      (AuthContext.useAuth as any).mockReturnValue({
        user: null,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      });

      render(
        <BrowserRouter>
          <Perfil />
        </BrowserRouter>
      );

      expect(screen.getByText('Cargando...')).toBeInTheDocument();
    });
  });
});
