import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { Category } from '../types';

interface CategoryState {
  categories: Category[];
  initialize: (userId: number) => Promise<void>;
  addCategory: (userId: number, name: string, color: string) => Promise<void>;
  updateCategory: (id: string, name: string, color: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],

  initialize: async (userId) => {
    try {
      const categories = await invoke<Category[]>('get_categories', { userId });
      set({ categories });
    } catch (e) {
      console.error('Failed to load categories:', e);
    }
  },

  addCategory: async (userId, name, color) => {
    const cat = await invoke<Category>('add_category', { userId, name, color });
    set((s) => ({ categories: [...s.categories, cat] }));
  },

  updateCategory: async (id, name, color) => {
    await invoke('update_category', { id, name, color });
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? { ...c, name, color } : c)),
    }));
  },

  deleteCategory: async (id) => {
    await invoke('delete_category', { id });
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },
}));
