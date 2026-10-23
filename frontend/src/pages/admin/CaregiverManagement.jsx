import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import caregiverService from '../../services/caregiverService';
import { useToast } from '../../context/ToastContext';
import { KERALA_DISTRICTS } from '../../constants/districts';

import SearchBar from '../../components/admin/SearchBar';
import Pagination from '../../components/admin/Pagination';
import CaregiverTable from '../../components/admin/CaregiverTable';
import CaregiverFormModal from '../../components/admin/CaregiverFormModal';
import AssignElderlyToCaregiverModal from '../../components/admin/AssignElderlyToCaregiverModal';
import DailyReportsModal from '../../components/admin/DailyReportsModal';
import CaregiverPerformanceModal from '../../components/admin/CaregiverPerformanceModal';
import DeleteConfirmationModal from '../../components/admin/DeleteConfirmationModal';

import { RefreshCw, UserPlus, Download } from 'lucide-react';

export const CaregiverManagement = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShift, setSelectedShift] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get('district') || 'all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
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

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) setSelectedStatus(statusParam);
  }, [searchParams]);

  const fetchCaregivers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await caregiverService.getCaregivers({
        search: searchTerm,
        shift: selectedShift,
        status: selectedStatus,
        district: selectedDistrict,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        limit: 10
      });

      setCaregivers(data.caregivers || []);
      setTotalPages(data.total_pages || 1);
      setTotalItems(data.total || 0);
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to fetch caregiver records.');
      toast.error('Failed to load caregiver records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaregivers();
  }, [selectedShift, selectedStatus, selectedDistrict, sortBy, sortOrder, page]);

  const handleSearchSubmit = () => {
    setPage(1);
    fetchCaregivers();
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectCaregiver = (id, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(caregivers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/api/admin/export/csv?type=caregivers', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'homejoy_caregivers.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Caregiver records exported to CSV.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export caregiver CSV.');
    }
  };

  const handleCreateCaregiver = async (formData) => {
    try {
      setActionLoading(true);
      await caregiverService.createCaregiver(formData);
      setIsAddModalOpen(false);
      toast.success('Caregiver profile created.');
      fetchCaregivers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to create caregiver profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCaregiver = async (formData) => {
    try {
      setActionLoading(true);
      await caregiverService.updateCaregiver(editCaregiver.id, formData);
      setEditCaregiver(null);
      toast.success('Caregiver profile updated.');
      fetchCaregivers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to update caregiver profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignElderly = async (caregiverId, elderlyId) => {
    try {
      setActionLoading(true);
      await caregiverService.assignElderly(caregiverId, elderlyId);
      toast.success('Client assigned to caregiver.');
      fetchCaregivers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to assign elderly resident.');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveElderly = async (caregiverId, elderlyId) => {
    try {
      setActionLoading(true);
      await caregiverService.removeElderly(caregiverId, elderlyId);
      toast.info('Client removed from caregiver roster.');
      fetchCaregivers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to remove elderly resident.');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCaregiverConfirm = async () => {
    if (!deleteCaregiver) return;
    try {
      setActionLoading(true);
      await caregiverService.deleteCaregiver(deleteCaregiver.id);
      toast.success(`Caregiver ${deleteCaregiver.name || deleteCaregiver.full_name} deleted.`);
      setDeleteCaregiver(null);
      fetchCaregivers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to delete caregiver.');
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
              Caregivers & Nurses Roster
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '2px 0 0 0' }}>
              Staff directory, capacity limits, shift allocations, and performance evaluations
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleExportCsv}
              title="Export caregiver directory to CSV"
            >
              <Download size={16} />
              <span>Export CSV</span>
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={fetchCaregivers}
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
              <span>Register Caregiver</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card glass-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 260px' }}>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={handleSearchSubmit}
              placeholder="Search by caregiver name, qualification, or email..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Shift Filter */}
            <select
              className="form-select"
              value={selectedShift}
              onChange={(e) => {
                setSelectedShift(e.target.value);
                setPage(1);
              }}
              style={{ padding: '8px 12px', fontSize: '0.85rem', width: 'auto' }}
            >
              <option value="all">All Shifts</option>
              <option value="Day">Day Shift</option>
              <option value="Night">Night Shift</option>
              <option value="Rotational">Rotational</option>
            </select>

            {/* Status Filter */}
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              style={{ padding: '8px 12px', fontSize: '0.85rem', width: 'auto' }}
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
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
        <CaregiverTable
          caregivers={caregivers}
          loading={loading}
          selectedIds={selectedIds}
          onSelectCaregiver={handleSelectCaregiver}
          onSelectAll={handleSelectAll}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onAssignElderly={(cg) => setAssignCaregiver(cg)}
          onViewReports={(cg) => setViewReportsCaregiver(cg)}
          onViewPerformance={(cg) => setViewPerfCaregiver(cg)}
          onEdit={(cg) => setEditCaregiver(cg)}
          onDelete={(cg) => setDeleteCaregiver(cg)}
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
      <CaregiverFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateCaregiver}
        loading={actionLoading}
      />

      <CaregiverFormModal
        isOpen={!!editCaregiver}
        onClose={() => setEditCaregiver(null)}
        onSubmit={handleUpdateCaregiver}
        initialData={editCaregiver}
        isEdit={true}
        loading={actionLoading}
      />

      <AssignElderlyToCaregiverModal
        isOpen={!!assignCaregiver}
        onClose={() => {
          setAssignCaregiver(null);
          fetchCaregivers();
        }}
        caregiver={assignCaregiver}
        onAssign={handleAssignElderly}
        onRemove={handleRemoveElderly}
      />

      <DailyReportsModal
        isOpen={!!viewReportsCaregiver}
        onClose={() => setViewReportsCaregiver(null)}
        caregiver={viewReportsCaregiver}
      />

      <CaregiverPerformanceModal
        isOpen={!!viewPerfCaregiver}
        onClose={() => setViewPerfCaregiver(null)}
        caregiver={viewPerfCaregiver}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteCaregiver}
        onClose={() => setDeleteCaregiver(null)}
        onConfirm={handleDeleteCaregiverConfirm}
        user={deleteCaregiver}
        title="Delete Caregiver Profile"
        entityType="Caregiver"
        loading={actionLoading}
      />
    </div>
  );
};

export default CaregiverManagement;
