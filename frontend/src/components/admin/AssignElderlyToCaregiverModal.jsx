import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Trash2, MapPin, AlertCircle } from 'lucide-react';
import elderlyService from '../../services/elderlyService';
import { useToast } from '../../context/ToastContext';

export const AssignElderlyToCaregiverModal = ({
  isOpen,
  onClose,
  caregiver = null,
  onAssign,
  onRemove
}) => {
  const { toast } = useToast();
  const [elderlyOptions, setElderlyOptions] = useState([]);
  const [selectedElderlyId, setSelectedElderlyId] = useState('');
  const [loadingElderly, setLoadingElderly] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen && caregiver) {
      fetchElderlyOptions();
    }
  }, [isOpen, caregiver]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !actionLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, actionLoading, onClose]);

  const fetchElderlyOptions = async () => {
    try {
      setLoadingElderly(true);
      const res = await elderlyService.getElderly({ limit: 100 });
      const list = res.elderly || [];
      // Prioritize unassigned residents first
      list.sort((a, b) => {
        const aUn = !a.assigned_caregiver_id || a.assigned_caregiver_id === 'Not Assigned';
        const bUn = !b.assigned_caregiver_id || b.assigned_caregiver_id === 'Not Assigned';
        return bUn - aUn;
      });
      setElderlyOptions(list);
      if (list.length > 0) {
        setSelectedElderlyId(list[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingElderly(false);
    }
  };

  if (!isOpen || !caregiver) return null;

  const displayName = caregiver.name || caregiver.full_name || 'Caregiver Staff';
  const assignedIds = caregiver.assigned_elderly_ids || [];
  const assignedNames = caregiver.assigned_elderly_names || [];
  const maxPatients = Number(caregiver.max_patients || 8);
  const currentCount = assignedIds.length;
  const isAtCapacity = currentCount >= maxPatients;

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!selectedElderlyId) return;

    if (isAtCapacity) {
      toast.warning(`Caregiver ${displayName} is already at full capacity (${currentCount}/${maxPatients}). Cannot add more residents.`);
      return;
    }

    try {
      setActionLoading(true);
      await onAssign(caregiver.id, selectedElderlyId);
      toast.success('Resident successfully added to caregiver roster.');
      fetchElderlyOptions();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to assign elderly resident.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAssignment = async (elderlyId, elderlyName) => {
    try {
      setActionLoading(true);
      await onRemove(caregiver.id, elderlyId);
      toast.info(`Removed ${elderlyName || 'resident'} from caregiver roster.`);
      fetchElderlyOptions();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to remove assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cg-elderly-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !actionLoading) onClose();
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '540px',
          padding: '26px',
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary-light, #e0f2fe)',
              color: 'var(--primary, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={20} />
            </div>
            <div>
              <h3 id="cg-elderly-title" style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Caregiver Client Roster
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Manage resident allocations
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Caregiver Summary Card */}
        <div style={{
          padding: '12px 14px',
          backgroundColor: 'var(--surface-overlay, #f8fafc)',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          borderRadius: '10px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {displayName}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <MapPin size={13} style={{ color: 'var(--primary)' }} /> {caregiver.district || 'Other'}
              </span>
              <span>•</span>
              <span>Shift: {caregiver.shift || 'Day'}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '999px',
              backgroundColor: isAtCapacity ? '#fee2e2' : '#ecfdf5',
              color: isAtCapacity ? '#b91c1c' : '#047857'
            }}>
              {currentCount} / {maxPatients} Assigned {isAtCapacity ? '(FULL)' : ''}
            </span>
          </div>
        </div>

        {/* Add Assignment Form */}
        <form onSubmit={handleAddAssignment} style={{
          display: 'flex',
          gap: '10px',
          padding: '14px',
          backgroundColor: isAtCapacity ? '#fff1f2' : '#f8fafc',
          borderRadius: '10px',
          marginBottom: '20px',
          border: isAtCapacity ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle, #e2e8f0)'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-muted)' }}>
              Select Resident To Assign
            </label>
            {loadingElderly ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading residents...</div>
            ) : (
              <select
                className="form-select"
                value={selectedElderlyId}
                onChange={(e) => setSelectedElderlyId(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '0.88rem' }}
                disabled={isAtCapacity || actionLoading}
              >
                {elderlyOptions
                  .filter((e) => !assignedIds.includes(e.id))
                  .map((e) => {
                    const isUnassigned = !e.assigned_caregiver_id || e.assigned_caregiver_id === 'Not Assigned';
                    return (
                      <option key={e.id} value={e.id}>
                        {e.name || e.full_name} ({e.district || 'Other'}) {isUnassigned ? '★ Unassigned' : `(with ${e.assigned_caregiver_name})`}
                      </option>
                    );
                  })}
              </select>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            style={{ alignSelf: 'flex-end', height: '38px', display: 'flex', alignItems: 'center', gap: '6px' }}
            disabled={isAtCapacity || actionLoading || !selectedElderlyId}
          >
            <UserPlus size={16} />
            <span>{isAtCapacity ? 'Full' : 'Assign'}</span>
          </button>
        </form>

        {/* Current Roster List */}
        <div>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
            Current Residents ({currentCount})
          </div>

          <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {assignedIds.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.88rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                No elderly residents currently assigned to this caregiver.
              </div>
            ) : (
              assignedIds.map((id, index) => {
                const name = assignedNames[index] || `Resident ID: ${id.slice(-6)}`;
                return (
                  <div key={id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-subtle, #e2e8f0)'
                  }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{name}</strong>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>ID: {id}</span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}
                      onClick={() => handleRemoveAssignment(id, name)}
                      disabled={actionLoading}
                      aria-label={`Remove ${name} from caregiver roster`}
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={actionLoading}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignElderlyToCaregiverModal;
