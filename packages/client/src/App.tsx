import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { AppLayout } from './layouts/AppLayout';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { PrescricaoList } from './pages/prescricao/PrescricaoList';
import { NovaPrescricao } from './pages/prescricao/NovaPrescricao';
import { AtivosList } from './pages/ativos/AtivosList';
import { AtivoForm } from './pages/ativos/AtivoForm';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Authenticated */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="prescricoes" element={<PrescricaoList />} />
          <Route path="prescricoes/nova" element={<NovaPrescricao />} />
          <Route path="ativos" element={<AtivosList />} />
          <Route path="ativos/novo" element={<AtivoForm />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
