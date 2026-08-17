import React, { useState, useEffect } from 'react';
import roleService from '../../services/roleService';

import RoleCard from '../../components/admin/RoleCard';
import RolePermissionsModal from '../../components/admin/RolePermissionsModal';
import ChangeRoleModal from '../../components/admin/ChangeRoleModal';

import { Shield, RefreshCw, UserCheck, Lock, AlertTriangle } from 'lucide-react';

export const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals
  const [selectedRolePermissions, setSelectedRolePermissions] = useState(null);
  const [changeRoleTarget, setChangeRoleTarget] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const fetchRoleData = async () => {
    try {
      setLoading(true);
      setError('');
      const [rolesData, catalogData] = await Promise.all([
        roleService.getRoles(),
        roleService.getPermissionsCatalog()
      ]);
      setRoles(rolesData || []);
      setCatalog(catalogData || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to load system roles and RBAC permissions catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoleData();
  }, []);

  const handleSavePermissions = async (roleName, permissions) => {
    try {
      setActionLoading(true);
      const updatedRole = await roleService.updateRolePermissions(roleName, permissions);
      setRoles((prev) => prev.map((r) => r.role_name.toLowerCase() === roleName.toLowerCase() ? updatedRole : r));
      setSelectedRolePermissions(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update role permissions.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignRole = async (userId, newRole) => {
    try {
      setActionLoading(true);
      await roleService.assignUserRole(userId, newRole);
      fetchRoleData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to assign role to user.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={24} color="var(--primary)" />
              <span>Role Management & RBAC Permissions</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              Manage system roles, view permission matrices, and assign access levels across HomeJoy modules
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={fetchRoleData}
              disabled={loading}
              style={{ padding: '8px 14px' }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              className="btn btn-primary"
              onClick={() => { setChangeRoleTarget(null); setIsAssignModalOpen(true); }}
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <UserCheck size={18} />
              <span>Assign Role to User</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Roles Cards Grid */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading system roles and RBAC permission matrices...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {roles.map((r) => (
            <RoleCard
              key={r.id || r.role_name}
              role={r}
              onManagePermissions={(roleObj) => setSelectedRolePermissions(roleObj)}
              onChangeUserRoles={(roleObj) => { setChangeRoleTarget(roleObj); setIsAssignModalOpen(true); }}
            />
          ))}
        </div>
      )}

      {/* ROLE PERMISSIONS MODAL */}
      <RolePermissionsModal
        isOpen={!!selectedRolePermissions}
        onClose={() => setSelectedRolePermissions(null)}
        role={selectedRolePermissions}
        catalog={catalog}
        onSavePermissions={handleSavePermissions}
        loading={actionLoading}
      />

      {/* CHANGE USER ROLE MODAL */}
      <ChangeRoleModal
        isOpen={isAssignModalOpen}
        onClose={() => { setIsAssignModalOpen(false); setChangeRoleTarget(null); }}
        onRoleAssigned={handleAssignRole}
        initialRole={changeRoleTarget ? changeRoleTarget.role_name : 'Caregiver'}
      />
    </div>
  );
};

export default RoleManagement;
