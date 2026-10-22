import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, LayoutDashboard, LogOut, Menu, X, ArrowRight, Shield } from 'lucide-react';

export const Navbar = ({ onRequestQuote }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const userRole = (user?.role || '').trim().toLowerCase();
  const getDashboardPath = () => {
    if (userRole === 'admin') return '/admin';
    if (userRole === 'elderly') return '/elderly/dashboard';
    if (userRole === 'caregiver') return '/caregiver/dashboard';
    return '/dashboard';
  };

  const isHome = location.pathname === '/';

  return (
    <header className="homejoy-header" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
      boxShadow: '0 2px 10px rgba(0, 50, 40, 0.03)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px',
        padding: '0 24px'
      }}>
        {/* Brand Logo */}
        <Link to="/" className="homejoy-brand" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
          color: '#0b1f28'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#00685b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 8px rgba(0, 104, 91, 0.25)'
          }}>
            <Heart size={20} fill="#ffffff" stroke="none" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: '#0b1f28'
            }}>
              HomeJoy
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#00685b',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginTop: '2px'
            }}>
              Calm care. Clearer days.
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="homejoy-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <Link to="/" style={{
            fontSize: '0.92rem',
            fontWeight: isHome ? 700 : 500,
            color: isHome ? '#00685b' : '#4a6068',
            textDecoration: 'none',
            transition: 'all 0.2s'
          }}>
            Home
          </Link>
          <a href="#features" style={{
            fontSize: '0.92rem',
            fontWeight: 500,
            color: '#4a6068',
            textDecoration: 'none',
            transition: 'all 0.2s'
          }}>
            Care Rhythm
          </a>
          <a href="#disclaimer" style={{
            fontSize: '0.92rem',
            fontWeight: 500,
            color: '#4a6068',
            textDecoration: 'none',
            transition: 'all 0.2s'
          }}>
            About
          </a>
        </nav>

        {/* Right CTA Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link to={getDashboardPath()} className="btn" style={{
                borderRadius: '9999px',
                backgroundColor: '#e6f4f1',
                color: '#00685b',
                fontWeight: 700,
                padding: '8px 18px',
                fontSize: '0.88rem',
                border: '1px solid #b2e0d8',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none'
              }}>
                <LayoutDashboard size={16} />
                <span>My Portal</span>
              </Link>
              <button
                onClick={handleLogout}
                className="btn"
                title="Sign Out"
                aria-label="Sign Out"
                style={{
                  borderRadius: '9999px',
                  backgroundColor: '#fff1f2',
                  color: '#be123c',
                  border: '1px solid #fecdd3',
                  padding: '8px 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                <LogOut size={16} />
                <span className="hide-mobile">Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link to="/login" style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#0b1f28',
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '9999px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}>
                <span>Sign in</span>
                <ArrowRight size={14} />
              </Link>

              <Link to="/register" style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#ffffff',
                textDecoration: 'none',
                padding: '8px 20px',
                borderRadius: '9999px',
                backgroundColor: '#00685b',
                boxShadow: '0 4px 12px rgba(0, 104, 91, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}>
                <span>Get Started</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="homejoy-mobile-toggle"
            aria-label="Toggle menu"
            style={{
              display: 'none',
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: '#f1f5f9',
              color: '#0b1f28'
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: '1rem', fontWeight: 600, color: '#0b1f28', textDecoration: 'none' }}
          >
            Home
          </Link>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: '1rem', fontWeight: 500, color: '#4a6068', textDecoration: 'none' }}
          >
            Care Rhythm
          </a>
          <a
            href="#disclaimer"
            onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: '1rem', fontWeight: 500, color: '#4a6068', textDecoration: 'none' }}
          >
            About
          </a>
        </div>
      )}
    </header>
  );
};

export default Navbar;



