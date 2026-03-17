import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Usuarios from '../pages/Usuarios';
import { AuthProvider } from '../contexts/AuthContext';
import { Rol } from '../types';
import api from '../lib/api';

// Mock the API
vi.mock('../lib/api');
const mockedApi = vi.mocked(api);

// Mock user data
const mockUsers = [
  {
    id: '1',
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan@example.com',
    telefono: '123456789',
    rol: Rol.SOCIO,
    activo: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    nombre: 'María',
    apellido: 'García',
    email: 'maria@example.com',
    telefono: '987654321',
    rol: Rol.NO_SOCIO,
    activo: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

const mockAdminUser = {
  id: 'admin-1',
  nombre: 'Admin',
  apellido: 'User',
  email: 'admin@example.com',
  telefono: '555555555',
  rol: Rol.ADMINISTRADOR,
  activo: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock AuthContext
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const mockAuthValue = {
    user: mockAdminUser,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    loading: false,
  };

  return (
    <AuthProvider value={mockAuthValue as any}>
      {children}
    </AuthProvider>
  );
};

const renderUsuarios = () => {
  return render(
    <BrowserRouter>
      <MockAuthProvider>
        <Usuarios />
      </MockAuthProvider>
    </BrowserRouter>
  );
};

describe('Usuarios Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.get.mockResolvedValue({ data: mockUsers });
  });

  it('renders the users page with title', async () => {
    renderUsuarios();
    
    await waitFor(() => {
      expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument();
    });
  });

  it('loads and displays users', async () => {
    renderUsuarios();
    
    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument();
      expect(screen.getByText('Pérez')).toBeInTheDocument();
      expect(screen.getByText('juan@example.com')).toBeInTheDocument();
      expect(screen.getByText('María')).toBeInTheDocument();
      expect(screen.getByText('García')).toBeInTheDocument();
      expect(screen.getByText('maria@example.com')).toBeInTheDocument();
    });
  });

  it('displays search and filter controls', async () => {
    renderUsuarios();
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar por nombre y/o apellido...')).toBeInTheDocument();
      expect(screen.getByLabelText('Estado:')).toBeInTheDocument();
      expect(screen.getByLabelText('Rol:')).toBeInTheDocument();
      expect(screen.getByText('Limpiar Filtros')).toBeInTheDocument();
    });
  });

  it('shows edit and delete buttons for active users', async () => {
    renderUsuarios();
    
    await waitFor(() => {
      const editButtons = screen.getAllByText('Editar');
      const deleteButtons = screen.getAllByText('Dar de Baja');
      
      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });
  });

  it('filters users by search term', async () => {
    renderUsuarios();
    
    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Buscar por nombre y/o apellido...');
    const searchButton = screen.getByText('Buscar');
    
    fireEvent.change(searchInput, { target: { value: 'Juan' } });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith('/usuarios?nombre=Juan');
    });
  });

  it('filters users by role', async () => {
    renderUsuarios();
    
    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument();
    });
    
    const roleFilter = screen.getByLabelText('Rol:');
    
    fireEvent.change(roleFilter, { target: { value: Rol.SOCIO } });
    
    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith(`/usuarios?rol=${Rol.SOCIO}`);
    });
  });

  it('filters users by status', async () => {
    renderUsuarios();
    
    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument();
    });
    
    const statusFilter = screen.getByLabelText('Estado:');
    
    fireEvent.change(statusFilter, { target: { value: 'true' } });
    
    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith('/usuarios?activo=true');
    });
  });

  it('has clear filters functionality', async () => {
    renderUsuarios();
    
    // Wait for component to fully load
    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument();
    });
    
    // Verify clear button exists and can be clicked
    const clearButton = screen.getByText('Limpiar Filtros');
    expect(clearButton).toBeInTheDocument();
    
    // Click should not throw an error
    fireEvent.click(clearButton);
  });

  it('handles API errors gracefully', async () => {
    mockedApi.get.mockRejectedValue({
      response: { data: { message: 'Error del servidor' } }
    });
    
    renderUsuarios();
    
    await waitFor(() => {
      expect(screen.getByText('Error del servidor')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    renderUsuarios();
    
    expect(screen.getByText('Cargando usuarios...')).toBeInTheDocument();
  });

  it('shows no data message when no users found', async () => {
    mockedApi.get.mockResolvedValue({ data: [] });
    
    renderUsuarios();
    
    await waitFor(() => {
      expect(screen.getByText('No se encontraron usuarios')).toBeInTheDocument();
    });
  });
});