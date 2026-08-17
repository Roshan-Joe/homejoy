import React, { useState, useEffect } from 'react';
import elderlyService from '../../services/elderlyService';

import SearchBar from '../../components/admin/SearchBar';
import Pagination from '../../components/admin/Pagination';
import ElderlyTable from '../../components/admin/ElderlyTable';
import ElderlyFormModal from '../../components/admin/ElderlyFormModal';
import MedicalProfileModal from '../../components/admin/MedicalProfileModal';
import AssignCaregiverDoctorModal from '../../components/admin/AssignCaregiverDoctorModal';
import DeleteConfirmationModal from '../../components/admin/DeleteConfirmationModal';

import { HeartPulse, RefreshCw, UserPlus, ShieldAlert, Filter, AlertTriangle } from 'lucide-react';

export const ElderlyManagement = () => {
  const [elderly, setElderly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Search & Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editElderly, setEditElderly] = useState(null);
  const [viewMedicalElderly, setViewMedicalElderly] = useState(null);
  const [assignElderly, setAssignElderly] = useState(null);
  const [deleteElderly, setDeleteElderly] = useState(null);

  const fetchElderlyList = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await elderlyService.getElderly({
        search: searchTerm,
        riskLevel: riskFilter,
        page,
        limit: 10
      });

      setElderly(data.elderly || []);
      setTotalPages(data.total_pages || 1);
      setTotalItems(data.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to load elderly profiles from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElderlyList();
  }, [riskFilter, page]);

  const handleSearchSubmit = () => {
    setPage(1);
    fetchElderlyList();
  };

  const handleCreateElderly = async (payload) => {
    try {
      setActionLoading(true);
      await elderlyService.createElderly(payload);
      setIsAddModalOpen(false);
      fetchElderlyList();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create elderly profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateElderly = async (payload) => {
    try {
      setActionLoading(true);
      await elderlyService.updateElderly(editElderly.id, payload);
      setEditElderly(null);
      fetchElderlyList();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update elderly profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignCaregiver = async (elderlyId, caregiverId) => {
    try {
      await elderlyService.assignCaregiver(elderlyId, caregiverId);
      fetchElderlyList();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to assign caregiver.');
    }
  };

  const handleAssignDoctor = async (elderlyId, doctorId) => {
    try {
      await elderlyService.assignDoctor(elderlyId, doctorId);
      fetchElderlyList();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to assign doctor.');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setActionLoading(true);
      await elderlyService.deleteElderly(deleteElderly.id);
      setDeleteElderly(null);
      fetchElderlyList();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete elderly profile.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Card */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HeartPulse size={24} color="var(--primary)" />
              <span>Elderly Patient Management</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              Manage elderly profiles, clinical histories, caregiver/doctor assignments, and AI risk monitoring
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={fetchElderlyList}
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
              <span>Add Elderly Patient</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '18px' }}>
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={handleSearchSubmit}
            placeholder="Search patient name, email, or phone..."
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-select"
              value={riskFilter}
              onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px', fontSize: '0.88rem', borderRadius: '8px' }}
            >
              <option value="all">All AI Risk Levels</option>
              <option value="High">High Risk Only</option>
              <option value="Medium">Medium Risk Only</option>
              <option value="Low">Low Risk Only</option>
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
        <ElderlyTable
          elderly={elderly}
          loading={loading}
          onViewMedicalProfile={(p) => setViewMedicalElderly(p)}
          onEdit={(p) => setEditElderly(p)}
          onAssign={(p) => setAssignElderly(p)}
          onDelete={(p) => setDeleteElderly(p)}
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={10}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* ADD ELDERLY MODAL */}
      <ElderlyFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateElderly}
        loading={actionLoading}
      />

      {/* EDIT ELDERLY MODAL */}
      <ElderlyFormModal
        isOpen={!!editElderly}
        onClose={() => setEditElderly(null)}
        onSubmit={handleUpdateElderly}
        elderly={editElderly}
        loading={actionLoading}
      />

      {/* MEDICAL PROFILE MODAL */}
      <MedicalProfileModal
        isOpen={!!viewMedicalElderly}
        onClose={() => setViewMedicalElderly(null)}
        elderly={viewMedicalElderly}
      />

      {/* ASSIGN CAREGIVER / DOCTOR MODAL */}
      <AssignCaregiverDoctorModal
        isOpen={!!assignElderly}
        onClose={() => setAssignElderly(null)}
        elderly={assignElderly}
        onAssignCaregiver={handleAssignCaregiver}
        onAssignDoctor={handleAssignDoctor}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
        isOpen={!!deleteElderly}
        onClose={() => setDeleteElderly(null)}
        onConfirm={handleDeleteConfirm}
        user={deleteElderly}
        loading={actionLoading}
      />
    </div>
  );
};

export default ElderlyManagement;
