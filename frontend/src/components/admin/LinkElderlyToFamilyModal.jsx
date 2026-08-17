import React, { useState, useEffect } from 'react';
import { X, Users, HeartHandshake, Trash2 } from 'lucide-react';
import elderlyService from '../../services/elderlyService';

export const LinkElderlyToFamilyModal = ({
  isOpen,
  onClose,
  familyMember = null,
  onLink,
  onUnlink
}) => {
  const [elderlyOptions, setElderlyOptions] = useState([]);
  const [selectedElderlyId, setSelectedElderlyId] = useState('');
  const [loadingElderly, setLoadingElderly] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen && familyMember) {
      fetchElderlyOptions();
    }
  }, [isOpen, familyMember]);

  const fetchElderlyOptions = async () => {
    try {
      setLoadingElderly(true);
      const res = await elderlyService.getElderly({ limit: 100 });
      const list = res.elderly || [];
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

  if (!isOpen || !familyMember) return null;

  const displayName = familyMember.name || familyMember.full_name || 'Family Member';
  const linkedIds = familyMember.linked_elderly_ids || [];
  const linkedNames = familyMember.linked_elderly_names || [];

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!selectedElderlyId) return;

    try {
      setActionLoading(true);
      await onLink(familyMember.id, selectedElderlyId);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to link elderly resident.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveLink = async (elderlyId) => {
    try {
      setActionLoading(true);
      await onUnlink(familyMember.id, elderlyId);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to unlink elderly resident.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '28px', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="var(--primary)" />
            <span>Linked Elderly Residents</span>
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: '16px', fontSize: '0.92rem' }}>
          Family Member: <strong>{displayName}</strong> ({familyMember.relationship})
        </div>

        {/* Add Link Form */}
        <form onSubmit={handleAddLink} style={{
          display: 'flex',
          gap: '10px',
          padding: '14px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-muted)' }}>
              Link New Elderly Resident
            </label>
            {loadingElderly ? (
              <div style={{ fontSize: '0.85rem' }}>Loading residents...</div>
            ) : (
              <select
                className="form-select"
                value={selectedElderlyId}
                onChange={(e) => setSelectedElderlyId(e.target.value)}
                style={{ padding: '8px 10px', fontSize: '0.86rem' }}
              >
                {elderlyOptions.map((eObj) => (
                  <option key={eObj.id} value={eObj.id}>
                    {eObj.name || eObj.full_name} (Age {eObj.age})
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={actionLoading || loadingElderly}
            style={{ alignSelf: 'flex-end', padding: '8px 14px', fontSize: '0.85rem' }}
          >
            Link
          </button>
        </form>

        {/* List of currently linked */}
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>
            Currently Linked Residents ({linkedIds.length})
          </h4>

          {linkedIds.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem', padding: '16px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
              No elderly residents currently linked to this family member.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {linkedIds.map((idVal, idx) => {
                const nameVal = linkedNames[idx] || `Resident ID: ${idVal}`;
                return (
                  <div key={idVal} style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff'
                  }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>{nameVal}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {idVal}</div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-danger"
                      title="Unlink Resident"
                      onClick={() => handleRemoveLink(idVal)}
                      disabled={actionLoading}
                      style={{ padding: '4px 8px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right', marginTop: '24px' }}>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
};

export default LinkElderlyToFamilyModal;
