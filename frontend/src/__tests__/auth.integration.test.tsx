import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import Login from '../pages/Login';
import Register from '../pages/Register';

// Mock the API
vi.mock('../lib/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Login Page', () => {
    it('renders login form with all required fields', () => {
      renderWithRouter(<Login />);
      
      expect(screen.getByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();
      expect(screen.getByLabelText('Correo Electrónico')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
      expect(screen.getByText(/¿No tienes cuenta?/)).toBeInTheDocument();
    });
  });

  describe('Register Page', () => {
    it('renders registration form with all required fields', () => {
      renderWithRouter(<Register />);
      
      expect(screen.getByRole('heading', { name: 'Registro' })).toBeInTheDocument();
      expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
      expect(screen.getByLabelText('Apellido')).toBeInTheDocument();
      expect(screen.getByLabelText('Correo Electrónico')).toBeInTheDocument();
      expect(screen.getByLabelText('Teléfono')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /registrarse/i })).toBeInTheDocument();
      expect(screen.getByText(/¿Ya tienes cuenta?/)).toBeInTheDocument();
    });

    it('has proper form validation attributes', () => {
      renderWithRouter(<Register />);
      
      const passwordInput = screen.getByLabelText('Contraseña');
      expect(passwordInput).toHaveAttribute('minLength', '8');
      expect(passwordInput).toHaveAttribute('required');
      
      const emailInput = screen.getByLabelText('Correo Electrónico');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
    });
  });
});