// src/store/authStore.js
import { create } from 'zustand';

const readStoredToken = () => {
  const token = localStorage.getItem('token');
  if (token && token !== 'undefined' && token !== 'null') {
    return token;
  }

  if (token) {
    localStorage.removeItem('token');
  }

  return null;
};

const normalizeStoredUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    ...user,
    full_name: user.full_name ?? user.fullName ?? null,
    branch_id: user.branch_id ?? user.branchId ?? null,
  };
};

const readStoredUser = () => {
  try {
    const rawUser = localStorage.getItem('user');
    return normalizeStoredUser(rawUser ? JSON.parse(rawUser) : null);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

const useAuthStore = create((set) => ({
  token: readStoredToken(),
  user: readStoredUser(),

  login: (token, user) => {
    if (!token) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ token: null, user: null });
      return;
    }

    const normalizedUser = normalizeStoredUser(user);
    localStorage.setItem('token', token);
    if (normalizedUser) {
      localStorage.setItem('user', JSON.stringify(normalizedUser));
    } else {
      localStorage.removeItem('user');
    }
    set({ token, user: normalizedUser });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));

export default useAuthStore;
