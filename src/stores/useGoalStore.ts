import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { Goal } from '../types';

interface GoalState {
  goals: Goal[];
  initialize: (userId: number) => Promise<void>;
  addGoal: (userId: number, title: string, targetAmount: number, currentAmount?: number, deadline?: string, color?: string) => Promise<void>;
  updateGoal: (id: string, title: string, targetAmount: number, currentAmount: number, deadline?: string, color?: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  deposit: (id: string, amount: number) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],

  initialize: async (userId) => {
    try {
      const goals = await invoke<Goal[]>('get_goals', { userId });
      set({ goals });
    } catch (e) {
      console.error('Failed to load goals:', e);
    }
  },

  addGoal: async (userId, title, targetAmount, currentAmount = 0, deadline, color) => {
    const goal = await invoke<Goal>('add_goal', {
      userId, title, targetAmount, currentAmount, deadline, color,
    });
    set((s) => ({ goals: [...s.goals, goal] }));
  },

  updateGoal: async (id, title, targetAmount, currentAmount, deadline, color) => {
    await invoke('update_goal', { id, title, targetAmount, currentAmount, deadline, color });
    set((s) => ({
      goals: s.goals.map((g) =>
        g.id === id ? { ...g, title, targetAmount, currentAmount, deadline, color } : g
      ),
    }));
  },

  deleteGoal: async (id) => {
    await invoke('delete_goal', { id });
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
  },

  deposit: async (id, amount) => {
    const goal = get().goals.find((g) => g.id === id);
    if (!goal) return;
    const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
    await invoke('update_goal', {
      id,
      title: goal.title,
      targetAmount: goal.targetAmount,
      currentAmount: newAmount,
      deadline: goal.deadline,
      color: goal.color,
    });
    set((s) => ({
      goals: s.goals.map((g) =>
        g.id === id ? { ...g, currentAmount: newAmount } : g
      ),
    }));
  },
}));
