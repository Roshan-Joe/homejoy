import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import userService from '../../services/userService';
import { useToast } from '../../context/ToastContext';

import SearchBar from '../../components/admin/SearchBar';
import FilterPanel from '../../components/admin/FilterPanel';
import Pagination from '../../components/admin/Pagination';
import UserTable from '../../components/admin/UserTable';
import UserFormModal from '../../components/admin/UserFormModal';
import UserDetailsModal from '../../components/admin/UserDetailsModal';
import DeleteConfirmationModal from '../../components/admin/DeleteConfirmationModal';

import { RefreshCw, UserPlus, Download, CheckSquare, XCircle, Power } from 'lucide-react';

export const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Multi-select state
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Search, Filter, Sort, Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await userService.getUsers({
        search: searchTerm,
        role: selectedRole,
        status: selectedStatus,
        sortBy,
        sortOrder,
        page,
        limit: 10
      });

      setUsers(data.users || []);
      setTotalPages(data.total_pages || 1);
      setTotalItems(data.total || 0);
      setSelectedUserIds([]); // Reset selection on page change or refresh
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to fetch users list.');
      toast.error('Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRole, selectedStatus, sortBy, sortOrder, page]);

  const handleSearchSubmit = () => {
    setPage(1);
    fetchUsers();
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectUser = (id, checked) => {
    if (checked) {
      setSelectedUserIds((prev) => [...prev, id]);
    } else {
      setSelectedUserIds((prev) => prev.filter((uid) => uid !== id));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUserIds(users.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleBulkStatus = async (isActive) => {
    if (selectedUserIds.length === 0) return;
    try {
      setActionLoading(true);
      const res = await api.post('/api/admin/users/bulk-status', {
        user_ids: selectedUserIds,
        is_active: isActive
      });
      toast.success(res.data.message || `Updated ${selectedUserIds.length} users.`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Bulk status update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/api/admin/export/csv?type=users', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'homejoy_users.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('User directory CSV downloaded.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export CSV.');
    }
  };

  const handleCreateUser = async (formData) => {
    try {
      setActionLoading(true);
      await userService.createUser(formData);
      setIsAddModalOpen(false);
      toast.success('User account created successfully.');
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to create user account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (formData) => {
    try {
      setActionLoading(true);
      await userService.updateUser(editUser.id, formData);
      setEditUser(null);
      toast.success('User details updated.');
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to update user details.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      setActionLoading(true);
      const newActiveState = !user.is_active;
      await userService.updateUserStatus(user.id, newActiveState);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: newActiveState } : u))
      );
      toast.success(`User ${user.full_name || user.name} is now ${newActiveState ? 'Active' : 'Inactive'}.`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to change user status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUserConfirm = async () => {
    if (!deleteUser) return;
    try {
      setActionLoading(true);
      const res = await api.delete(`/api/admin/users/${deleteUser.id}`);
      toast.success(`User ${deleteUser.full_name || deleteUser.name || 'account'} was deleted.`);
      setDeleteUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Action Header */}
      <div className="card glass-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              User Directory Management
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '2px 0 0 0' }}>
              Audit account statuses, role access, and last login telemetry
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleExportCsv}
              title="Export filtered directory to CSV"
            >
              <Download size={16} />
              <span>Export CSV</span>
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={fetchUsers}
              disabled={loading}
              title="Refresh directory"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsAddModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <UserPlus size={16} />
              <span>Create User</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Toolbar Banner */}
      {selectedUserIds.length > 0 && (
        <div
          className="card animate-fade-in"
          style={{
            padding: '12px 20px',
            backgroundColor: '#f0fdf4',
            border: '1.5px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckSquare size={18} style={{ color: '#059669' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#065f46' }}>
              {selectedUserIds.length} {selectedUserIds.length === 1 ? 'user' : 'users'} selected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-sm"
              style={{ backgroundColor: '#ffffff', color: '#059669', border: '1px solid #10b981', fontWeight: 600 }}
              onClick={() => handleBulkStatus(true)}
              disabled={actionLoading}
            >
              <Power size={14} style={{ marginRight: '4px' }} /> Activate Selected
            </button>

            <button
              className="btn btn-sm"
              style={{ backgroundColor: '#ffffff', color: '#dc2626', border: '1px solid #f87171', fontWeight: 600 }}
              onClick={() => handleBulkStatus(false)}
              disabled={actionLoading}
            >
              <Power size={14} style={{ marginRight: '4px' }} /> Deactivate Selected
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedUserIds([])}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card glass-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 260px' }}>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={handleSearchSubmit}
              placeholder="Search by full name, email, or phone..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <FilterPanel
              selectedRole={selectedRole}
              onRoleChange={(val) => {
                setSelectedRole(val);
                setPage(1);
              }}
              selectedStatus={selectedStatus}
              onStatusChange={(val) => {
                setSelectedStatus(val);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <UserTable
          users={users}
          loading={loading}
          selectedUserIds={selectedUserIds}
          onSelectUser={handleSelectUser}
          onSelectAll={handleSelectAll}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onView={(user) => setViewUser(user)}
          onEdit={(user) => setEditUser(user)}
          onDelete={(user) => setDeleteUser(user)}
          onToggleStatus={handleToggleStatus}
          actionLoading={actionLoading}
        />

        {totalPages > 1 && (
          <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle, #e2e8f0)' }}>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <UserFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateUser}
        loading={actionLoading}
      />

      <UserFormModal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        onSubmit={handleUpdateUser}
        initialData={editUser}
        isEdit={true}
        loading={actionLoading}
      />

      <UserDetailsModal
        isOpen={!!viewUser}
        onClose={() => setViewUser(null)}
        user={viewUser}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDeleteUserConfirm}
        user={deleteUser}
        title="Delete User Account"
        entityType="User"
        loading={actionLoading}
      />
    </div>
  );
};

export default UserManagement;
