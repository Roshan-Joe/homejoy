import api from './api';

export const familyService = {
  /**
   * Fetch paginated list of family member profiles with search & filters
   */
  getFamilyMembers: async ({ search = '', relationship = 'all', status = 'all', page = 1, limit = 10 } = {}) => {
    const params = { page, limit };
    if (search && search.trim()) params.search = search.trim();
    if (relationship && relationship !== 'all') params.relationship = relationship;
    if (status && status !== 'all') params.status = status;

    const response = await api.get('/api/family-members', { params });
    return response.data;
  },

  /**
   * Get single family member profile details by ID
   */
  getFamilyMemberById: async (familyId) => {
    const response = await api.get(`/api/family-members/${familyId}`);
    return response.data;
  },

  /**
   * Create a new family member profile
   */
  createFamilyMember: async (payload) => {
    const response = await api.post('/api/family-members', payload);
    return response.data;
  },

  /**
   * Update family member profile details
   */
  updateFamilyMember: async (familyId, payload) => {
    const response = await api.put(`/api/family-members/${familyId}`, payload);
    return response.data;
  },

  /**
   * Link an elderly resident to a family member
   */
  linkElderly: async (familyId, elderlyId) => {
    const response = await api.post(`/api/family-members/${familyId}/link-elderly`, {
      elderly_id: elderlyId
    });
    return response.data;
  },

  /**
   * Unlink an elderly resident from family member
   */
  unlinkElderly: async (familyId, elderlyId) => {
    const response = await api.post(`/api/family-members/${familyId}/unlink-elderly`, {
      elderly_id: elderlyId
    });
    return response.data;
  },

  /**
   * Fetch emergency summary report for linked elderly residents
   */
  getEmergencySummary: async (familyId) => {
    const response = await api.get(`/api/family-members/${familyId}/emergency-summary`);
    return response.data;
  },

  /**
   * Delete family member profile
   */
  deleteFamilyMember: async (familyId) => {
    const response = await api.delete(`/api/family-members/${familyId}`);
    return response.data;
  }
};

export default familyService;
