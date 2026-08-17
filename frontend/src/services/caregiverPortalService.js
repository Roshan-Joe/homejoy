import api from './api';

export const caregiverPortalService = {
  getProfile: async () => {
    const response = await api.get('/api/caregiver/me');
    return response.data;
  },

  updateProfile: async (payload) => {
    const response = await api.put('/api/caregiver/me/profile', payload);
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get('/api/caregiver/me/dashboard');
    return response.data;
  },

  getAssignedElderly: async ({ search = '', risk = '', checkin = '' } = {}) => {
    const params = {};
    if (search && search.trim()) params.search = search.trim();
    if (risk && risk !== 'all') params.risk = risk;
    if (checkin && checkin !== 'all') params.checkin = checkin;

    const response = await api.get('/api/caregiver/me/elderly', { params });
    return response.data;
  },

  getElderlyDetails: async (elderlyId) => {
    const response = await api.get(`/api/caregiver/me/elderly/${elderlyId}`);
    return response.data;
  },

  getElderlyHistory: async (elderlyId, { date_from = '', date_to = '', page = 1, limit = 20 } = {}) => {
    const params = { page, limit };
    if (date_from) params.date_from = date_from;
    if (date_to) params.date_to = date_to;

    const response = await api.get(`/api/caregiver/me/elderly/${elderlyId}/history`, { params });
    return response.data;
  },

  getElderlyMedications: async (elderlyId) => {
    const response = await api.get(`/api/caregiver/me/elderly/${elderlyId}/medications`);
    return response.data;
  },

  sendCheckinReminder: async (elderlyId) => {
    const response = await api.post(`/api/caregiver/me/elderly/${elderlyId}/remind-checkin`);
    return response.data;
  },

  getAlerts: async ({ severity = '', status = '', page = 1, limit = 20 } = {}) => {
    const params = { page, limit };
    if (severity && severity !== 'all') params.severity = severity;
    if (status && status !== 'all') params.status = status;

    const response = await api.get('/api/caregiver/me/alerts', { params });
    return response.data;
  },

  acknowledgeAlert: async (alertId) => {
    const response = await api.put(`/api/caregiver/me/alerts/${alertId}/acknowledge`);
    return response.data;
  },

  resolveAlert: async (alertId, resolutionNote = '') => {
    const response = await api.put(`/api/caregiver/me/alerts/${alertId}/resolve`, {
      resolution_note: resolutionNote
    });
    return response.data;
  },

  getTasks: async ({ elderlyId = '', priority = '', status = '' } = {}) => {
    const params = {};
    if (elderlyId) params.elderly_id = elderlyId;
    if (priority && priority !== 'all') params.priority = priority;
    if (status && status !== 'all') params.status = status;

    const response = await api.get('/api/caregiver/me/tasks', { params });
    return response.data;
  },

  createTask: async (payload) => {
    const response = await api.post('/api/caregiver/me/tasks', payload);
    return response.data;
  },

  updateTask: async (taskId, payload) => {
    const response = await api.put(`/api/caregiver/me/tasks/${taskId}`, payload);
    return response.data;
  },

  getNotifications: async () => {
    const response = await api.get('/api/caregiver/me/notifications');
    return response.data;
  },

  getCareReport: async ({ elderlyId, startDate = '', endDate = '' }) => {
    const params = { elderly_id: elderlyId };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await api.get('/api/caregiver/me/reports', { params });
    return response.data;
  },

  changePassword: async (payload) => {
    const response = await api.put('/api/caregiver/me/settings/password', payload);
    return response.data;
  },

  updateSettings: async (payload) => {
    const response = await api.put('/api/caregiver/me/settings/notifications', payload);
    return response.data;
  }
};

export default caregiverPortalService;
