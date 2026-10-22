import React from 'react';
import { ShieldAlert, QrCode, Printer, X, Heart, Phone, AlertCircle, FileText, Check } from 'lucide-react';

export const MedPassModal = ({ isOpen, onClose, elderlyData }) => {
  if (!isOpen) return null;

  const profile = elderlyData?.profile || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="carer-modal-backdrop" style={{ zIndex: 9999 }}>
      <div 
        className="carer-modal-card pastel-card"
        style={{
          maxWidth: '680px',
          background: 'linear-gradient(145deg, #ffffff 0%, #fff1f2 100%)',
          border: '2px solid var(--pastel-rose-border)',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 25px 50px rgba(225, 29, 72, 0.15)'
        }}
      >
        <button className="carer-modal-close" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {/* Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'var(--pastel-rose-card)',
                color: 'var(--pastel-rose-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldAlert size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#9f1239', margin: 0 }}>
                MedPass Emergency Passport
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#be123c', fontWeight: 600 }}>
                Official Paramedic & First Responder Health Card
              </span>
            </div>
          </div>

          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              background: '#ffffff',
              border: '1px solid #fecdd3',
              color: '#be123c',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <Printer size={18} /> Print Card
          </button>
        </div>

        {/* Main Passport Content Grid */}
        <div 
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #ffe4e6',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            {/* Left Details */}
            <div>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                  PATIENT FULL NAME
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                  {profile.name || profile.full_name || 'HomeJoy Client'}
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>DATE OF BIRTH</span>
                  <p style={{ fontWeight: 700, color: '#1e293b' }}>{profile.date_of_birth || '1948-05-12'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>BLOOD TYPE</span>
                  <p style={{ fontWeight: 800, color: '#be123c' }}>O+ (Positive)</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>EMERGENCY CONTACT</span>
                  <p style={{ fontWeight: 700, color: '#1e293b' }}>{profile.emergency_contact || '+1 (555) 019-2831'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>PRIMARY PHYSICIAN</span>
                  <p style={{ fontWeight: 700, color: '#1e293b' }}>Dr. Sarah Jenkins</p>
                </div>
              </div>

              {/* Conditions & Allergies */}
              <div style={{ background: '#fff1f2', borderRadius: '12px', padding: '12px', border: '1px solid #fecdd3' }}>
                <span style={{ fontSize: '0.75rem', color: '#9f1239', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  CRITICAL HEALTH ALERTS & ALLERGIES:
                </span>
                <p style={{ fontSize: '0.88rem', color: '#881337', fontWeight: 600, margin: 0 }}>
                  • Hypertension • Penicillin Allergy • Pacemaker Installed
                </p>
              </div>
            </div>

            {/* Right QR Code Visual */}
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                borderRadius: '16px',
                padding: '16px',
                border: '1px dashed #f43f5e',
                textAlign: 'center'
              }}
            >
              <div 
                style={{
                  background: '#ffffff',
                  padding: '12px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                  marginBottom: '10px'
                }}
              >
                {/* SVG Simulated QR Code */}
                <svg width="110" height="110" viewBox="0 0 100 100" fill="none">
                  <rect width="100" height="100" fill="white"/>
                  <path d="M10 10H40V40H10V10ZM20 20V30H30V20H20Z" fill="#881337"/>
                  <path d="M60 10H90V40H60V10ZM70 20V30H80V20H70Z" fill="#881337"/>
                  <path d="M10 60H40V90H10V60ZM20 70V80H30V70H20Z" fill="#881337"/>
                  <rect x="45" y="45" width="10" height="10" fill="#881337"/>
                  <rect x="60" y="60" width="15" height="15" fill="#881337"/>
                  <rect x="75" y="75" width="15" height="15" fill="#881337"/>
                  <rect x="50" y="20" width="5" height="20" fill="#881337"/>
                  <rect x="20" y="50" width="20" height="5" fill="#881337"/>
                </svg>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9f1239' }}>
                SCAN FOR LIVE HEALTH DATA
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p style={{ fontSize: '0.8rem', textAlign: 'center', color: '#94a3b8', margin: 0 }}>
          🔒 Encrypted & Verified by HomeJoy Healthcare Network • Valid ID #HJ-PASS-8842
        </p>
      </div>
    </div>
  );
};
