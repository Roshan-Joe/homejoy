import React, { useState } from 'react';
import { Search, Filter, Users, ChevronRight, Phone, MapPin, Calendar, Clock, AlertCircle } from 'lucide-react';
import { WellnessRiskBadge } from '../../components/elderly/WellnessRiskBadge';

export const CaregiverElderlyListView = ({ assignedElderly = [], onSelectElderly }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [checkinFilter, setCheckinFilter] = useState('all');

  const filteredElderly = assignedElderly.filter(item => {
    const matchesSearch = !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.phone && item.phone.includes(searchTerm));

    const matchesRisk = riskFilter === 'all' || item.risk_level.toLowerCase() === riskFilter.toLowerCase();

    let matchesCheckin = true;
    if (checkinFilter === 'checked_in') {
      matchesCheckin = item.last_checkin_date !== 'No check-in today';
    } else if (checkinFilter === 'missed') {
      matchesCheckin = item.last_checkin_date === 'No check-in today';
    }

    return matchesSearch && matchesRisk && matchesCheckin;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controls */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Assigned Elderly Patients</h1>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '4px 0 0 0' }}>
              Showing {filteredElderly.length} of {assignedElderly.length} clients assigned to your care.
            </p>
          </div>
        </div>

        {/* Filters bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Risk Level Filter */}
          <div style={{ minWidth: '150px' }}>
            <select
              className="form-input"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="moderate">Moderate Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>

          {/* Check-in Filter */}
          <div style={{ minWidth: '160px' }}>
            <select
              className="form-input"
              value={checkinFilter}
              onChange={(e) => setCheckinFilter(e.target.value)}
            >
              <option value="all">All Check-in Statuses</option>
              <option value="checked_in">Checked-In Today</option>
              <option value="missed">Missed Today</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Elderly Cards */}
      {filteredElderly.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
          <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 600 }}>No assigned elderly patients match your filters</h3>
          <p style={{ fontSize: '0.88rem', margin: 0 }}>Try adjusting your search criteria or resetting filters.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '18px'
        }}>
          {filteredElderly.map((item) => (
            <div
              key={item.id}
              className="glass-card hover-card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                gap: '16px',
                borderTop: item.risk_level === 'High' ? '4px solid #ef4444' : (item.risk_level === 'Moderate' ? '4px solid #f59e0b' : '4px solid #10b981')
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-light)',
                      color: 'var(--primary)', fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {item.profileImage ? (
                        <img src={item.profileImage} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        item.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>{item.name}</h3>
                      <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                        {item.age ? `Age ${item.age}` : 'Age N/A'} {item.gender ? `• ${item.gender}` : ''}
                      </div>
                    </div>
                  </div>
                  <WellnessRiskBadge level={item.risk_level} size="sm" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#475569' }}>
                  {item.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} style={{ color: '#94a3b8' }} />
                      <span>{item.phone}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} style={{ color: '#94a3b8' }} />
                    <span>Last check-in: <strong>{item.last_checkin_date} {item.last_checkin_time !== '-' ? `(${item.last_checkin_time})` : ''}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} style={{ color: '#94a3b8' }} />
                    <span>Meds Status: <span style={{
                      fontWeight: 600,
                      color: item.medication_status === 'Taken' ? '#059669' : (item.medication_status === 'Missed' ? '#dc2626' : '#d97706')
                    }}>{item.medication_status}</span></span>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary btn-full"
                style={{ fontSize: '0.88rem', padding: '10px' }}
                onClick={() => onSelectElderly(item.id)}
              >
                <span>View Patient Details & AI Risk</span>
                <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
