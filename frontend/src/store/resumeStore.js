// src/store/resumeStore.js
import { create } from 'zustand';
import { resumeAPI } from '../api/api';

const useResumeStore = create((set, get) => ({
  resumes: [],
  selectedResume: null,
  loading: false,
  error: null,

  fetchResumes: async (branchId) => {
    set({ loading: true, error: null });
    try {
      const res = await resumeAPI.getByBranch(branchId);
      set({ resumes: res.data, loading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || err.response?.data || 'Failed to fetch resumes',
        loading: false,
      });
    }
  },

  shortlistResume: async (resumeId, notes = '') => {
    try {
      const res = await resumeAPI.shortlist(resumeId, { notes });
      const updated = res.data;
      set((state) => ({
        resumes: state.resumes.map((r) => r.id === resumeId ? updated : r),
        selectedResume: state.selectedResume?.id === resumeId ? updated : state.selectedResume,
      }));
      return updated;
    } catch (err) {
      throw err;
    }
  },

  setSelectedResume: (resume) => set({ selectedResume: resume }),

  clearResumes: () => set({ resumes: [], selectedResume: null, error: null }),
}));

export default useResumeStore;
