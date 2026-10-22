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
  },

  // --- Assigned Daily Reports & Urgent Help Requests ---
  getDailyReports: async ({ date = '', elderlyId = '' } = {}) => {
    const params = {};
    if (date) params.date = date;
    if (elderlyId) params.elderly_id = elderlyId;
    const response = await api.get('/api/caregiver/me/daily-reports', { params });
    return response.data;
  },

  getElderlyDailyReport: async (elderlyId, date = '') => {
    const params = {};
    if (date) params.date = date;
    const response = await api.get(`/api/caregiver/me/elderly/${elderlyId}/daily-report`, { params });
    return response.data;
  },

  getHelpRequests: async ({ status = 'all' } = {}) => {
    const params = {};
    if (status && status !== 'all') params.status = status;
    const response = await api.get('/api/caregiver/me/help-requests', { params });
    return response.data;
  },

  acknowledgeHelpRequest: async (requestId) => {
    const response = await api.put(`/api/caregiver/me/help-requests/${requestId}/acknowledge`);
    return response.data;
  },

  resolveHelpRequest: async (requestId, resolutionNote = '') => {
    const response = await api.put(`/api/caregiver/me/help-requests/${requestId}/resolve`, {
      resolution_note: resolutionNote
    });
    return response.data;
  },

  // --- Handover Notes & Shift Transitions ---
  getHandoverNotes: async ({ limit = 20, shift = '' } = {}) => {
    const params = { limit };
    if (shift && shift !== 'all') params.shift = shift;
    const response = await api.get('/api/caregiver/me/handover', { params });
    return response.data;
  },

  createHandoverNote: async (payload) => {
    const response = await api.post('/api/caregiver/me/handover', payload);
    return response.data;
  },

  // --- Missed Check-in Escalations ---
  getEscalations: async (status = 'active') => {
    const params = {};
    if (status && status !== 'all') params.status = status;
    const response = await api.get('/api/caregiver/me/escalations', { params });
    return response.data;
  },

  scanEscalations: async () => {
    const response = await api.post('/api/caregiver/me/escalations/scan');
    return response.data;
  },

  resolveEscalation: async (escalationId, resolutionNotes = '') => {
    const response = await api.put(`/api/caregiver/me/escalations/${escalationId}/resolve`, {
      resolution_notes: resolutionNotes
    });
    return response.data;
  },

  // --- Trends & Official Care Report ---
  getElderlyTrends: async (elderlyId, days = 14) => {
    const response = await api.get(`/api/caregiver/me/elderly/${elderlyId}/trends`, {
      params: { days }
    });
    return response.data;
  },

  getOfficialCareReport: async (elderlyId, days = 14) => {
    const response = await api.get(`/api/caregiver/me/elderly/${elderlyId}/care-report`, {
      params: { days }
    });
    return response.data;
  },

  // --- Guardian Daily Wellness Report Email ---
  sendGuardianDailyReportEmail: async (elderlyId, { date = '', note = '', resend = false } = {}) => {
    const payload = {};
    if (date) payload.date = date;
    if (note) payload.note = note;
    if (resend) payload.resend = resend;
    const response = await api.post(`/api/caregiver/elderly/${elderlyId}/daily-report/send-email`, payload);
    return response.data;
  },

  getGuardianDailyReportEmailStatus: async (elderlyId, date = '') => {
    const params = {};
    if (date) params.date = date;
    const response = await api.get(`/api/caregiver/elderly/${elderlyId}/daily-report/email-status`, { params });
    return response.data;
  }
};

export default caregiverPortalService;
