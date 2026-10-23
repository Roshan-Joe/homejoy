import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import elderlyService from '../../services/elderlyService';
import caregiverService from '../../services/caregiverService';
import { useToast } from '../../context/ToastContext';
import { KERALA_DISTRICTS } from '../../constants/districts';

import SearchBar from '../../components/admin/SearchBar';
import Pagination from '../../components/admin/Pagination';
import ElderlyTable from '../../components/admin/ElderlyTable';
import ElderlyFormModal from '../../components/admin/ElderlyFormModal';
import AssignCaregiverDoctorModal from '../../components/admin/AssignCaregiverDoctorModal';
import MedicalProfileModal from '../../components/admin/MedicalProfileModal';
import DeleteConfirmationModal from '../../components/admin/DeleteConfirmationModal';

import {
  RefreshCw, UserPlus, Download, CheckSquare, Users, AlertCircle,
  Filter, XCircle, ArrowUpRight
} from 'lucide-react';

export const ElderlyManagement = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [elderly, setElderly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Multi-select state for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [bulkTargetCaregiverId, setBulkTargetCaregiverId] = useState('');
  const [allCaregivers, setAllCaregivers] = useState([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCaregiverFilter, setSelectedCaregiverFilter] = useState(searchParams.get('caregiver_id') || 'all');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState(searchParams.get('risk') || 'all');
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get('district') || 'all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editElderly, setEditElderly] = useState(null);
  const [viewProfileElderly, setViewProfileElderly] = useState(null);
  const [assignElderly, setAssignElderly] = useState(null);
  const [deleteElderly, setDeleteElderly] = useState(null);

  // Sync URL search params on mount
  useEffect(() => {
    const cgParam = searchParams.get('caregiver_id');
    const riskParam = searchParams.get('risk');
    if (cgParam) setSelectedCaregiverFilter(cgParam);
    if (riskParam) setSelectedRiskFilter(riskParam);
  }, [searchParams]);

  const fetchElderlyList = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await elderlyService.getElderly({
        search: searchTerm,
        caregiver_id: selectedCaregiverFilter,
        risk_level: selectedRiskFilter,
        district: selectedDistrict,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        limit: 10
      });

      setElderly(data.elderly || []);
      setTotalPages(data.total_pages || 1);
      setTotalItems(data.total || 0);
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to fetch elderly patient records.');
      toast.error('Failed to load elderly patient records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCaregiversForBulk = async () => {
    try {
      const res = await caregiverService.getCaregivers({ limit: 100, status: 'Active' });
      setAllCaregivers(res.caregivers || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchElderlyList();
    fetchCaregiversForBulk();
  }, [selectedCaregiverFilter, selectedRiskFilter, selectedDistrict, sortBy, sortOrder, page]);

  const handleSearchSubmit = () => {
    setPage(1);
    fetchElderlyList();
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectElderly = (id, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(elderly.map((e) => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkAssignSubmit = async (e) => {
    e.preventDefault();
    if (!bulkTargetCaregiverId || selectedIds.length === 0) return;
    try {
      setActionLoading(true);
      const res = await api.post('/api/admin/elderly/bulk-assign', {
        elderly_ids: selectedIds,
        caregiver_id: bulkTargetCaregiverId,
        note: 'Bulk assigned from Admin management queue'
      });
      toast.success(res.data.message || `Assigned ${res.data.assigned_count} residents.`);
      setIsBulkAssignModalOpen(false);
      setSelectedIds([]);
      fetchElderlyList();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Bulk assignment failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/api/admin/export/csv?type=elderly', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'homejoy_elderly_residents.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Elderly records exported to CSV.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export elderly records.');
    }
  };

  const handleCreateElderly = async (formData) => {
    try {
      setActionLoading(true);
      await elderlyService.createElderly(formData);
      setIsAddModalOpen(false);
      toast.success('Elderly resident profile created.');
      fetchElderlyList();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to create elderly profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateElderly = async (formData) => {
    try {
      setActionLoading(true);
      await elderlyService.updateElderly(editElderly.id, formData);
      setEditElderly(null);
      toast.success('Elderly resident profile updated.');
      fetchElderlyList();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to update elderly profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteElderlyConfirm = async () => {
    if (!deleteElderly) return;
    try {
      setActionLoading(true);
      await elderlyService.deleteElderly(deleteElderly.id);
      toast.success(`Resident ${deleteElderly.name || deleteElderly.full_name} deleted.`);
      setDeleteElderly(null);
      fetchElderlyList();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to delete elderly profile.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card */}
      <div className="card glass-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Elderly Residents Management
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '2px 0 0 0' }}>
              Resident rosters, AI health risk stratification, and primary caregiver assignments
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleExportCsv}
              title="Download CSV report of residents"
            >
              <Download size={16} />
              <span>Export CSV</span>
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={fetchElderlyList}
              disabled={loading}
              title="Refresh list"
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
              <span>Register Resident</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
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
              {selectedIds.length} {selectedIds.length === 1 ? 'resident' : 'residents'} selected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-sm"
              style={{ backgroundColor: '#ffffff', color: 'var(--primary)', border: '1px solid var(--primary)', fontWeight: 600 }}
              onClick={() => setIsBulkAssignModalOpen(true)}
            >
              <Users size={14} style={{ marginRight: '4px' }} /> Bulk Assign Caregiver
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedIds([])}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Search, District & Quick Filters */}
      <div className="card glass-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 260px' }}>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={handleSearchSubmit}
              placeholder="Search by resident name, email, or contact phone..."
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Quick Unassigned Chip */}
            <button
              className="btn btn-sm"
              style={{
                backgroundColor: selectedCaregiverFilter === 'unassigned' ? '#fee2e2' : '#f8fafc',
                color: selectedCaregiverFilter === 'unassigned' ? '#b91c1c' : 'var(--text-main)',
                border: selectedCaregiverFilter === 'unassigned' ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                fontWeight: 700,
                fontSize: '0.8rem'
              }}
              onClick={() => {
                setSelectedCaregiverFilter(selectedCaregiverFilter === 'unassigned' ? 'all' : 'unassigned');
                setPage(1);
              }}
            >
              ★ Pending Assignment Queue
            </button>

            {/* Risk Filter */}
            <select
              className="form-select"
              value={selectedRiskFilter}
              onChange={(e) => {
                setSelectedRiskFilter(e.target.value);
                setPage(1);
              }}
              style={{ padding: '8px 12px', fontSize: '0.85rem', width: 'auto' }}
            >
              <option value="all">All Risk Levels</option>
              <option value="High">High Risk Only</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>

            {/* District Filter */}
            <select
              className="form-select"
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setPage(1);
              }}
              style={{ padding: '8px 12px', fontSize: '0.85rem', width: 'auto' }}
            >
              <option value="all">All Districts</option>
              {KERALA_DISTRICTS.map((dist) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <ElderlyTable
          elderly={elderly}
          loading={loading}
          selectedIds={selectedIds}
          onSelectElderly={handleSelectElderly}
          onSelectAll={handleSelectAll}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onViewMedicalProfile={(res) => setViewProfileElderly(res)}
          onEdit={(res) => setEditElderly(res)}
          onAssign={(res) => setAssignElderly(res)}
          onDelete={(res) => setDeleteElderly(res)}
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

      {/* Bulk Assign Modal */}
      {isBulkAssignModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '26px', backgroundColor: '#ffffff', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 10px 0' }}>
              Bulk Assign Caregiver
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Assign {selectedIds.length} selected residents to a single caregiver. The system will respect each caregiver's maximum capacity.
            </p>

            <form onSubmit={handleBulkAssignSubmit}>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.86rem' }}>
                  Select Target Caregiver
                </label>
                <select
                  className="form-select"
                  value={bulkTargetCaregiverId}
                  onChange={(e) => setBulkTargetCaregiverId(e.target.value)}
                  required
                  style={{ padding: '9px 12px' }}
                >
                  <option value="">-- Choose Active Caregiver --</option>
                  {allCaregivers.map((cg) => {
                    const current = (cg.assigned_elderly_ids || []).length;
                    const maxCap = cg.max_patients || 8;
                    const isFull = current >= maxCap;
                    return (
                      <option key={cg.id} value={cg.id} disabled={isFull}>
                        {cg.name || cg.full_name} ({cg.district}) — {current}/{maxCap} clients {isFull ? '[FULL]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsBulkAssignModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading || !bulkTargetCaregiverId}>
                  {actionLoading ? 'Assigning...' : 'Confirm Bulk Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      <ElderlyFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateElderly}
        loading={actionLoading}
      />

      <ElderlyFormModal
        isOpen={!!editElderly}
        onClose={() => setEditElderly(null)}
        onSubmit={handleUpdateElderly}
        initialData={editElderly}
        isEdit={true}
        loading={actionLoading}
      />

      <MedicalProfileModal
        isOpen={!!viewProfileElderly}
        onClose={() => setViewProfileElderly(null)}
        elderly={viewProfileElderly}
      />

      <AssignCaregiverDoctorModal
        isOpen={!!assignElderly}
        onClose={() => {
          setAssignElderly(null);
          fetchElderlyList();
        }}
        elderly={assignElderly}
        onAssignCaregiver={() => fetchElderlyList()}
        onAssignDoctor={() => fetchElderlyList()}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteElderly}
        onClose={() => setDeleteElderly(null)}
        onConfirm={handleDeleteElderlyConfirm}
        user={deleteElderly}
        title="Delete Elderly Resident"
        entityType="Resident"
        loading={actionLoading}
      />
    </div>
  );
};

export default ElderlyManagement;
