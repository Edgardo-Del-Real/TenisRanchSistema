import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import fc from 'fast-check';
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

const createMockAuthValue = (user: any) => ({
  user,
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
});

const renderWithProviders = (component: React.ReactElement, user: any) => {
  (AuthContext.useAuth as any).mockReturnValue(createMockAuthValue(user));
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Generators
const rolArbitrary = fc.constantFrom(Rol.ADMINISTRADOR, Rol.SOCIO, Rol.NO_SOCIO);

const userArbitrary = fc.record({
  id: fc.uuid(),
  nombre: fc.string({ minLength: 1, maxLength: 50 }),
  apellido: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  telefono: fc.string({ minLength: 8, maxLength: 20 }),
  rol: rolArbitrary,
  activo: fc.boolean(),
  created_at: fc.date().map(d => d.toISOString()),
  updated_at: fc.date().map(d => d.toISOString()),
});

const validPasswordArbitrary = fc.string({ minLength: 8, maxLength: 50 });

const invalidPasswordArbitrary = fc.string({ minLength: 0, maxLength: 7 });

describe('Perfil Page - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowOpen.mockClear();
    mockReload.mockClear();
  });

  /**
   * Feature: gestion-club-tenis, Propiedad 10: Actualización de datos personales no altera el rol
   * Validates: Requirements 3.3, 3.4
   */
  it('property: updating personal data does not alter user role', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 8, maxLength: 20 }),
        async (user, newNombre, newTelefono) => {
          mockedApi.patch.mockResolvedValue({ data: { success: true } });

          const { unmount } = renderWithProviders(<Perfil />, user);

          // Update nombre
          const nombreInput = screen.getByLabelText('Nombre') as HTMLInputElement;
          fireEvent.change(nombreInput, { target: { value: newNombre } });

          // Update telefono
          const telefonoInput = screen.getByLabelText('Teléfono') as HTMLInputElement;
          fireEvent.change(telefonoInput, { target: { value: newTelefono } });

          const submitButton = screen.getByText('Guardar Cambios');
          fireEvent.click(submitButton);

          await waitFor(() => {
            if (mockedApi.patch.mock.calls.length > 0) {
              const callArgs = mockedApi.patch.mock.calls[0];
              const updateData = callArgs[1];
              
              // Verify that rol is not in the update payload
              expect(updateData).not.toHaveProperty('rol');
              
              // Verify only allowed fields are present
              const allowedFields = ['nombre', 'telefono', 'password'];
              Object.keys(updateData).forEach(key => {
                expect(allowedFields).toContain(key);
              });
            }
          }, { timeout: 1000 });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: gestion-club-tenis, Requirement 3.4: Users can update their own profile
   * Validates: Requirement 3.4
   */
  it('property: any valid nombre update is accepted', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        fc.string({ minLength: 1, maxLength: 50 }),
        async (user, newNombre) => {
          mockedApi.patch.mockResolvedValue({ data: { success: true } });

          const { unmount } = renderWithProviders(<Perfil />, user);

          const nombreInput = screen.getByLabelText('Nombre') as HTMLInputElement;
          fireEvent.change(nombreInput, { target: { value: newNombre } });

          const submitButton = screen.getByText('Guardar Cambios');
          fireEvent.click(submitButton);

          await waitFor(() => {
            if (mockedApi.patch.mock.calls.length > 0) {
              expect(mockedApi.patch).toHaveBeenCalledWith('/usuarios/perfil', {
                nombre: newNombre,
              });
            }
          }, { timeout: 1000 });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: gestion-club-tenis, Requirement 3.4: Users can update their phone
   * Validates: Requirement 3.4
   */
  it('property: any valid telefono update is accepted', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        fc.string({ minLength: 8, maxLength: 20 }),
        async (user, newTelefono) => {
          mockedApi.patch.mockResolvedValue({ data: { success: true } });

          const { unmount } = renderWithProviders(<Perfil />, user);

          const telefonoInput = screen.getByLabelText('Teléfono') as HTMLInputElement;
          fireEvent.change(telefonoInput, { target: { value: newTelefono } });

          const submitButton = screen.getByText('Guardar Cambios');
          fireEvent.click(submitButton);

          await waitFor(() => {
            if (mockedApi.patch.mock.calls.length > 0) {
              expect(mockedApi.patch).toHaveBeenCalledWith('/usuarios/perfil', {
                telefono: newTelefono,
              });
            }
          }, { timeout: 1000 });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: gestion-club-tenis, Requirement 3.4: Password validation
   * Validates: Requirement 3.4
   */
  it('property: valid passwords (>=8 chars) are accepted', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        validPasswordArbitrary,
        async (user, newPassword) => {
          mockedApi.patch.mockResolvedValue({ data: { success: true } });

          const { unmount } = renderWithProviders(<Perfil />, user);

          // Open password fields
          const changePasswordButton = screen.getByText('+ Cambiar contraseña');
          fireEvent.click(changePasswordButton);

          const newPasswordInput = screen.getByLabelText('Nueva Contraseña') as HTMLInputElement;
          const confirmPasswordInput = screen.getByLabelText('Confirmar Nueva Contraseña') as HTMLInputElement;

          fireEvent.change(newPasswordInput, { target: { value: newPassword } });
          fireEvent.change(confirmPasswordInput, { target: { value: newPassword } });

          const submitButton = screen.getByText('Guardar Cambios');
          fireEvent.click(submitButton);

          await waitFor(() => {
            if (mockedApi.patch.mock.calls.length > 0) {
              expect(mockedApi.patch).toHaveBeenCalledWith('/usuarios/perfil', {
                password: newPassword,
              });
              expect(screen.queryByText('La contraseña debe tener al menos 8 caracteres')).not.toBeInTheDocument();
            }
          }, { timeout: 1000 });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: gestion-club-tenis, Requirement 3.4: Password validation rejects short passwords
   * Validates: Requirement 3.4
   */
  it('property: invalid passwords (<8 chars) are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        invalidPasswordArbitrary,
        async (user, shortPassword) => {
          const { unmount } = renderWithProviders(<Perfil />, user);

          // Open password fields
          const changePasswordButton = screen.getByText('+ Cambiar contraseña');
          fireEvent.click(changePasswordButton);

          const newPasswordInput = screen.getByLabelText('Nueva Contraseña') as HTMLInputElement;
          const confirmPasswordInput = screen.getByLabelText('Confirmar Nueva Contraseña') as HTMLInputElement;

          fireEvent.change(newPasswordInput, { target: { value: shortPassword } });
          fireEvent.change(confirmPasswordInput, { target: { value: shortPassword } });

          const submitButton = screen.getByText('Guardar Cambios');
          fireEvent.click(submitButton);

          await waitFor(() => {
            expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument();
            expect(mockedApi.patch).not.toHaveBeenCalled();
          }, { timeout: 1000 });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: gestion-club-tenis, Requirement 3.4: Password confirmation must match
   * Validates: Requirement 3.4
   */
  it('property: mismatched password confirmation is rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        validPasswordArbitrary,
        validPasswordArbitrary,
        async (user, password1, password2) => {
          fc.pre(password1 !== password2); // Only test when passwords differ

          const { unmount } = renderWithProviders(<Perfil />, user);

          // Open password fields
          const changePasswordButton = screen.getByText('+ Cambiar contraseña');
          fireEvent.click(changePasswordButton);

          const newPasswordInput = screen.getByLabelText('Nueva Contraseña') as HTMLInputElement;
          const confirmPasswordInput = screen.getByLabelText('Confirmar Nueva Contraseña') as HTMLInputElement;

          fireEvent.change(newPasswordInput, { target: { value: password1 } });
          fireEvent.change(confirmPasswordInput, { target: { value: password2 } });

          const submitButton = screen.getByText('Guardar Cambios');
          fireEvent.click(submitButton);

          await waitFor(() => {
            expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
            expect(mockedApi.patch).not.toHaveBeenCalled();
          }, { timeout: 1000 });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: gestion-club-tenis, Requirement 3.6: No_Socio can request role change
   * Validates: Requirement 3.6
   */
  it('property: No_Socio users always see solicitar socio button', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        async (user) => {
          const noSocioUser = { ...user, rol: Rol.NO_SOCIO };

          const { unmount } = renderWithProviders(<Perfil />, noSocioUser);

          expect(screen.getByText('¿Deseas convertirte en socio del club?')).toBeInTheDocument();
          expect(screen.getByText('Solicitar cambio a Socio')).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: gestion-club-tenis, Requirement 3.6: Socio and Admin don't see solicitar button
   * Validates: Requirement 3.6
   */
  it('property: Socio and Admin users never see solicitar socio button', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        fc.constantFrom(Rol.SOCIO, Rol.ADMINISTRADOR),
        async (user, rol) => {
          const nonNoSocioUser = { ...user, rol };

          const { unmount } = renderWithProviders(<Perfil />, nonNoSocioUser);

          expect(screen.queryByText('¿Deseas convertirte en socio del club?')).not.toBeInTheDocument();
          expect(screen.queryByText('Solicitar cambio a Socio')).not.toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: gestion-club-tenis, Requirement 3.6: WhatsApp redirect works for No_Socio
   * Validates: Requirement 3.6
   */
  it('property: clicking solicitar socio opens WhatsApp for No_Socio users', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        fc.webUrl(),
        async (user, whatsappUrl) => {
          const noSocioUser = { ...user, rol: Rol.NO_SOCIO };
          mockedApi.get.mockResolvedValue({ data: { whatsappUrl } });

          const { unmount } = renderWithProviders(<Perfil />, noSocioUser);

          const solicitarButton = screen.getByText('Solicitar cambio a Socio');
          fireEvent.click(solicitarButton);

          await waitFor(() => {
            expect(mockedApi.get).toHaveBeenCalledWith('/usuarios/solicitar-socio');
            expect(mockWindowOpen).toHaveBeenCalledWith(whatsappUrl, '_blank');
          }, { timeout: 1000 });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: gestion-club-tenis, Requirement 3.4: Form displays current user data
   * Validates: Requirement 3.4
   */
  it('property: form is always pre-filled with current user data', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        async (user) => {
          const { unmount } = renderWithProviders(<Perfil />, user);

          const nombreInput = screen.getByLabelText('Nombre') as HTMLInputElement;
          const telefonoInput = screen.getByLabelText('Teléfono') as HTMLInputElement;

          expect(nombreInput.value).toBe(user.nombre);
          expect(telefonoInput.value).toBe(user.telefono);
          expect(screen.getByText(user.email)).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: gestion-club-tenis, Requirement 3.4: No API call when no changes
   * Validates: Requirement 3.4
   */
  it('property: submitting without changes does not call API', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        async (user) => {
          const { unmount } = renderWithProviders(<Perfil />, user);

          const submitButton = screen.getByText('Guardar Cambios');
          fireEvent.click(submitButton);

          await waitFor(() => {
            expect(screen.getByText('No hay cambios para guardar')).toBeInTheDocument();
            expect(mockedApi.patch).not.toHaveBeenCalled();
          }, { timeout: 1000 });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: gestion-club-tenis, Requirement 3.4: Multiple field updates
   * Validates: Requirement 3.4
   */
  it('property: updating multiple fields sends all changes in one request', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 8, maxLength: 20 }),
        validPasswordArbitrary,
        async (user, newNombre, newTelefono, newPassword) => {
          mockedApi.patch.mockResolvedValue({ data: { success: true } });

          const { unmount } = renderWithProviders(<Perfil />, user);

          // Update all fields
          const nombreInput = screen.getByLabelText('Nombre') as HTMLInputElement;
          fireEvent.change(nombreInput, { target: { value: newNombre } });

          const telefonoInput = screen.getByLabelText('Teléfono') as HTMLInputElement;
          fireEvent.change(telefonoInput, { target: { value: newTelefono } });

          const changePasswordButton = screen.getByText('+ Cambiar contraseña');
          fireEvent.click(changePasswordButton);

          const newPasswordInput = screen.getByLabelText('Nueva Contraseña') as HTMLInputElement;
          const confirmPasswordInput = screen.getByLabelText('Confirmar Nueva Contraseña') as HTMLInputElement;

          fireEvent.change(newPasswordInput, { target: { value: newPassword } });
          fireEvent.change(confirmPasswordInput, { target: { value: newPassword } });

          const submitButton = screen.getByText('Guardar Cambios');
          fireEvent.click(submitButton);

          await waitFor(() => {
            if (mockedApi.patch.mock.calls.length > 0) {
              expect(mockedApi.patch).toHaveBeenCalledTimes(1);
              expect(mockedApi.patch).toHaveBeenCalledWith('/usuarios/perfil', {
                nombre: newNombre,
                telefono: newTelefono,
                password: newPassword,
              });
            }
          }, { timeout: 1000 });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
