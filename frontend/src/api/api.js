// src/api/api.js
import axios from 'axios';
import useAuthStore from '../store/authStore';
import {
  normalizeBranchList,
  normalizeBranchSummaryList,
  normalizeJobList,
  normalizeLoginPayload,
  normalizeResume,
  normalizeResumeList,
} from './normalizers';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

const authRoutePattern = /\/auth\/(login|register)$/;
const withNormalizedData = (requestPromise, normalize) =>
  requestPromise.then((response) => ({
    ...response,
    data: normalize(response.data),
  }));

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const requestUrl = err.config?.url || '';
    const token = localStorage.getItem('token');
    const hasSession = Boolean(token && token !== 'undefined' && token !== 'null');

    if (status === 401 && hasSession && !authRoutePattern.test(requestUrl)) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) =>
    withNormalizedData(api.post('/auth/login', data), normalizeLoginPayload),
  register: (data) => api.post('/auth/register', data),
};

export const branchAPI = {
  getAll: () => withNormalizedData(api.get('/branches'), normalizeBranchList),
  getSummary: () =>
    withNormalizedData(api.get('/branches/summary'), normalizeBranchSummaryList),
};

export const jobAPI = {
  getByBranch: (branchId) =>
    withNormalizedData(api.get(`/jobs/${branchId}`), normalizeJobList),
};

export const resumeAPI = {
  upload: (formData) =>
    withNormalizedData(
      api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
      normalizeResume
    ),
  create: (data) =>
    withNormalizedData(
      api.post('/resumes', null, {
        params: {
          name: data?.name,
          branchId: data?.branchId,
          jobId: data?.jobId,
        },
      }),
      normalizeResume
    ),
  getByBranch: (branchId) =>
    withNormalizedData(api.get(`/resumes/branch/${branchId}`), normalizeResumeList),
  shortlist: (resumeId, data) =>
    withNormalizedData(
      api.patch(`/resumes/${resumeId}/shortlist`, null, {
        params: { notes: data?.notes ?? '' },
      }),
      normalizeResume
    ),
};

export const analyticsAPI = {
  getTop: (branchId) =>
    withNormalizedData(api.get(`/analytics/top/${branchId}`), normalizeResumeList),
  getBranch: (branchId) =>
    withNormalizedData(api.get(`/analytics/branch/${branchId}`), normalizeResumeList),
};

export default api;
