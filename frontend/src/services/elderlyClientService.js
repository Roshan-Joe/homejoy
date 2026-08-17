/**
 * Elderly Client Service
 * Centralises all API calls for elderly-user-facing endpoints.
 * All calls hit /api/elderly/me/... — these are different from admin management endpoints.
 */
import api from './api';

const BASE = '/api/elderly/me';

export const elderlyClientService = {

  // --- Profile ---
  getProfile: () => api.get(BASE).then(r => r.data),
  updateProfile: (payload) => api.put(BASE, payload).then(r => r.data),

  // --- Health Information ---
  getHealthInfo: () => api.get(`${BASE}/health`).then(r => r.data),
  updateHealthInfo: (payload) => api.put(`${BASE}/health`, payload).then(r => r.data),

  // --- Hospital Information ---
  getHospitalInfo: () => api.get(`${BASE}/hospital`).then(r => r.data),
  updateHospitalInfo: (payload) => api.put(`${BASE}/hospital`, payload).then(r => r.data),

  // --- Doctor Information ---
  getDoctorInfo: () => api.get(`${BASE}/doctor`).then(r => r.data),

  // --- Medications ---
  getMedications: () => api.get(`${BASE}/medications`).then(r => r.data),
  addMedication: (payload) => api.post(`${BASE}/medications`, payload).then(r => r.data),
  updateMedication: (id, payload) => api.put(`${BASE}/medications/${id}`, payload).then(r => r.data),
  deleteMedication: (id) => api.delete(`${BASE}/medications/${id}`).then(r => r.data),
  logMedicationDose: (id, payload) => api.post(`${BASE}/medications/${id}/log-dose`, payload).then(r => r.data),


  // --- Emergency Contacts ---
  getEmergencyContacts: () => api.get(`${BASE}/emergency-contacts`).then(r => r.data),
  addEmergencyContact: (payload) => api.post(`${BASE}/emergency-contacts`, payload).then(r => r.data),
  updateEmergencyContact: (id, payload) => api.put(`${BASE}/emergency-contacts/${id}`, payload).then(r => r.data),
  deleteEmergencyContact: (id) => api.delete(`${BASE}/emergency-contacts/${id}`).then(r => r.data),

  // --- Caregiver (view only) ---
  getCaregiver: () => api.get(`${BASE}/caregiver`).then(r => r.data),

  // --- Daily Wellness Check-In ---
  getTodayCheckin: () => api.get(`${BASE}/checkins/today`).then(r => r.data),
  submitCheckin: (payload) => api.post(`${BASE}/checkins`, payload).then(r => r.data),

  // --- Wellness History ---
  getWellnessHistory: ({ page = 1, limit = 20 } = {}) =>
    api.get(`${BASE}/wellness-history`, { params: { page, limit } }).then(r => r.data),

  // --- Notifications ---
  getNotifications: () => api.get(`${BASE}/notifications`).then(r => r.data),

  // --- Settings ---
  updateNotificationPrefs: (payload) => api.put(`${BASE}/settings/notifications`, payload).then(r => r.data),
  changePassword: (payload) => api.post(`${BASE}/settings/change-password`, payload).then(r => r.data),

  // --- Setup ---
  markSetupComplete: () => api.post(`${BASE}/setup/complete`).then(r => r.data),
};

export default elderlyClientService;
