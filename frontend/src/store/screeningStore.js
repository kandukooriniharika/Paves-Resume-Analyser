// src/store/screeningStore.js
import { create } from 'zustand';

const useScreeningStore = create((set) => ({
  uploadProgress: {},    // campaignId → UploadStatusResponse
  setUploadProgress: (campaignId, status) =>
    set(s => ({ uploadProgress: { ...s.uploadProgress, [campaignId]: status } })),
  clearUploadProgress: (campaignId) =>
    set(s => {
      const { [campaignId]: _, ...rest } = s.uploadProgress;
      return { uploadProgress: rest };
    }),
}));

export default useScreeningStore;
