import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, User, Heart, Building2, Stethoscope, Pill, Phone, Clock,
  ShieldAlert, Activity, FileText, CheckCircle2, AlertTriangle, AlertCircle, Info, Calendar
} from 'lucide-react';
import caregiverPortalService from '../../services/caregiverPortalService';
import { WellnessRiskBadge } from '../../components/elderly/WellnessRiskBadge';

export const CaregiverElderlyDetailView = ({ elderlyId, onBack, onSendReminder }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('overview'); // overview | health | meds | contacts | history | report

  // History state
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  // Report state
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [reminderSending, setReminderSending] = useState(false);
  const [reminderMsg, setReminderMsg] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await caregiverPortalService.getElderlyDetails(elderlyId);
        setData(res);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || 'Failed to load patient details or access denied.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [elderlyId]);

  // Load history when tab is opened
  useEffect(() => {
    if (activeSubTab === 'history') {
      const fetchHistory = async () => {
        try {
          setHistoryLoading(true);
          const res = await caregiverPortalService.getElderlyHistory(elderlyId, { page: historyPage, limit: 15 });
          setHistoryData(res);
        } catch (err) {
          console.error(err);
        } finally {
          setHistoryLoading(false);
        }
      };
      fetchHistory();
    }
  }, [activeSubTab, elderlyId, historyPage]);

  // Handle report generation
  const handleGenerateReport = async (e) => {
    if (e) e.preventDefault();
    try {
      setReportLoading(true);
      const res = await caregiverPortalService.getCareReport({
        elderlyId,
        startDate: reportStartDate,
        endDate: reportEndDate
      });
      setReportData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  };

  const handleReminder = async () => {
    try {
      setReminderSending(true);
      setReminderMsg('');
      const res = await caregiverPortalService.sendCheckinReminder(elderlyId);
      setReminderMsg(res.message);
      setTimeout(() => setReminderMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setReminderSending(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
        <Activity size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
        <div style={{ fontWeight: 600, color: '#475569' }}>Loading patient profile & telemetry...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-card" style={{ padding: '36px', textAlign: 'center' }}>
        <AlertCircle size={36} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
        <h3 style={{ color: '#991b1b', margin: '0 0 8px 0' }}>{error || 'Patient Profile Not Found'}</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
          This client may not be assigned to your caregiver account or has been reassigned.
        </p>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} style={{ marginRight: '6px' }} />
          <span>Back to Assigned List</span>
        </button>
      </div>
    );
  }

  const { profile, health_info, hospital_info, doctor_info, medications, emergency_contacts, latest_checkin, explainable_risk } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Bar with Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} />
          <span>Back to List</span>
        </button>

        <button
          className="btn btn-primary"
          onClick={handleReminder}
          disabled={reminderSending}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#d97706', borderColor: '#d97706' }}
        >
          <Clock size={16} />
          <span>{reminderSending ? 'Sending Reminder...' : 'Send Check-in Reminder'}</span>
        </button>
      </div>

      {reminderMsg && (
        <div className="alert alert-success animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          <span>{reminderMsg}</span>
        </div>
      )}

      {/* Patient Header Card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-light)',
              color: 'var(--primary)', fontWeight: 700, fontSize: '1.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {profile.profileImage ? (
                <img src={profile.profileImage} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile.name.charAt(0)
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>{profile.full_name}</h1>
                <WellnessRiskBadge level={profile.risk_level} size="md" />
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
                {profile.age ? `${profile.age} years old` : 'Age N/A'} • {profile.gender || 'Gender unstated'} • Blood Group: <strong>{profile.blood_group || 'N/A'}</strong>
              </div>
              {profile.phone && (
                <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} style={{ color: 'var(--primary)' }} />
                  <span>{profile.phone}</span>
                  {profile.address && <span>• {profile.address}</span>}
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '8px 14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#475569' }}>
            <div>Read-Only Caregiver Access</div>
            <div style={{ fontWeight: 600, color: '#059669', marginTop: '2px' }}>✓ Server Authorized</div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '24px', paddingTop: '16px',
          borderTop: '1px solid #e2e8f0'
        }}>
          {[
            { id: 'overview', label: 'Overview & AI Risk', icon: Activity },
            { id: 'health', label: 'Health & Hospital', icon: Heart },
            { id: 'meds', label: `Medications (${medications.length})`, icon: Pill },
            { id: 'contacts', label: `Contacts (${emergency_contacts.length})`, icon: Phone },
            { id: 'history', label: 'Wellness History', icon: Calendar },
            { id: 'report', label: 'Care Report', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600,
                  background: active ? 'var(--primary)' : 'transparent',
                  color: active ? '#fff' : '#64748b',
                  border: active ? '1px solid var(--primary)' : '1px solid transparent',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Tab Content */}
      {activeSubTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* 6.9 Explainable AI Risk Indicator Card */}
          {explainable_risk && (
            <div className="glass-card" style={{
              padding: '24px', gridColumn: '1 / -1',
              borderLeft: explainable_risk.risk_level === 'High' ? '6px solid #ef4444' : (explainable_risk.risk_level === 'Moderate' ? '6px solid #f59e0b' : '6px solid #10b981')
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldAlert size={24} style={{ color: explainable_risk.risk_level === 'High' ? '#ef4444' : (explainable_risk.risk_level === 'Moderate' ? '#f59e0b' : '#10b981') }} />
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                      Explainable AI Wellness Risk Assessment
                    </h2>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Confidence Metric: <strong>{explainable_risk.confidence_score}%</strong> • Model Status: Operational
                    </div>
                  </div>
                </div>
                <WellnessRiskBadge level={explainable_risk.risk_level} size="md" />
              </div>

              <p style={{ fontSize: '0.95rem', color: '#334155', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                {explainable_risk.summary}
              </p>

              {/* Contributing Factors */}
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 10px 0', color: '#475569' }}>
                Contributing Risk Telemetry Factors:
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {explainable_risk.contributing_factors.map((f, idx) => (
                  <div key={idx} style={{
                    padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'flex-start', gap: '10px'
                  }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700,
                      background: f.impact_level === 'High' ? '#fee2e2' : (f.impact_level === 'Medium' ? '#fef3c7' : '#e0e7ff'),
                      color: f.impact_level === 'High' ? '#b91c1c' : (f.impact_level === 'Medium' ? '#b45309' : '#3730a3')
                    }}>
                      {f.impact_level} Impact
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>{f.factor_name}</div>
                      <div style={{ fontSize: '0.83rem', color: '#64748b', marginTop: '2px' }}>{f.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Non-diagnostic disclaimer */}
              <div style={{
                padding: '10px 14px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1',
                fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <Info size={16} style={{ color: '#0284c7', flexShrink: 0 }} />
                <span>{explainable_risk.safety_disclaimer}</span>
              </div>
            </div>
          )}

          {/* Latest Daily Check-in Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 14px 0', color: '#1e293b' }}>
              Latest Telemetry Check-in
            </h3>

            {!latest_checkin ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                No daily check-in submitted for this client today yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Check-in Date:</span>
                  <span style={{ fontWeight: 600 }}>{latest_checkin.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Medication Logged:</span>
                  <span style={{ fontWeight: 600, color: latest_checkin.medication_taken ? '#059669' : '#dc2626' }}>
                    {latest_checkin.medication_taken ? '✓ Taken' : '✕ Missed'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Appetite:</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{latest_checkin.appetite}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Sleep Quality:</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{latest_checkin.sleep_quality}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Mobility Rating:</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{latest_checkin.mobility_difficulty}</span>
                </div>
                {latest_checkin.symptoms && (
                  <div style={{ paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', display: 'block' }}>Reported Symptoms:</span>
                    <span style={{ fontWeight: 600, color: '#b91c1c' }}>{latest_checkin.symptoms}</span>
                  </div>
                )}
                {latest_checkin.notes && (
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Patient Notes:</span>
                    <span style={{ fontStyle: 'italic', color: '#475569' }}>"{latest_checkin.notes}"</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Health & Hospital Sub-Tab */}
      {activeSubTab === 'health' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Heart size={20} style={{ color: '#ef4444' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Health Information</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Known Chronic Conditions:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {health_info.conditions && health_info.conditions.length > 0 ? (
                    health_info.conditions.map((c, idx) => (
                      <span key={idx} style={{ padding: '3px 10px', borderRadius: '12px', background: '#fee2e2', color: '#991b1b', fontSize: '0.82rem', fontWeight: 600 }}>
                        {c}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#94a3b8' }}>None recorded</span>
                  )}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Allergies:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {health_info.allergies && health_info.allergies.length > 0 ? (
                    health_info.allergies.map((a, idx) => (
                      <span key={idx} style={{ padding: '3px 10px', borderRadius: '12px', background: '#fef3c7', color: '#92400e', fontSize: '0.82rem', fontWeight: 600 }}>
                        {a}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#94a3b8' }}>No known allergies</span>
                  )}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Medical & Care Notes:</span>
                <p style={{ margin: '4px 0 0 0', color: '#334155', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                  {health_info.medical_notes || 'No custom medical notes provided.'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Building2 size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Hospital & Doctor Info</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>Hospital Name:</div>
                <div style={{ color: '#475569' }}>{hospital_info.hospital_name || 'General Hospital'}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Dept: {hospital_info.department || 'Geriatric'} • Contact: {hospital_info.contact_number || 'N/A'}</div>
              </div>
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>Assigned Primary Doctor:</div>
                <div style={{ color: '#475569' }}>{doctor_info.doctor_name}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{doctor_info.specialization} • {doctor_info.contact}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medications Sub-Tab */}
      {activeSubTab === 'meds' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px 0' }}>Assigned Medications Schedule</h3>

          {medications.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
              No medications currently registered for this client.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Medicine Name</th>
                    <th style={{ padding: '10px 12px' }}>Dosage</th>
                    <th style={{ padding: '10px 12px' }}>Frequency</th>
                    <th style={{ padding: '10px 12px' }}>Intake Time</th>
                    <th style={{ padding: '10px 12px' }}>Food Relation</th>
                    <th style={{ padding: '10px 12px' }}>Adherence Status</th>
                  </tr>
                </thead>
                <tbody>
                  {medications.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#1e293b' }}>{m.medicine_name}</td>
                      <td style={{ padding: '12px' }}>{m.dosage}</td>
                      <td style={{ padding: '12px' }}>{m.frequency}</td>
                      <td style={{ padding: '12px' }}>{m.intake_time}</td>
                      <td style={{ padding: '12px' }}>{m.food_relation}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600,
                          background: m.status === 'taken' ? '#d1fae5' : (m.status === 'missed' ? '#fee2e2' : '#fef3c7'),
                          color: m.status === 'taken' ? '#047857' : (m.status === 'missed' ? '#b91c1c' : '#b45309'),
                          textTransform: 'capitalize'
                        }}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Emergency Contacts Sub-Tab */}
      {activeSubTab === 'contacts' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px 0' }}>Emergency Contacts</h3>
          {emergency_contacts.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
              No emergency contacts added yet by client.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {emergency_contacts.map((c) => (
                <div key={c.id} style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                    {c.contact_type} Contact
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>{c.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Relationship: {c.relationship}</div>
                  <div style={{ marginTop: '10px', fontWeight: 600, color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} />
                    <span>{c.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Wellness History Sub-Tab */}
      {activeSubTab === 'history' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px 0' }}>Chronological Check-in Telemetry History</h3>

          {historyLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading history log...</div>
          ) : !historyData || historyData.checkins.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No check-in history records found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Date</th>
                    <th style={{ padding: '10px' }}>Medication</th>
                    <th style={{ padding: '10px' }}>Sleep</th>
                    <th style={{ padding: '10px' }}>Mobility</th>
                    <th style={{ padding: '10px' }}>Mood</th>
                    <th style={{ padding: '10px' }}>Symptoms</th>
                    <th style={{ padding: '10px' }}>Wellness Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.checkins.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{c.date}</td>
                      <td style={{ padding: '10px' }}>{c.medication_taken ? '✓ Taken' : '✕ Missed'}</td>
                      <td style={{ padding: '10px', textTransform: 'capitalize' }}>{c.sleep_quality}</td>
                      <td style={{ padding: '10px', textTransform: 'capitalize' }}>{c.mobility_difficulty}</td>
                      <td style={{ padding: '10px', textTransform: 'capitalize' }}>{c.mood}</td>
                      <td style={{ padding: '10px' }}>{c.symptoms || '-'}</td>
                      <td style={{ padding: '10px' }}><WellnessRiskBadge level={c.wellness_risk} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Care Summary Report Sub-Tab */}
      {activeSubTab === 'report' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 14px 0' }}>Generate Care Summary Report</h3>
          
          <form onSubmit={handleGenerateReport} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end', marginBottom: '24px' }}>
            <div>
              <label className="form-label">Start Date</label>
              <input type="date" className="form-input" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input type="date" className="form-input" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={reportLoading}>
              {reportLoading ? 'Generating...' : 'Generate Summary'}
            </button>
          </form>

          {reportData && (
            <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1.05rem', color: '#1e293b' }}>
                Summary for {reportData.elderly_name} ({reportData.start_date} to {reportData.end_date})
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Check-ins</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{reportData.total_checkins}</div>
                </div>
                <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Medication Adherence</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#047857' }}>{reportData.medication_adherence_rate}%</div>
                </div>
                <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Alerts Triggered</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#b91c1c' }}>{reportData.total_alerts}</div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>
                <strong>Caregiver Summary Notes:</strong> {reportData.summary_notes}
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
