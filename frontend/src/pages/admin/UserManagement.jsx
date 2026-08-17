import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';

import SearchBar from '../../components/admin/SearchBar';
import FilterPanel from '../../components/admin/FilterPanel';
import Pagination from '../../components/admin/Pagination';
import UserTable from '../../components/admin/UserTable';
import UserFormModal from '../../components/admin/UserFormModal';
import UserDetailsModal from '../../components/admin/UserDetailsModal';
import DeleteConfirmationModal from '../../components/admin/DeleteConfirmationModal';

import { RefreshCw, UserPlus, AlertTriangle } from 'lucide-react';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Search, Filter, Sort, Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
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
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to fetch users list from database.');
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

  const handleCreateUser = async (formData) => {
    try {
      setActionLoading(true);
      await userService.createUser(formData);
      setIsAddModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create user account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (formData) => {
    try {
      setActionLoading(true);
      await userService.updateUser(editUser.id, formData);
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update user details.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      setActionLoading(true);
      const newActiveState = !user.is_active;
      await userService.updateUserStatus(user.id, newActiveState);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: newActiveState, status: newActiveState ? 'active' : 'inactive' } : u));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to change user status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUserConfirm = async () => {
    try {
      setActionLoading(true);
      await userService.deleteUser(deleteUser.id);
      setDeleteUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Action Header */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>User Management</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Manage accounts, roles, and statuses across HomeJoy system
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={fetchUsers}
              disabled={loading}
              style={{ padding: '8px 14px' }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              className="btn btn-primary"
              onClick={() => setIsAddModalOpen(true)}
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <UserPlus size={18} />
              <span>Add New User</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '18px' }}>
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={handleSearchSubmit}
          />

          <FilterPanel
            selectedRole={selectedRole}
            setSelectedRole={(r) => { setSelectedRole(r); setPage(1); }}
            selectedStatus={selectedStatus}
            setSelectedStatus={(s) => { setSelectedStatus(s); setPage(1); }}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table Card */}
      <div className="glass-card" style={{ padding: '20px 0' }}>
        <UserTable
          users={users}
          loading={loading}
          onView={(u) => setViewUser(u)}
          onEdit={(u) => setEditUser(u)}
          onDelete={(u) => setDeleteUser(u)}
          onToggleStatus={handleToggleStatus}
          actionLoading={actionLoading}
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={10}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* ADD USER MODAL */}
      <UserFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateUser}
        loading={actionLoading}
      />

      {/* EDIT USER MODAL */}
      <UserFormModal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        onSubmit={handleUpdateUser}
        user={editUser}
        loading={actionLoading}
      />

      {/* USER DETAILS MODAL */}
      <UserDetailsModal
        isOpen={!!viewUser}
        onClose={() => setViewUser(null)}
        user={viewUser}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDeleteUserConfirm}
        user={deleteUser}
        loading={actionLoading}
      />
    </div>
  );
};

export default UserManagement;
