import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { CalendarEvent } from '../types';

interface EventState {
  events: CalendarEvent[];
  initialize: (userId: number) => Promise<void>;
  addEvent: (userId: number, title: string, date: string, color: string, description?: string, reminderDays?: number) => Promise<void>;
  updateEvent: (id: string, title: string, date: string, color: string, description?: string, reminderDays?: number) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

export const useEventStore = create<EventState>((set) => ({
  events: [],

  initialize: async (userId) => {
    try {
      const events = await invoke<CalendarEvent[]>('get_events', { userId });
      set({ events });
    } catch (e) {
      console.error('Failed to load events:', e);
    }
  },

  addEvent: async (userId, title, date, color, description, reminderDays) => {
    const event = await invoke<CalendarEvent>('add_event', {
      userId, title, date, color, description, reminderDays,
    });
    set((s) => ({ events: [...s.events, event] }));
  },

  updateEvent: async (id, title, date, color, description, reminderDays) => {
    await invoke('update_event', { id, title, date, color, description, reminderDays });
    set((s) => ({
      events: s.events.map((e) =>
        e.id === id ? { ...e, title, date, color, description, reminderDays } : e
      ),
    }));
  },

  deleteEvent: async (id) => {
    await invoke('delete_event', { id });
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
  },
}));
