// src/api/screeningApi.js
import axios from 'axios';
import useAuthStore from '../store/authStore';

const BASE = '/api/screening';

function mapRole(role) {
  if (!role) return 'RECRUITER';
  // Pass new roles straight through
  if (['HR_ADMIN', 'RECRUITER', 'HIRING_MANAGER'].includes(role)) return role;
  // Legacy role mapping (keep backward compat during migration)
  if (role === 'HEAD' || role === 'ADMIN') return 'HR_ADMIN';
  if (role === 'HR' || role === 'ACQUISITION') return 'RECRUITER';
  return 'RECRUITER';
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

// ── JD Management (HR_ADMIN) ─────────────────────────────────────────────────
const jdBase = axios.create({ baseURL: '/api/jd', timeout: 60000 });
jdBase.interceptors.request.use(cfg => {
  const { token, user } = useAuthStore.getState();
  if (token) cfg.headers['Authorization'] = `Bearer ${token}`;
  cfg.headers['X-User-Role'] = mapRole(user?.role);
  cfg.headers['X-User-Name'] = user?.full_name ?? user?.email ?? 'system';
  return cfg;
});
jdBase.interceptors.response.use(r => { r.data = unwrapApiResponse(r.data); return r; });

export const jdAPI = {
  listAll:       ()              => jdBase.get('/'),
  listActive:    ()              => jdBase.get('/active'),
  getById:       (id)            => jdBase.get(`/${id}`),
  createFromText: (params)       => jdBase.post('/text', null, { params }),
  createFromFile: (formData, params) =>
    jdBase.post('/upload', formData, { params }),
  newVersion:    (id, params)    => jdBase.post(`/${id}/version`, null, { params }),
  activate:      (id)            => jdBase.patch(`/${id}/activate`),
  archive:       (id)            => jdBase.patch(`/${id}/archive`),
};

// ── Workflow Stage Management ─────────────────────────────────────────────────
const workflowBase = axios.create({ baseURL: '/api/workflow', timeout: 30000 });
workflowBase.interceptors.request.use(cfg => {
  const { token, user } = useAuthStore.getState();
  if (token) cfg.headers['Authorization'] = `Bearer ${token}`;
  cfg.headers['X-User-Role'] = mapRole(user?.role);
  cfg.headers['X-User-Name'] = user?.full_name ?? user?.email ?? 'system';
  return cfg;
});
workflowBase.interceptors.response.use(r => { r.data = unwrapApiResponse(r.data); return r; });

export const workflowAPI = {
  moveStage:    (resultId, body) => workflowBase.patch(`/results/${resultId}/stage`, body),
  getByStage:   (campaignId, stage) => workflowBase.get(`/campaigns/${campaignId}/stages/${stage}`),
  listStages:   ()               => workflowBase.get('/stages'),
};

// ── Talent Pool ───────────────────────────────────────────────────────────────
const talentBase = axios.create({ baseURL: '/api/talent-pool', timeout: 30000 });
talentBase.interceptors.request.use(cfg => {
  const { token, user } = useAuthStore.getState();
  if (token) cfg.headers['Authorization'] = `Bearer ${token}`;
  cfg.headers['X-User-Role'] = mapRole(user?.role);
  cfg.headers['X-User-Name'] = user?.full_name ?? user?.email ?? 'system';
  return cfg;
});
talentBase.interceptors.response.use(r => { r.data = unwrapApiResponse(r.data); return r; });

export const talentPoolAPI = {
  list:           (page = 0, size = 20) => talentBase.get('/', { params: { page, size } }),
  search:         (q)                   => talentBase.get('/search', { params: { q } }),
  semanticSearch: (q, campaignId, topK) => talentBase.get('/semantic-search', { params: { q, campaignId, topK } }),
  byScore:        (minScore)            => talentBase.get('/by-score', { params: { minScore } }),
  bySource:       (source)              => talentBase.get(`/by-source/${source}`),
};

// ── Naukri Import ─────────────────────────────────────────────────────────────
const intakeBase = axios.create({ baseURL: '/api/intake', timeout: 120000 });
intakeBase.interceptors.request.use(cfg => {
  const { token, user } = useAuthStore.getState();
  if (token) cfg.headers['Authorization'] = `Bearer ${token}`;
  cfg.headers['X-User-Role'] = mapRole(user?.role);
  return cfg;
});
intakeBase.interceptors.response.use(r => { r.data = unwrapApiResponse(r.data); return r; });

export const intakeAPI = {
  importNaukri: (campaignId, xlsxFile) => {
    const form = new FormData();
    form.append('campaignId', campaignId);
    form.append('file', xlsxFile);
    return intakeBase.post('/naukri/import', form, { params: { campaignId } });
  },
};

export default api;
