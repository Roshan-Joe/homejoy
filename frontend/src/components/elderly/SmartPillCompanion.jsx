import React, { useState } from 'react';
import { Pill, Sun, Moon, Sunrise, Sunset, CheckCircle2, Clock, Plus, Flame } from 'lucide-react';

export const SmartPillCompanion = ({ medications = [] }) => {
  const [takenSlots, setTakenSlots] = useState({
    morning: true,
    afternoon: false,
    evening: false,
    night: false
  });

  const slots = [
    { key: 'morning', title: 'Morning', icon: Sunrise, time: '8:00 AM', color: '#f59e0b', bg: '#fef3c7', border: '#fde68a', med: 'Lisinopril 10mg (Blood Pressure)' },
    { key: 'afternoon', title: 'Afternoon', icon: Sun, time: '1:00 PM', color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd', med: 'Multivitamin & Calcium 500mg' },
    { key: 'evening', title: 'Evening', icon: Sunset, time: '6:30 PM', color: '#7e22ce', bg: '#f3e8ff', border: '#e9d5ff', med: 'Metformin 500mg (Blood Sugar)' },
    { key: 'night', title: 'Night', icon: Moon, time: '9:30 PM', color: '#3730a3', bg: '#e0e7ff', border: '#c7d2fe', med: 'Melatonin 3mg (Sleep Support)' }
  ];

  const toggleTakePill = (key) => {
    setTakenSlots((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const takenCount = Object.values(takenSlots).filter(Boolean).length;

  return (
    <div 
      className="pastel-card pastel-card-mint" 
      style={{ 
        padding: '24px', 
        borderRadius: '24px', 
        marginBottom: '28px',
        border: '2px solid var(--pastel-mint-border)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'var(--pastel-mint-card)',
              color: 'var(--pastel-mint-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Pill size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#14532d', margin: 0 }}>
              Smart Pill Time-of-Day Companion
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 600 }}>
              Daily Medication Matrix & Adherence Tracker
            </span>
          </div>
        </div>

        <div className="pastel-badge pastel-badge-mint" style={{ background: '#ffffff' }}>
          <Flame size={16} fill="#16a34a" /> 7-Day Adherence Streak! ({takenCount}/4 Taken)
        </div>
      </div>

      {/* 4 Time-of-Day Slots Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {slots.map((s) => {
          const IconComp = s.icon;
          const isTaken = takenSlots[s.key];

          return (
            <div 
              key={s.key}
              onClick={() => toggleTakePill(s.key)}
              style={{
                background: isTaken ? s.bg : '#ffffff',
                border: `2px solid ${isTaken ? s.border : '#e2e8f0'}`,
                borderRadius: '18px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                position: 'relative',
                boxShadow: isTaken ? 'none' : '0 4px 12px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: s.color, fontWeight: 800, fontSize: '0.9rem' }}>
                  <IconComp size={18} /> {s.title}
                </div>
                {isTaken && <CheckCircle2 size={20} color={s.color} fill={s.bg} />}
              </div>

              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>
                <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} /> {s.time}
              </div>

              <p style={{ fontSize: '0.82rem', color: isTaken ? '#1e293b' : '#64748b', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
                {s.med}
              </p>

              <button
                style={{
                  marginTop: '12px',
                  width: '100%',
                  padding: '8px',
                  borderRadius: '10px',
                  background: isTaken ? s.color : '#f1f5f9',
                  color: isTaken ? '#ffffff' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {isTaken ? '✓ Taken' : 'Mark Taken'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
