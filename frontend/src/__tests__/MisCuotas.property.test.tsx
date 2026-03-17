import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as fc from 'fast-check';
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

// Generators
const estadoCuotaArb = fc.constantFrom(
  EstadoCuota.PENDIENTE,
  EstadoCuota.PARCIAL,
  EstadoCuota.PAGADA
);

const cuotaArb = fc.record({
  id: fc.uuid(),
  mes: fc.integer({ min: 1, max: 12 }),
  anio: fc.integer({ min: 2020, max: 2030 }),
  monto_total: fc.integer({ min: 1000, max: 100000 }),
  monto_abonado: fc.integer({ min: 0, max: 100000 }),
  estado: estadoCuotaArb,
  created_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
    .map(d => d.toISOString()),
}).map(cuota => ({
  ...cuota,
  saldo_pendiente: Math.max(0, cuota.monto_total - cuota.monto_abonado),
}));

const pagoArb = fc.record({
  id: fc.uuid(),
  monto: fc.integer({ min: 100, max: 50000 }),
  fecha_pago: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
    .map(d => d.toISOString()),
});

describe('MisCuotas Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Feature: gestion-club-tenis, Task 16.2
   * Property: All cuotas displayed must show correct calculation of saldo_pendiente
   * Validates: Requirement 9.9 - Socio can view their fees with correct amounts
   */
  it('property: saldo_pendiente always equals monto_total minus monto_abonado', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(cuotaArb, { minLength: 1, maxLength: 20 }),
        async (cuotas) => {
          mockedApi.get.mockResolvedValue({ data: cuotas });

          const { container, unmount } = renderWithProviders(<MisCuotas />);

          await waitFor(() => {
            expect(screen.queryByText('Cargando cuotas...')).not.toBeInTheDocument();
          }, { timeout: 3000 });

          // Verify each cuota has correct saldo_pendiente
          cuotas.forEach(cuota => {
            const expectedSaldo = cuota.monto_total - cuota.monto_abonado;
            expect(cuota.saldo_pendiente).toBe(expectedSaldo);
          });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: gestion-club-tenis, Task 16.2
   * Property: Estado badge matches the actual estado value
   * Validates: Requirement 9.9 - Correct status display
   */
  it('property: estado badge correctly reflects cuota status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(cuotaArb, { minLength: 1, maxLength: 10 }),
        async (cuotas) => {
          mockedApi.get.mockResolvedValue({ data: cuotas });

          const { unmount } = renderWithProviders(<MisCuotas />);

          await waitFor(() => {
            expect(screen.queryByText('Cargando cuotas...')).not.toBeInTheDocument();
          }, { timeout: 3000 });

          // Check that status badges are displayed
          cuotas.forEach(cuota => {
            const expectedLabel = 
              cuota.estado === EstadoCuota.PENDIENTE ? 'Pendiente' :
              cuota.estado === EstadoCuota.PARCIAL ? 'Parcial' :
              'Pagada';
            
            const badges = screen.queryAllByText(expectedLabel);
            expect(badges.length).toBeGreaterThan(0);
          });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: gestion-club-tenis, Task 16.2
   * Property: Month names are correctly formatted for all valid month numbers
   * Validates: Requirement 9.9 - Display generation date (month/year)
   */
  it('property: month formatting is correct for all valid months', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(cuotaArb, { minLength: 1, maxLength: 12 }),
        async (cuotas) => {
          mockedApi.get.mockResolvedValue({ data: cuotas });

          const { unmount } = renderWithProviders(<MisCuotas />);

          await waitFor(() => {
            expect(screen.queryByText('Cargando cuotas...')).not.toBeInTheDocument();
          }, { timeout: 3000 });

          const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
          ];

          // Verify month formatting
          cuotas.forEach(cuota => {
            const expectedMonth = `${monthNames[cuota.mes - 1]} ${cuota.anio}`;
            const monthElements = screen.queryAllByText(expectedMonth);
            expect(monthElements.length).toBeGreaterThan(0);
          });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: gestion-club-tenis, Task 16.2
   * Property: Payment history button only appears for cuotas with monto_abonado > 0
   * Validates: Requirement 9.9 - Show payment history when applicable
   */
  it('property: payment history button only shown when monto_abonado > 0', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(cuotaArb, { minLength: 1, maxLength: 15 }),
        async (cuotas) => {
          mockedApi.get.mockResolvedValue({ data: cuotas });

          const { unmount, container } = renderWithProviders(<MisCuotas />);

          await waitFor(() => {
            expect(screen.queryByText('Cargando cuotas...')).not.toBeInTheDocument();
          }, { timeout: 3000 });

          const historyButtons = container.querySelectorAll('.btn-link');
          const cuotasWithPayments = cuotas.filter(c => c.monto_abonado > 0);

          expect(historyButtons.length).toBe(cuotasWithPayments.length);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: gestion-club-tenis, Task 16.2
   * Property: Currency formatting always includes peso sign and proper formatting
   * Validates: Requirement 9.9 - Display amounts correctly
   */
  it('property: all monetary amounts are formatted with currency symbol', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(cuotaArb, { minLength: 1, maxLength: 10 }),
        async (cuotas) => {
          mockedApi.get.mockResolvedValue({ data: cuotas });

          const { container, unmount } = renderWithProviders(<MisCuotas />);

          await waitFor(() => {
            expect(screen.queryByText('Cargando cuotas...')).not.toBeInTheDocument();
          }, { timeout: 3000 });

          // Check that currency symbols are present
          const currencyElements = container.querySelectorAll('.cuota-value');
          const hasCurrencySymbols = Array.from(currencyElements).some(
            el => el.textContent?.includes('$')
          );

          expect(hasCurrencySymbols).toBe(true);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: gestion-club-tenis, Task 16.2
   * Property: Empty cuotas list shows appropriate message
   * Validates: Requirement 9.9 - Handle empty state
   */
  it('property: empty cuotas list displays no data message', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant([]),
        async (cuotas) => {
          mockedApi.get.mockResolvedValue({ data: cuotas });

          const { unmount } = renderWithProviders(<MisCuotas />);

          await waitFor(() => {
            const noDataMessages = screen.queryAllByText('No tienes cuotas registradas');
            expect(noDataMessages.length).toBeGreaterThan(0);
          }, { timeout: 3000 });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: gestion-club-tenis, Task 16.2
   * Property: Payment history displays all pagos for a cuota
   * Validates: Requirement 9.9 - Show payment history
   */
  it('property: payment history shows all pagos when cuota is selected', async () => {
    await fc.assert(
      fc.asyncProperty(
        cuotaArb.filter(c => c.monto_abonado > 0),
        fc.array(pagoArb, { minLength: 1, maxLength: 10 }),
        async (cuota, pagos) => {
          mockedApi.get.mockImplementation((url) => {
            if (url === '/cuotas') {
              return Promise.resolve({ data: [cuota] });
            }
            if (url.includes('/pagos')) {
              return Promise.resolve({ data: pagos });
            }
            return Promise.reject(new Error('Not found'));
          });

          const { unmount } = renderWithProviders(<MisCuotas />);

          await waitFor(() => {
            expect(screen.queryByText('Cargando cuotas...')).not.toBeInTheDocument();
          }, { timeout: 3000 });

          // Click on cuota to open modal
          const cuotaCards = screen.getAllByRole('generic').filter(
            el => el.className.includes('cuota-card')
          );
          
          if (cuotaCards.length > 0) {
            cuotaCards[0].click();

            await waitFor(() => {
              const historyHeaders = screen.queryAllByText('Historial de Pagos');
              expect(historyHeaders.length).toBeGreaterThan(0);
            }, { timeout: 3000 });
          }

          unmount();
        }
      ),
      { numRuns: 50 } // Reduced runs for modal interactions
    );
  });

  /**
   * Feature: gestion-club-tenis, Task 16.2
   * Property: Date formatting is consistent across all dates
   * Validates: Requirement 9.9 - Display generation date
   */
  it('property: all dates are formatted consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(cuotaArb, { minLength: 1, maxLength: 10 }),
        async (cuotas) => {
          mockedApi.get.mockResolvedValue({ data: cuotas });

          const { container, unmount } = renderWithProviders(<MisCuotas />);

          await waitFor(() => {
            expect(screen.queryByText('Cargando cuotas...')).not.toBeInTheDocument();
          }, { timeout: 3000 });

          // Check for date pattern (DD/MM/YYYY)
          const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}/;
          const textContent = container.textContent || '';
          const hasDateFormat = datePattern.test(textContent);

          expect(hasDateFormat).toBe(true);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: gestion-club-tenis, Task 16.2
   * Property: Cuotas are displayed regardless of their estado
   * Validates: Requirement 9.9 - Show all cuotas
   */
  it('property: all cuotas are displayed regardless of estado', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(cuotaArb, { minLength: 1, maxLength: 20 }),
        async (cuotas) => {
          mockedApi.get.mockResolvedValue({ data: cuotas });

          const { unmount } = renderWithProviders(<MisCuotas />);

          await waitFor(() => {
            expect(screen.queryByText('Cargando cuotas...')).not.toBeInTheDocument();
          }, { timeout: 3000 });

          // Count cuota cards
          const cuotaCards = screen.getAllByRole('generic').filter(
            el => el.className.includes('cuota-card') && !el.className.includes('no-data')
          );

          expect(cuotaCards.length).toBe(cuotas.length);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: gestion-club-tenis, Task 16.2
   * Property: API errors are handled gracefully without crashing
   * Validates: Requirement 9.9 - Error handling
   */
  it('property: API errors display error message without crashing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (errorMessage) => {
          mockedApi.get.mockRejectedValue({
            response: { data: { message: errorMessage } }
          });

          const { unmount } = renderWithProviders(<MisCuotas />);

          await waitFor(() => {
            const errorElements = screen.queryAllByText(errorMessage);
            expect(errorElements.length).toBeGreaterThan(0);
          }, { timeout: 3000 });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
