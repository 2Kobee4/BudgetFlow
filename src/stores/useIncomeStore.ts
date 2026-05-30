import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { Income } from '../types';

interface IncomeState {
  incomes: Income[];
  loading: boolean;
  initialize: (userId: number) => Promise<void>;
  addIncome: (userId: number, title: string, amount: number, date: string, note?: string) => Promise<void>;
  updateIncome: (id: string, title: string, amount: number, date: string, note?: string) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
}

export const useIncomeStore = create<IncomeState>((set, get) => ({
  incomes: [],
  loading: false,

  initialize: async (userId) => {
    set({ loading: true });
    try {
      const incomes = await invoke<Income[]>('get_incomes', { userId });
      set({ incomes, loading: false });
    } catch (e) {
      console.error('Failed to load incomes:', e);
      set({ loading: false });
    }
  },

  addIncome: async (userId, title, amount, date, note) => {
    const income = await invoke<Income>('add_income', { userId, title, amount, date, note });
    set((s) => ({ incomes: [income, ...s.incomes] }));
  },

  updateIncome: async (id, title, amount, date, note) => {
    await invoke('update_income', { id, title, amount, date, note });
    set((s) => ({
      incomes: s.incomes.map((i) =>
        i.id === id ? { ...i, title, amount, date, note } : i
      ),
    }));
  },

  deleteIncome: async (id) => {
    await invoke('delete_income', { id });
    set((s) => ({ incomes: s.incomes.filter((i) => i.id !== id) }));
  },
}));
