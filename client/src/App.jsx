import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientProfile from './pages/PatientProfile';
import Monitoring from './pages/Monitoring';
import EmergencyCenter from './pages/EmergencyCenter';
import PatientHistory from './pages/PatientHistory';
import Analytics from './pages/Analytics';
import Devices from './pages/Devices';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Clinical Workspace */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout title="Hospital Dashboard" />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="patients" element={<Patients />} />
              <Route path="patients/:id" element={<PatientProfile />} />
              <Route path="monitoring" element={<Monitoring />} />
              <Route path="emergency" element={<EmergencyCenter />} />
              <Route path="history" element={<PatientHistory />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="devices" element={<Devices />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
