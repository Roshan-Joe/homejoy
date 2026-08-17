import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, PhoneCall, LogOut, User, LayoutDashboard, Home, ShieldCheck, HeartHandshake, FileText } from 'lucide-react';

export const Navbar = ({ onRequestQuote }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRole = (user?.role || '').trim().toLowerCase();
  const getDashboardPath = () => {
    if (userRole === 'admin') return '/admin';
    if (userRole === 'elderly') return '/elderly/dashboard';
    if (userRole === 'caregiver') return '/caregiver/dashboard';
    return '/dashboard';
  };

  const getRoleBadgeClass = () => {
    if (userRole === 'admin') return 'badge-role-admin';
    if (userRole === 'caregiver') return 'badge-role-caregiver';
    if (userRole === 'elderly') return 'badge-role-elderly';
    return 'badge-role-family';
  };

  return (
    <header className="carer-header-wrapper">
      {/* Top Header Bar */}
      <div className="carer-top-bar">
        <div className="carer-top-bar-container">
          <div className="carer-top-bar-left">
            <span>✨ Welcome to HomeJoy Elder Care & AI Triage Platform</span>
          </div>
          <div className="carer-top-bar-right">
            <span style={{ fontSize: '0.825rem', opacity: 0.9 }}>24/7 AI Risk Monitoring & Senior Care</span>
          </div>
        </div>
      </div>


      {/* Main Navbar */}
      <nav className="carer-main-nav">
        <div className="carer-nav-container">
          {/* Logo */}
          <Link to="/" className="carer-brand-logo">
            <div className="carer-brand-icon">
              <HeartPulse size={24} color="#ffffff" />
            </div>
            <div className="carer-brand-title">
              <span className="carer-brand-name">HomeJoy</span>
              <span className="carer-brand-tagline">Elder Care & Triage</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="carer-nav-menu">
            <Link to="/" className="carer-nav-item active">HOME</Link>
            <a href="#about-section" className="carer-nav-item">ABOUT</a>
            <a href="#services-section" className="carer-nav-item">SERVICES</a>
            <a href="#contact-section" className="carer-nav-item">CONTACT</a>
          </div>

          {/* Right Action Bar */}
          <div className="carer-nav-actions">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link to={getDashboardPath()} className="btn btn-secondary btn-sm" style={{ borderRadius: 'var(--radius-pill)', fontWeight: 700 }}>
                  <LayoutDashboard size={16} />
                  <span>Portal</span>
                </Link>
                <button onClick={handleLogout} className="btn btn-danger btn-sm" style={{ borderRadius: 'var(--radius-pill)' }}>
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link to="/login" className="carer-nav-link-login">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" style={{ borderRadius: 'var(--radius-pill)', fontWeight: 700, padding: '10px 20px' }}>
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;


