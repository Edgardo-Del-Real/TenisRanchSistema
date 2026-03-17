import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock the AuthContext to avoid API calls during testing
vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    loading: false,
  }),
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Club de Tenis')).toBeInTheDocument();
  });
});