import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ElderlyRoute — renders children only if the logged-in user has role 'Elderly'.
 * Non-elderly authenticated users are redirected to their appropriate home (/dashboard).
 * Unauthenticated users are redirected to /login.
 */
export const ElderlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          Loading HomeJoy...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user.role || '').trim().toLowerCase();
  if (role !== 'elderly') {
    // Admin goes to /admin, others to /dashboard
    return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
};
