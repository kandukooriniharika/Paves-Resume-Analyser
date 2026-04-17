// src/api/api.js
import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

const authRoutePattern = /\/auth\/(login|register)$/;

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — clear auth and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const requestUrl = err.config?.url || '';
    const hasSession = Boolean(localStorage.getItem('token'));

    if (status === 401 && hasSession && !authRoutePattern.test(requestUrl)) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(err);
  }
);

// ─── Auth ───────────────────────────────────────────
export const authAPI = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

// ─── Branches ───────────────────────────────────────
export const branchAPI = {
  getAll:     () => api.get('/branches'),
  getSummary: () => api.get('/branches/summary'),
};

// ─── Jobs ───────────────────────────────────────────
export const jobAPI = {
  getByBranch: (branchId) => api.get(`/jobs/${branchId}`),
};

// ─── Resumes ────────────────────────────────────────
export const resumeAPI = {
  upload:       (formData) => api.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  create:       (data)     => api.post('/resumes', data),
  getByBranch:  (branchId) => api.get(`/resumes/branch/${branchId}`),
  shortlist:    (resumeId, data) => api.patch(`/resumes/${resumeId}/shortlist`, data),
};

// ─── Analytics ──────────────────────────────────────
export const analyticsAPI = {
  getTop:    (branchId) => api.get(`/analytics/top/${branchId}`),
  getBranch: (branchId) => api.get(`/analytics/branch/${branchId}`),
};

export default api;
