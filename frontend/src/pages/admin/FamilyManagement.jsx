import React, { useState, useEffect } from 'react';
import familyService from '../../services/familyService';

import SearchBar from '../../components/admin/SearchBar';
import Pagination from '../../components/admin/Pagination';
import FamilyTable from '../../components/admin/FamilyTable';
import FamilyFormModal from '../../components/admin/FamilyFormModal';
import LinkElderlyToFamilyModal from '../../components/admin/LinkElderlyToFamilyModal';
import EmergencySummaryModal from '../../components/admin/EmergencySummaryModal';
import DeleteConfirmationModal from '../../components/admin/DeleteConfirmationModal';

import { HeartHandshake, RefreshCw, UserPlus, Filter, AlertTriangle } from 'lucide-react';

export const FamilyManagement = () => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Search & Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [relFilter, setRelFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editFamilyMember, setEditFamilyMember] = useState(null);
  const [linkFamilyMember, setLinkFamilyMember] = useState(null);
  const [viewEmergencyFamilyMember, setViewEmergencyFamilyMember] = useState(null);
  const [deleteFamilyMember, setDeleteFamilyMember] = useState(null);

  const fetchFamilyMembers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await familyService.getFamilyMembers({
        search: searchTerm,
        relationship: relFilter,
        page,
        limit: 10
      });

      setFamilyMembers(data.family_members || []);
      setTotalPages(data.total_pages || 1);
      setTotalItems(data.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to fetch family member records from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyMembers();
  }, [relFilter, page]);

  const handleSearchSubmit = () => {
    setPage(1);
    fetchFamilyMembers();
  };

  const handleCreateFamilyMember = async (payload) => {
    try {
      setActionLoading(true);
      await familyService.createFamilyMember(payload);
      setIsAddModalOpen(false);
      fetchFamilyMembers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create family member profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateFamilyMember = async (payload) => {
    try {
      setActionLoading(true);
      await familyService.updateFamilyMember(editFamilyMember.id, payload);
      setEditFamilyMember(null);
      fetchFamilyMembers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update family member profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLinkElderly = async (familyId, elderlyId) => {
    try {
      await familyService.linkElderly(familyId, elderlyId);
      fetchFamilyMembers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to link elderly resident.');
    }
  };

  const handleUnlinkElderly = async (familyId, elderlyId) => {
    try {
      await familyService.unlinkElderly(familyId, elderlyId);
      fetchFamilyMembers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to unlink elderly resident.');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setActionLoading(true);
      await familyService.deleteFamilyMember(deleteFamilyMember.id);
      setDeleteFamilyMember(null);
      fetchFamilyMembers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete family member profile.');
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
              <HeartHandshake size={24} color="var(--primary)" />
              <span>Family Member Management</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              Manage family member contacts, relationships, elderly resident links, and emergency health summaries
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={fetchFamilyMembers}
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
              <span>Add Family Member</span>
            </button>
          </div>
        </div>

        {/* Search & Relationship Filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '18px' }}>
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={handleSearchSubmit}
            placeholder="Search family member name, email, phone, or relationship..."
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-select"
              value={relFilter}
              onChange={(e) => { setRelFilter(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px', fontSize: '0.88rem', borderRadius: '8px' }}
            >
              <option value="all">All Relationships</option>
              <option value="Son">Son</option>
              <option value="Daughter">Daughter</option>
              <option value="Spouse">Spouse</option>
              <option value="Sibling">Sibling</option>
              <option value="Legal Guardian">Legal Guardian</option>
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
        <FamilyTable
          familyMembers={familyMembers}
          loading={loading}
          onLinkElderly={(f) => setLinkFamilyMember(f)}
          onViewEmergencySummary={(f) => setViewEmergencyFamilyMember(f)}
          onEdit={(f) => setEditFamilyMember(f)}
          onDelete={(f) => setDeleteFamilyMember(f)}
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={10}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* ADD FAMILY MEMBER MODAL */}
      <FamilyFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateFamilyMember}
        loading={actionLoading}
      />

      {/* EDIT FAMILY MEMBER MODAL */}
      <FamilyFormModal
        isOpen={!!editFamilyMember}
        onClose={() => setEditFamilyMember(null)}
        onSubmit={handleUpdateFamilyMember}
        familyMember={editFamilyMember}
        loading={actionLoading}
      />

      {/* LINK ELDERLY MODAL */}
      <LinkElderlyToFamilyModal
        isOpen={!!linkFamilyMember}
        onClose={() => setLinkFamilyMember(null)}
        familyMember={linkFamilyMember}
        onLink={handleLinkElderly}
        onUnlink={handleUnlinkElderly}
      />

      {/* EMERGENCY SUMMARY MODAL */}
      <EmergencySummaryModal
        isOpen={!!viewEmergencyFamilyMember}
        onClose={() => setViewEmergencyFamilyMember(null)}
        familyMember={viewEmergencyFamilyMember}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
        isOpen={!!deleteFamilyMember}
        onClose={() => setDeleteFamilyMember(null)}
        onConfirm={handleDeleteConfirm}
        user={deleteFamilyMember}
        loading={actionLoading}
      />
    </div>
  );
};

export default FamilyManagement;
