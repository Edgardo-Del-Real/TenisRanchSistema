import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Turnos from './pages/Turnos';
import Perfil from './pages/Perfil';
import Usuarios from './pages/Usuarios';
import Canchas from './pages/Canchas';
import Tarifas from './pages/Tarifas';
import Cuotas from './pages/Cuotas';
import MisCuotas from './pages/MisCuotas';
import PagosLuz from './pages/PagosLuz';
import Estadisticas from './pages/Estadisticas';
import { Rol } from './types';

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <Layout>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/" replace /> : <Register />} 
        />
        
        {/* Protected routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/turnos" 
          element={
            <ProtectedRoute>
              <Turnos />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/perfil" 
          element={
            <ProtectedRoute>
              <Perfil />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin-only routes - placeholders for future implementation */}
        <Route 
          path="/usuarios" 
          element={
            <ProtectedRoute allowedRoles={[Rol.ADMINISTRADOR]}>
              <Usuarios />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/canchas" 
          element={
            <ProtectedRoute allowedRoles={[Rol.ADMINISTRADOR]}>
              <Canchas />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tarifas" 
          element={
            <ProtectedRoute allowedRoles={[Rol.ADMINISTRADOR]}>
              <Tarifas />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cuotas" 
          element={
            <ProtectedRoute allowedRoles={[Rol.ADMINISTRADOR]}>
              <Cuotas />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pagos-luz" 
          element={
            <ProtectedRoute allowedRoles={[Rol.ADMINISTRADOR]}>
              <PagosLuz />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/estadisticas" 
          element={
            <ProtectedRoute allowedRoles={[Rol.ADMINISTRADOR]}>
              <Estadisticas />
            </ProtectedRoute>
          } 
        />
        
        {/* Socio-only routes */}
        <Route 
          path="/mis-cuotas" 
          element={
            <ProtectedRoute allowedRoles={[Rol.SOCIO]}>
              <MisCuotas />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
