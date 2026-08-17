import React, { useState, useEffect } from 'react';
import { X, UserCheck, Shield } from 'lucide-react';
import RoleDropdown from './RoleDropdown';
import userService from '../../services/userService';

export const ChangeRoleModal = ({ isOpen, onClose, onRoleAssigned, initialRole = 'Caregiver' }) => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUserList();
      setSelectedRole(initialRole);
    }
  }, [isOpen, initialRole]);

  const fetchUserList = async () => {
    try {
      setLoadingUsers(true);
      const res = await userService.getUsers({ limit: 100 });
      const userList = res.users || [];
      setUsers(userList);
      if (userList.length > 0) {
        setSelectedUserId(userList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      alert('Please select a user to assign the role.');
      return;
    }

    try {
      setSubmitting(true);
      await onRoleAssigned(selectedUserId, selectedRole);
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to assign role to user.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedUserObj = users.find((u) => u.id === selectedUserId);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '28px', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={20} color="var(--primary)" />
            <span>Assign System Role</span>
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Select Target User *</label>
            {loadingUsers ? (
              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Loading users...</div>
            ) : (
              <select
                className="form-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{ padding: '10px 12px' }}
                required
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.full_name} ({u.email}) - Current: [{u.role}]
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">New Assigned System Role *</label>
            <RoleDropdown
              value={selectedRole}
              onChange={setSelectedRole}
              style={{ padding: '10px 12px', width: '100%' }}
            />
          </div>

          {selectedUserObj && (
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '0.85rem'
            }}>
              <div><strong>User:</strong> {selectedUserObj.name || selectedUserObj.full_name}</div>
              <div><strong>Current Role:</strong> {selectedUserObj.role}</div>
              <div><strong>New Role:</strong> <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{selectedRole}</span></div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Assigning...' : 'Assign Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeRoleModal;
