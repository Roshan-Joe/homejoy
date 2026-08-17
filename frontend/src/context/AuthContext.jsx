import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle, ShieldCheck, LogOut, RefreshCw } from 'lucide-react';
import api from '../services/api';

const AuthContext = createContext(null);

// 30 Minutes Inactivity Timeout Constants for Healthcare Security Compliance
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_THRESHOLD_MS = 28 * 60 * 1000; // 28 minutes (Warning appears 2 minutes before logout)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('homejoy_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('homejoy_token') || null);
  const [loading, setLoading] = useState(true);

  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(120);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  // Logout handler
  const logout = useCallback((isExpired = false) => {
    setToken(null);
    setUser(null);
    setShowWarning(false);
    localStorage.removeItem('homejoy_token');
    localStorage.removeItem('homejoy_user');
    if (isExpired) {
      setSessionExpiredNotice(true);
    }
  }, []);

  // Fetch current user from server on load if token exists
  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.data);
          localStorage.setItem('homejoy_user', JSON.stringify(res.data));
        } catch (err) {
          console.error("Session verification failed:", err);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    verifyUser();
  }, [token, logout]);

  // Reset activity timestamp on user interaction
  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
    if (showWarning) {
      setShowWarning(false);
    }
  }, [showWarning]);

  // Listen to user activity events
  useEffect(() => {
    if (!token || !user) return;

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleUserActivity = () => {
      setLastActivity(Date.now());
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [token, user]);

  // Periodic Inactivity Checker
  useEffect(() => {
    if (!token || !user) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;

      if (elapsed >= INACTIVITY_LIMIT_MS) {
        console.warn("Session expired due to 30 minutes of inactivity.");
        logout(true);
      } else if (elapsed >= WARNING_THRESHOLD_MS) {
        const remaining = Math.max(0, Math.ceil((INACTIVITY_LIMIT_MS - elapsed) / 1000));
        setSecondsRemaining(remaining);
        setShowWarning(true);
      } else {
        if (showWarning) setShowWarning(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [token, user, lastActivity, showWarning, logout]);

  // Extend Session Handler
  const extendSession = async () => {
    setLastActivity(Date.now());
    setShowWarning(false);
    try {
      await api.get('/api/auth/me');
    } catch (err) {
      console.error("Failed to extend session:", err);
    }
  };

  const register = async (userData) => {
    const res = await api.post('/api/auth/register', userData);
    const { access_token, user: loggedUser } = res.data;
    
    setToken(access_token);
    setUser(loggedUser);
    setLastActivity(Date.now());
    setSessionExpiredNotice(false);
    localStorage.setItem('homejoy_token', access_token);
    localStorage.setItem('homejoy_user', JSON.stringify(loggedUser));
    return loggedUser;
  };

  const login = async (credentials) => {
    const res = await api.post('/api/auth/login', credentials);
    const { access_token, user: loggedUser } = res.data;
    
    setToken(access_token);
    setUser(loggedUser);
    setLastActivity(Date.now());
    setSessionExpiredNotice(false);
    localStorage.setItem('homejoy_token', access_token);
    localStorage.setItem('homejoy_user', JSON.stringify(loggedUser));
    return loggedUser;
  };

  const googleLogin = async (credential, role = 'Elderly') => {
    const res = await api.post('/api/auth/google', { credential, role });
    const { access_token, user: loggedUser } = res.data;
    
    setToken(access_token);
    setUser(loggedUser);
    setLastActivity(Date.now());
    setSessionExpiredNotice(false);
    localStorage.setItem('homejoy_token', access_token);
    localStorage.setItem('homejoy_user', JSON.stringify(loggedUser));
    return loggedUser;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      sessionExpiredNotice,
      clearExpiredNotice: () => setSessionExpiredNotice(false),
      register, 
      login, 
      googleLogin, 
      logout 
    }}>
      {children}

      {/* Inactivity Warning Modal */}
      {showWarning && user && (
        <div className="carer-modal-backdrop" style={{ zIndex: 9999 }}>
          <div className="carer-modal-card" style={{ maxWidth: '440px', padding: '32px', textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#fff7ed',
              color: '#c2410c',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Clock size={32} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Session Inactivity Warning
            </h3>

            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '20px' }}>
              For your health data privacy and security, your HomeJoy session will automatically expire in:
            </p>

            <div style={{
              fontSize: '2rem',
              fontWeight: 900,
              color: '#c2410c',
              background: '#fff7ed',
              border: '2px dashed #ffedd5',
              padding: '12px',
              borderRadius: '12px',
              marginBottom: '24px',
              letterSpacing: '1px'
            }}>
              {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, '0')}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => logout(true)} 
                className="btn btn-secondary" 
                style={{ flex: 1, minHeight: '48px', fontWeight: 700 }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
              <button 
                onClick={extendSession} 
                className="btn btn-primary" 
                style={{ flex: 1, minHeight: '48px', fontWeight: 800 }}
              >
                <RefreshCw size={16} />
                <span>Extend Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

