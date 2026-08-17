import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * CaregiverRoute — renders children only if the logged-in user has role 'Caregiver'.
 * Non-caregiver authenticated users are redirected to their appropriate home.
 * Unauthenticated users are redirected to /login.
 */
export const CaregiverRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          Loading HomeJoy Caregiver Portal...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user.role || '').trim().toLowerCase();
  if (role !== 'caregiver') {
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'elderly') return <Navigate to="/elderly/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
