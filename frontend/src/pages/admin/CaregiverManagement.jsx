import React, { useState, useEffect } from 'react';
import caregiverService from '../../services/caregiverService';

import SearchBar from '../../components/admin/SearchBar';
import Pagination from '../../components/admin/Pagination';
import CaregiverTable from '../../components/admin/CaregiverTable';
import CaregiverFormModal from '../../components/admin/CaregiverFormModal';
import AssignElderlyToCaregiverModal from '../../components/admin/AssignElderlyToCaregiverModal';
import DailyReportsModal from '../../components/admin/DailyReportsModal';
import CaregiverPerformanceModal from '../../components/admin/CaregiverPerformanceModal';
import DeleteConfirmationModal from '../../components/admin/DeleteConfirmationModal';

import { UserCheck, RefreshCw, UserPlus, ShieldAlert, Filter, AlertTriangle } from 'lucide-react';

export const CaregiverManagement = () => {
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Search & Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editCaregiver, setEditCaregiver] = useState(null);
  const [assignCaregiver, setAssignCaregiver] = useState(null);
  const [viewReportsCaregiver, setViewReportsCaregiver] = useState(null);
  const [viewPerfCaregiver, setViewPerfCaregiver] = useState(null);
  const [deleteCaregiver, setDeleteCaregiver] = useState(null);

  const fetchCaregivers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await caregiverService.getCaregivers({
        search: searchTerm,
        shift: shiftFilter,
        page,
        limit: 10
      });

      setCaregivers(data.caregivers || []);
      setTotalPages(data.total_pages || 1);
      setTotalItems(data.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to fetch caregiver records from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaregivers();
  }, [shiftFilter, page]);

  const handleSearchSubmit = () => {
    setPage(1);
    fetchCaregivers();
  };

  const handleCreateCaregiver = async (payload) => {
    try {
      setActionLoading(true);
      await caregiverService.createCaregiver(payload);
      setIsAddModalOpen(false);
      fetchCaregivers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create caregiver profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCaregiver = async (payload) => {
    try {
      setActionLoading(true);
      await caregiverService.updateCaregiver(editCaregiver.id, payload);
      setEditCaregiver(null);
      fetchCaregivers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update caregiver details.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignElderly = async (caregiverId, elderlyId) => {
    try {
      await caregiverService.assignElderly(caregiverId, elderlyId);
      fetchCaregivers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to assign elderly resident.');
    }
  };

  const handleRemoveElderly = async (caregiverId, elderlyId) => {
    try {
      await caregiverService.removeElderlyAssignment(caregiverId, elderlyId);
      fetchCaregivers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove elderly assignment.');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setActionLoading(true);
      await caregiverService.deleteCaregiver(deleteCaregiver.id);
      setDeleteCaregiver(null);
      fetchCaregivers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete caregiver.');
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
              <UserCheck size={24} color="#15803d" />
              <span>Caregiver Management</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              Manage caregiver staff, qualifications, elderly resident assignments, daily reports, and performance scorecards
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={fetchCaregivers}
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
              <span>Add New Caregiver</span>
            </button>
          </div>
        </div>

        {/* Search & Shift Filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '18px' }}>
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={handleSearchSubmit}
            placeholder="Search caregiver name, email, or qualification..."
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-select"
              value={shiftFilter}
              onChange={(e) => { setShiftFilter(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px', fontSize: '0.88rem', borderRadius: '8px' }}
            >
              <option value="all">All Shifts</option>
              <option value="Day">Day Shift</option>
              <option value="Night">Night Shift</option>
              <option value="Rotational">Rotational Shift</option>
            </select>
          </div>
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
        <CaregiverTable
          caregivers={caregivers}
          loading={loading}
          onAssignElderly={(c) => setAssignCaregiver(c)}
          onViewReports={(c) => setViewReportsCaregiver(c)}
          onViewPerformance={(c) => setViewPerfCaregiver(c)}
          onEdit={(c) => setEditCaregiver(c)}
          onDelete={(c) => setDeleteCaregiver(c)}
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={10}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* ADD CAREGIVER MODAL */}
      <CaregiverFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateCaregiver}
        loading={actionLoading}
      />

      {/* EDIT CAREGIVER MODAL */}
      <CaregiverFormModal
        isOpen={!!editCaregiver}
        onClose={() => setEditCaregiver(null)}
        onSubmit={handleUpdateCaregiver}
        caregiver={editCaregiver}
        loading={actionLoading}
      />

      {/* ASSIGN ELDERLY MODAL */}
      <AssignElderlyToCaregiverModal
        isOpen={!!assignCaregiver}
        onClose={() => setAssignCaregiver(null)}
        caregiver={assignCaregiver}
        onAssign={handleAssignElderly}
        onRemove={handleRemoveElderly}
      />

      {/* DAILY REPORTS MODAL */}
      <DailyReportsModal
        isOpen={!!viewReportsCaregiver}
        onClose={() => setViewReportsCaregiver(null)}
        caregiver={viewReportsCaregiver}
      />

      {/* PERFORMANCE SCORECARD MODAL */}
      <CaregiverPerformanceModal
        isOpen={!!viewPerfCaregiver}
        onClose={() => setViewPerfCaregiver(null)}
        caregiver={viewPerfCaregiver}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
        isOpen={!!deleteCaregiver}
        onClose={() => setDeleteCaregiver(null)}
        onConfirm={handleDeleteConfirm}
        user={deleteCaregiver}
        loading={actionLoading}
      />
    </div>
  );
};

export default CaregiverManagement;
