import api from './api';

export const doctorService = {
  /**
   * Fetch paginated list of doctor profiles with search & filters
   */
  getDoctors: async ({ search = '', specialization = 'all', status = 'all', page = 1, limit = 10 } = {}) => {
    const params = { page, limit };
    if (search && search.trim()) params.search = search.trim();
    if (specialization && specialization !== 'all') params.specialization = specialization;
    if (status && status !== 'all') params.status = status;

    const response = await api.get('/api/doctors', { params });
    return response.data;
  },

  /**
   * Get single doctor profile details by ID
   */
  getDoctorById: async (doctorId) => {
    const response = await api.get(`/api/doctors/${doctorId}`);
    return response.data;
  },

  /**
   * Create a new doctor profile
   */
  createDoctor: async (payload) => {
    const response = await api.post('/api/doctors', payload);
    return response.data;
  },

  /**
   * Update doctor profile details
   */
  updateDoctor: async (doctorId, payload) => {
    const response = await api.put(`/api/doctors/${doctorId}`, payload);
    return response.data;
  },

  /**
   * Assign an elderly patient to a doctor
   */
  assignPatient: async (doctorId, elderlyId) => {
    const response = await api.post(`/api/doctors/${doctorId}/assign-elderly`, {
      elderly_id: elderlyId
    });
    return response.data;
  },

  /**
   * Remove an elderly patient assignment from doctor
   */
  removePatientAssignment: async (doctorId, elderlyId) => {
    const response = await api.post(`/api/doctors/${doctorId}/remove-elderly`, {
      elderly_id: elderlyId
    });
    return response.data;
  },

  /**
   * Fetch medical notes written by a doctor
   */
  getMedicalNotes: async (doctorId) => {
    const response = await api.get(`/api/doctors/${doctorId}/medical-notes`);
    return response.data;
  },

  /**
   * Create a new clinical medical note
   */
  createMedicalNote: async (doctorId, noteData) => {
    const response = await api.post(`/api/doctors/${doctorId}/medical-notes`, noteData);
    return response.data;
  },

  /**
   * Fetch appointments associated with a doctor
   */
  getDoctorAppointments: async (doctorId) => {
    const response = await api.get(`/api/doctors/${doctorId}/appointments`);
    return response.data;
  },

  /**
   * Delete doctor profile
   */
  deleteDoctor: async (doctorId) => {
    const response = await api.delete(`/api/doctors/${doctorId}`);
    return response.data;
  }
};

export default doctorService;
