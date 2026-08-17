import api from './api';

export const elderlyService = {
  /**
   * Fetch paginated list of elderly profiles with search & filters
   */
  getElderly: async ({ search = '', caregiverId = 'all', doctorId = 'all', riskLevel = 'all', page = 1, limit = 10 } = {}) => {
    const params = { page, limit };
    if (search && search.trim()) params.search = search.trim();
    if (caregiverId && caregiverId !== 'all') params.caregiver_id = caregiverId;
    if (doctorId && doctorId !== 'all') params.doctor_id = doctorId;
    if (riskLevel && riskLevel !== 'all') params.risk_level = riskLevel;

    const response = await api.get('/api/elderly', { params });
    return response.data;
  },

  /**
   * Get single elderly profile details by ID
   */
  getElderlyById: async (elderlyId) => {
    const response = await api.get(`/api/elderly/${elderlyId}`);
    return response.data;
  },

  /**
   * Create a new elderly profile
   */
  createElderly: async (payload) => {
    const response = await api.post('/api/elderly', payload);
    return response.data;
  },

  /**
   * Update elderly patient personal & medical profile
   */
  updateElderly: async (elderlyId, payload) => {
    const response = await api.put(`/api/elderly/${elderlyId}`, payload);
    return response.data;
  },

  /**
   * Assign or unassign Caregiver
   */
  assignCaregiver: async (elderlyId, caregiverId) => {
    const response = await api.patch(`/api/elderly/${elderlyId}/assign-caregiver`, {
      caregiver_id: caregiverId
    });
    return response.data;
  },

  /**
   * Assign or unassign Doctor
   */
  assignDoctor: async (elderlyId, doctorId) => {
    const response = await api.patch(`/api/elderly/${elderlyId}/assign-doctor`, {
      doctor_id: doctorId
    });
    return response.data;
  },

  /**
   * Add daily wellness check-in log
   */
  addWellnessCheckin: async (elderlyId, checkinData) => {
    const response = await api.post(`/api/elderly/${elderlyId}/wellness-checkin`, checkinData);
    return response.data;
  },

  /**
   * Delete elderly patient profile
   */
  deleteElderly: async (elderlyId) => {
    const response = await api.delete(`/api/elderly/${elderlyId}`);
    return response.data;
  }
};

export default elderlyService;
