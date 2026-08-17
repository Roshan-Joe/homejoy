import React, { useState, useEffect } from 'react';
import doctorService from '../../services/doctorService';

import SearchBar from '../../components/admin/SearchBar';
import Pagination from '../../components/admin/Pagination';
import DoctorTable from '../../components/admin/DoctorTable';
import DoctorFormModal from '../../components/admin/DoctorFormModal';
import AssignPatientsToDoctorModal from '../../components/admin/AssignPatientsToDoctorModal';
import MedicalNotesModal from '../../components/admin/MedicalNotesModal';
import DoctorAppointmentsModal from '../../components/admin/DoctorAppointmentsModal';
import DeleteConfirmationModal from '../../components/admin/DeleteConfirmationModal';

import { Stethoscope, RefreshCw, UserPlus, Filter, AlertTriangle } from 'lucide-react';

export const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Search & Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [specFilter, setSpecFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editDoctor, setEditDoctor] = useState(null);
  const [assignDoctor, setAssignDoctor] = useState(null);
  const [viewNotesDoctor, setViewNotesDoctor] = useState(null);
  const [viewAppointmentsDoctor, setViewAppointmentsDoctor] = useState(null);
  const [deleteDoctor, setDeleteDoctor] = useState(null);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await doctorService.getDoctors({
        search: searchTerm,
        specialization: specFilter,
        page,
        limit: 10
      });

      setDoctors(data.doctors || []);
      setTotalPages(data.total_pages || 1);
      setTotalItems(data.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to fetch doctor records from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [specFilter, page]);

  const handleSearchSubmit = () => {
    setPage(1);
    fetchDoctors();
  };

  const handleCreateDoctor = async (payload) => {
    try {
      setActionLoading(true);
      await doctorService.createDoctor(payload);
      setIsAddModalOpen(false);
      fetchDoctors();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create doctor profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDoctor = async (payload) => {
    try {
      setActionLoading(true);
      await doctorService.updateDoctor(editDoctor.id, payload);
      setEditDoctor(null);
      fetchDoctors();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update doctor profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignPatient = async (doctorId, elderlyId) => {
    try {
      await doctorService.assignPatient(doctorId, elderlyId);
      fetchDoctors();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to assign elderly patient.');
    }
  };

  const handleRemovePatient = async (doctorId, elderlyId) => {
    try {
      await doctorService.removePatientAssignment(doctorId, elderlyId);
      fetchDoctors();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove patient assignment.');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setActionLoading(true);
      await doctorService.deleteDoctor(deleteDoctor.id);
      setDeleteDoctor(null);
      fetchDoctors();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete doctor profile.');
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
              <Stethoscope size={24} color="#6b21a8" />
              <span>Doctor Management</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              Manage medical doctors, specializations, medical licenses, patient assignments, clinical notes, and appointments
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={fetchDoctors}
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
              <span>Add New Doctor</span>
            </button>
          </div>
        </div>

        {/* Search & Specialization Filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '18px' }}>
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={handleSearchSubmit}
            placeholder="Search doctor name, email, specialization, or license..."
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-select"
              value={specFilter}
              onChange={(e) => { setSpecFilter(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px', fontSize: '0.88rem', borderRadius: '8px' }}
            >
              <option value="all">All Specializations</option>
              <option value="Geriatrician">Geriatrician</option>
              <option value="Cardiologist">Cardiologist</option>
              <option value="Neurologist">Neurologist</option>
              <option value="General Physician">General Physician</option>
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
        <DoctorTable
          doctors={doctors}
          loading={loading}
          onAssignPatients={(d) => setAssignDoctor(d)}
          onViewNotes={(d) => setViewNotesDoctor(d)}
          onViewAppointments={(d) => setViewAppointmentsDoctor(d)}
          onEdit={(d) => setEditDoctor(d)}
          onDelete={(d) => setDeleteDoctor(d)}
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={10}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* ADD DOCTOR MODAL */}
      <DoctorFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateDoctor}
        loading={actionLoading}
      />

      {/* EDIT DOCTOR MODAL */}
      <DoctorFormModal
        isOpen={!!editDoctor}
        onClose={() => setEditDoctor(null)}
        onSubmit={handleUpdateDoctor}
        doctor={editDoctor}
        loading={actionLoading}
      />

      {/* ASSIGN PATIENTS MODAL */}
      <AssignPatientsToDoctorModal
        isOpen={!!assignDoctor}
        onClose={() => setAssignDoctor(null)}
        doctor={assignDoctor}
        onAssign={handleAssignPatient}
        onRemove={handleRemovePatient}
      />

      {/* MEDICAL NOTES MODAL */}
      <MedicalNotesModal
        isOpen={!!viewNotesDoctor}
        onClose={() => setViewNotesDoctor(null)}
        doctor={viewNotesDoctor}
      />

      {/* APPOINTMENTS MODAL */}
      <DoctorAppointmentsModal
        isOpen={!!viewAppointmentsDoctor}
        onClose={() => setViewAppointmentsDoctor(null)}
        doctor={viewAppointmentsDoctor}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
        isOpen={!!deleteDoctor}
        onClose={() => setDeleteDoctor(null)}
        onConfirm={handleDeleteConfirm}
        user={deleteDoctor}
        loading={actionLoading}
      />
    </div>
  );
};

export default DoctorManagement;
