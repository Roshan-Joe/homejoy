import axios from 'axios';

// ============================================================================
// API BASE URL CONFIGURATION
// Configured dynamically from environment variable VITE_API_URL.
// ============================================================================
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// SECURITY ARCHITECTURE NOTE: TOKEN STORAGE IN LOCALSTORAGE
// ----------------------------------------------------------------------------
// Finding: JWT access tokens are stored in `localStorage` ('homejoy_token').
// Assessment: For this academic prototype / college capstone project, localStorage
// provides convenient client-side session persistence without cross-origin cookie
// configuration complexities.
// Production Recommendation: Storing tokens in localStorage is susceptible to
// theft if a Cross-Site Scripting (XSS) vulnerability exists. For enterprise /
// HIPAA compliance, authentication tokens should be stored in HttpOnly, Secure,
// SameSite=Strict cookies with CSRF tokens or maintained in-memory with short-lived
// access tokens and refresh token rotation.
// ============================================================================

// Request Interceptor: Attach JWT Token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('homejoy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthorized errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear local storage
      localStorage.removeItem('homejoy_token');
      localStorage.removeItem('homejoy_user');
    }
    return Promise.reject(error);
  }
);

export default api;
