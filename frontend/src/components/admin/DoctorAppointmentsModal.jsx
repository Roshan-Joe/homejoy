import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, CheckCircle2 } from 'lucide-react';
import doctorService from '../../services/doctorService';

export const DoctorAppointmentsModal = ({ isOpen, onClose, doctor = null }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && doctor) {
      fetchAppointments();
    }
  }, [isOpen, doctor]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await doctorService.getDoctorAppointments(doctor.id);
      setAppointments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !doctor) return null;

  const displayName = doctor.name || doctor.full_name || 'Doctor';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        backgroundColor: '#ffffff'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={22} color="var(--primary)" />
              <span>Doctor Appointments: {displayName}</span>
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Scheduled consultations & clinical appointments
            </span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            Loading appointments list...
          </div>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
            No appointments scheduled for this doctor.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {appointments.map((apt) => (
              <div key={apt.id} style={{
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
                backgroundColor: '#f8fafc',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={16} color="var(--primary)" />
                    <span>{apt.elderly_name}</span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {apt.type}
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      <strong>{apt.appointment_date}</strong>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} />
                      <strong>{apt.time_slot}</strong>
                    </span>
                  </div>
                </div>

                <span style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  backgroundColor: apt.status === 'Scheduled' ? '#e0f2fe' : '#ecfdf5',
                  color: apt.status === 'Scheduled' ? '#0369a1' : '#047857'
                }}>
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'right', marginTop: '24px' }}>
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointmentsModal;
