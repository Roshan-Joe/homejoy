import React, { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import elderlyClientService from '../../services/elderlyClientService';
import { WellnessRiskBadge } from '../../components/elderly/WellnessRiskBadge';
import { PageHeader } from './ElderlyProfilePage';

const INDICATORS = [
  { key: 'mood', label: 'Mood', emoji: '😊' },
  { key: 'appetite', label: 'Appetite', emoji: '🍽️' },
  { key: 'sleep_quality', label: 'Sleep', emoji: '😴' },
  { key: 'mobility_difficulty', label: 'Mobility', emoji: '🚶' },
  { key: 'medication_taken', label: 'Medication', emoji: '💊' },
];

export const WellnessHistoryPage = ({ onBack }) => {
  const [data, setData] = useState({ checkins: [], total: 0, page: 1, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    elderlyClientService.getWellnessHistory({ page, limit: 15 })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="animate-fade-in">
      <PageHeader icon={<History size={22} />} title="Wellness History" subtitle={`${data.total} check-in${data.total !== 1 ? 's' : ''} recorded`} onBack={onBack} />

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading history...</div>
      ) : data.checkins.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📋</div>
          <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>No Check-Ins Yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>Complete your first daily check-in to start tracking your wellness history.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {data.checkins.map(checkin => (
              <div key={checkin.id} className="glass-card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                      {new Date(checkin.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Recorded at {new Date(checkin.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <WellnessRiskBadge riskLevel={checkin.wellness_risk} />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: checkin.symptoms ? '12px' : 0 }}>
                  {INDICATORS.map(({ key, label, emoji }) => (
                    <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', borderRadius: '9999px', background: '#f1f5f9', fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 500 }}>
                      {emoji} <span style={{ color: 'var(--text-muted)' }}>{label}:</span> {checkin[key]}
                    </span>
                  ))}
                </div>

                {checkin.symptoms && (
                  <div style={{ marginTop: '10px', padding: '10px 14px', background: '#fef9c3', borderRadius: '8px', fontSize: '0.85rem', color: '#854d0e' }}>
                    🩺 <strong>Symptoms:</strong> {checkin.symptoms}
                  </div>
                )}
              </div>
            ))}
          </div>

          {data.total_pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px', alignItems: 'center' }}>
              <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ minHeight: '44px', padding: '0 18px' }}>← Newer</button>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>Page {page} of {data.total_pages}</span>
              <button className="btn btn-secondary" disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)} style={{ minHeight: '44px', padding: '0 18px' }}>Older →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
