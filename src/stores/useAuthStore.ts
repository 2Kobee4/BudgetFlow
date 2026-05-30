import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  changePassword: (oldPw: string, newPw: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  restoreSession: () => void;
}

const SESSION_KEY = 'budgetflow_user';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  restoreSession: () => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const user: AuthUser = JSON.parse(raw);
        set({ user });
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await invoke<AuthUser>('login', { input: { username, password } });
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      set({ user, isLoading: false });
    } catch (err: any) {
      set({ error: String(err), isLoading: false });
      throw err;
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await invoke<AuthUser>('register', { input: { username, email, password } });
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      set({ user, isLoading: false });
    } catch (err: any) {
      set({ error: String(err), isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    set({ user: null, error: null });
    // Clear all cached store data
    window.location.reload();
  },

  clearError: () => set({ error: null }),

  changePassword: async (oldPw, newPw) => {
    const user = get().user;
    if (!user) throw new Error('Not authenticated');
    await invoke('change_password', {
      userId: user.id,
      oldPassword: oldPw,
      newPassword: newPw,
    });
  },

  deleteAccount: async (password) => {
    const user = get().user;
    if (!user) throw new Error('Not authenticated');
    await invoke('delete_account', { userId: user.id, password });
    localStorage.removeItem(SESSION_KEY);
    set({ user: null });
    window.location.reload();
  },
}));
