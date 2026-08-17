import api from './api';

export const caregiverService = {
  /**
   * Fetch paginated list of caregiver profiles with search & filters
   */
  getCaregivers: async ({ search = '', shift = 'all', status = 'all', page = 1, limit = 10 } = {}) => {
    const params = { page, limit };
    if (search && search.trim()) params.search = search.trim();
    if (shift && shift !== 'all') params.shift = shift;
    if (status && status !== 'all') params.status = status;

    const response = await api.get('/api/caregivers', { params });
    return response.data;
  },

  /**
   * Get single caregiver profile details by ID
   */
  getCaregiverById: async (caregiverId) => {
    const response = await api.get(`/api/caregivers/${caregiverId}`);
    return response.data;
  },

  /**
   * Create a new caregiver profile
   */
  createCaregiver: async (payload) => {
    const response = await api.post('/api/caregivers', payload);
    return response.data;
  },

  /**
   * Update caregiver profile details
   */
  updateCaregiver: async (caregiverId, payload) => {
    const response = await api.put(`/api/caregivers/${caregiverId}`, payload);
    return response.data;
  },

  /**
   * Assign an elderly patient to a caregiver
   */
  assignElderly: async (caregiverId, elderlyId) => {
    const response = await api.post(`/api/caregivers/${caregiverId}/assign-elderly`, {
      elderly_id: elderlyId
    });
    return response.data;
  },

  /**
   * Remove an elderly patient assignment from caregiver
   */
  removeElderlyAssignment: async (caregiverId, elderlyId) => {
    const response = await api.post(`/api/caregivers/${caregiverId}/remove-elderly`, {
      elderly_id: elderlyId
    });
    return response.data;
  },

  /**
   * Fetch daily reports submitted by a caregiver
   */
  getDailyReports: async (caregiverId) => {
    const response = await api.get(`/api/caregivers/${caregiverId}/daily-reports`);
    return response.data;
  },

  /**
   * Submit a daily care report
   */
  addDailyReport: async (caregiverId, reportData) => {
    const response = await api.post(`/api/caregivers/${caregiverId}/daily-reports`, reportData);
    return response.data;
  },

  /**
   * Fetch caregiver performance analytics and scorecard
   */
  getCaregiverPerformance: async (caregiverId) => {
    const response = await api.get(`/api/caregivers/${caregiverId}/performance`);
    return response.data;
  },

  /**
   * Delete caregiver profile
   */
  deleteCaregiver: async (caregiverId) => {
    const response = await api.delete(`/api/caregivers/${caregiverId}`);
    return response.data;
  }
};

export default caregiverService;
