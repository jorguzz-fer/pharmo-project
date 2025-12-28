import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PrescriptionWizard } from './pages/PrescriptionWizard';
import { MainLayout } from './layouts/MainLayout';
import { useAuthStore } from './store/auth';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminFollowUps } from './pages/admin/AdminFollowUps';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminClinics } from './pages/admin/AdminClinics';
import { AdminClinicDetails } from './pages/admin/AdminClinicDetails';
import { AdminClinicForm } from './pages/admin/AdminClinicForm';
import { AdminVeterinarians } from './pages/admin/AdminVeterinarians';
import { AdminVeterinarianDetails } from './pages/admin/AdminVeterinarianDetails';
import { AdminVeterinarianForm } from './pages/admin/AdminVeterinarianForm';
import { OrderStatus } from './pages/OrderStatus';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { ClinicLogin } from './pages/clinic/ClinicLogin';
import { ClinicForgotPassword } from './pages/clinic/ClinicForgotPassword';
import { ClinicResetPassword } from './pages/clinic/ClinicResetPassword';
import { ClinicDashboard } from './pages/clinic/ClinicDashboard';
import { ClinicPrescriptions } from './pages/clinic/ClinicPrescriptions';
import { ClinicVeterinarians } from './pages/clinic/ClinicVeterinarians';
import { ClinicLayout } from './layouts/ClinicLayout';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'VET' | 'ADMIN' }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    // Redirect to appropriate login page based on required role
    return <Navigate to={role === 'ADMIN' ? '/admin/login' : '/login'} />;
  }

  if (role && user?.role !== role) {
    // Redirect based on role if trying to access unauthorized area
    return user?.role === 'ADMIN' ? <Navigate to="/admin/dashboard" /> : <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Clinic Routes */}
        <Route path="/clinica/login" element={<ClinicLogin />} />
        <Route path="/clinica/forgot-password" element={<ClinicForgotPassword />} />
        <Route path="/clinica/reset-password" element={<ClinicResetPassword />} />

        {/* Clinic Dashboard Routes */}
        <Route path="/clinica" element={<ClinicLayout />}>
          <Route path="dashboard" element={<ClinicDashboard />} />
          <Route path="prescricoes" element={<ClinicPrescriptions />} />
          <Route path="veterinarios" element={<ClinicVeterinarians />} />
        </Route>

        {/* Vet Routes */}
        <Route path="/" element={
          <ProtectedRoute role="VET">
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="prescricoes/nova" element={<PrescriptionWizard />} />
          <Route path="pedidos/:id" element={<OrderStatus />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute role="ADMIN">
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="follow-ups" element={<AdminFollowUps />} />
          <Route path="relatorios" element={<AdminReports />} />
          <Route path="clinicas" element={<AdminClinics />} />
          <Route path="clinicas/nova" element={<AdminClinicForm />} />
          <Route path="clinicas/:id" element={<AdminClinicDetails />} />
          <Route path="clinicas/:id/editar" element={<AdminClinicForm />} />
          <Route path="veterinarios" element={<AdminVeterinarians />} />
          <Route path="veterinarios/novo" element={<AdminVeterinarianForm />} />
          <Route path="veterinarios/:id" element={<AdminVeterinarianDetails />} />
          <Route path="veterinarios/:id/editar" element={<AdminVeterinarianForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
