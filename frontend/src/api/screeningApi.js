// src/api/screeningApi.js
import axios from 'axios';
import useAuthStore from '../store/authStore';

const BASE = '/api/screening';

// Map legacy app roles (HEAD/ACQUISITION) to screening module roles (ADMIN/HR)
function mapRole(role) {
  if (!role) return 'GENERAL';
  if (role === 'HEAD') return 'ADMIN';
  if (role === 'ACQUISITION') return 'HR';
  return role;
}

function headers() {
  const { user } = useAuthStore.getState();
  return {
    'X-User-Role': mapRole(user?.role),
    'X-User-Name': user?.full_name ?? user?.fullName ?? user?.email ?? 'system',
  };
}

const api = axios.create({ baseURL: BASE, timeout: 60000 });

function unwrapApiResponse(payload) {
  if (
    payload &&
    typeof payload === 'object' &&
    Object.prototype.hasOwnProperty.call(payload, 'success') &&
    Object.prototype.hasOwnProperty.call(payload, 'data')
  ) {
    return payload.data;
  }
  return payload;
}

api.interceptors.request.use(cfg => {
  const token = useAuthStore.getState().token;
  if (token) cfg.headers['Authorization'] = `Bearer ${token}`;
  Object.assign(cfg.headers, headers());
  return cfg;
});

api.interceptors.response.use(
  r => {
    r.data = unwrapApiResponse(r.data);
    return r;
  },
  err => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout?.();
    }
    return Promise.reject(err);
  }
);

export const campaignAPI = {
  list:             (params) => api.get('/campaigns', { params }),
  getById:          (id)     => api.get(`/campaigns/${id}`),
  create:           (data)   => api.post('/campaigns', data),
  update:           (id, d)  => api.put(`/campaigns/${id}`, d),
  delete:           (id)     => api.delete(`/campaigns/${id}`),
  activate:         (id)     => api.post(`/campaigns/${id}/activate`),
  pullApplications: (id)     => api.post(`/campaigns/${id}/pull-applications`),
};

export const resumeAPI = {
  bulkUpload: (campaignId, files) => {
    const form = new FormData();
    form.append('campaignId', campaignId);
    files.forEach(f => form.append('files', f));
    // Do NOT set Content-Type manually — axios sets multipart boundary automatically
    return api.post('/resumes/bulk-upload', form);
  },
  uploadStatus: (campaignId) => api.get(`/resumes/upload-status/${campaignId}`),
  list:         (campaignId) => api.get(`/resumes/${campaignId}`),
  delete:       (resumeId)   => api.delete(`/resumes/detail/${resumeId}`),
};

export const pipelineAPI = {
  run: (campaignId) => api.post(`/run/${campaignId}`),
};

export const screeningAPI = {
  getResults:       (campaignId, params) => api.get(`/results/${campaignId}`, { params }),
  getTopCandidates: (campaignId)         => api.get(`/results/${campaignId}/top`),
  getResultDetail:  (resultId)           => api.get(`/results/detail/${resultId}`),
  hrOverride:       (resultId, data)     => api.patch(`/results/${resultId}/override`, data),
  shortlist:        (resultId)           => api.post(`/results/${resultId}/shortlist`),
  reject:           (resultId)           => api.post(`/results/${resultId}/reject`),
  export:           (campaignId, format) =>
    api.get(`/results/${campaignId}/export`, { params: { format }, responseType: 'blob' }),
};

export const analyticsAPI = {
  dashboard: ()           => api.get('/analytics/dashboard'),
  campaign:  (campaignId) => api.get(`/analytics/campaign/${campaignId}`),
};

export default api;
