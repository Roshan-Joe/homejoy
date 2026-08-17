import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          Verifying Admin Credentials...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user.role || '').trim().toLowerCase();
  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
