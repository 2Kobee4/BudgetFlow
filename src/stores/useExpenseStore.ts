import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { Expense } from '../types';

interface ExpenseState {
  expenses: Expense[];
  loading: boolean;
  initialize: (userId: number) => Promise<void>;
  addExpense: (userId: number, title: string, amount: number, categoryId: string, date: string, note?: string, recurring?: boolean) => Promise<void>;
  updateExpense: (id: string, title: string, amount: number, categoryId: string, date: string, note?: string, recurring?: boolean) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  loading: false,

  initialize: async (userId) => {
    set({ loading: true });
    try {
      const expenses = await invoke<Expense[]>('get_expenses', { userId });
      set({ expenses, loading: false });
    } catch (e) {
      console.error('Failed to load expenses:', e);
      set({ loading: false });
    }
  },

  addExpense: async (userId, title, amount, categoryId, date, note, recurring = false) => {
    const expense = await invoke<Expense>('add_expense', {
      userId, title, amount, categoryId, date, note, recurring,
    });
    set((s) => ({ expenses: [expense, ...s.expenses] }));
  },

  updateExpense: async (id, title, amount, categoryId, date, note, recurring = false) => {
    await invoke('update_expense', { id, title, amount, categoryId, date, note, recurring });
    set((s) => ({
      expenses: s.expenses.map((e) =>
        e.id === id ? { ...e, title, amount, categoryId, date, note, recurring } : e
      ),
    }));
  },

  deleteExpense: async (id) => {
    await invoke('delete_expense', { id });
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
  },
}));
