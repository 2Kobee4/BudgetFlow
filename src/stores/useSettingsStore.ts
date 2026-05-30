import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { Settings, ThemeName, Currency } from '../types';

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  currency: 'TND',
  notifications: { enabled: true, defaultReminderDays: 3 },
  sidebarCollapsed: false,
};

interface DbSettings {
  user_id: number;
  theme: string;
  currency: string;
  notif_enabled: boolean;
  notif_days: number;
  sidebar_collapsed: boolean;
  custom_primary: string | null;
  custom_accent: string | null;
  custom_font_size: number | null;
  custom_radius: number | null;
}

function fromDb(db: DbSettings): Settings {
  return {
    theme: db.theme as ThemeName,
    currency: db.currency as Currency,
    notifications: {
      enabled: db.notif_enabled,
      defaultReminderDays: db.notif_days,
    },
    sidebarCollapsed: db.sidebar_collapsed,
    customTheme: (db.custom_primary || db.custom_accent || db.custom_font_size || db.custom_radius)
      ? {
          primaryColor: db.custom_primary ?? undefined,
          accentColor: db.custom_accent ?? undefined,
          fontSize: db.custom_font_size ?? undefined,
          borderRadius: db.custom_radius ?? undefined,
        }
      : undefined,
  };
}

interface SettingsState {
  settings: Settings;
  userId: number | null;
  initialize: (userId: number) => Promise<void>;
  setTheme: (theme: ThemeName) => Promise<void>;
  setCurrency: (currency: Currency) => Promise<void>;
  setNotifications: (notifs: Settings['notifications']) => Promise<void>;
  setCustomTheme: (custom: Settings['customTheme']) => Promise<void>;
  setSidebarCollapsed: (v: boolean) => Promise<void>;
  resetSettings: () => Promise<void>;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
}

async function persist(userId: number, settings: Settings) {
  const payload: Omit<DbSettings, 'user_id'> & { user_id: number } = {
    user_id: userId,
    theme: settings.theme,
    currency: settings.currency,
    notif_enabled: settings.notifications.enabled,
    notif_days: settings.notifications.defaultReminderDays,
    sidebar_collapsed: settings.sidebarCollapsed,
    custom_primary: settings.customTheme?.primaryColor ?? null,
    custom_accent: settings.customTheme?.accentColor ?? null,
    custom_font_size: settings.customTheme?.fontSize ?? null,
    custom_radius: settings.customTheme?.borderRadius ?? null,
  };
  await invoke('save_settings', { settings: payload });
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  userId: null,

  initialize: async (userId) => {
    try {
      const db = await invoke<DbSettings>('get_settings', { userId });
      set({ settings: fromDb(db), userId });
    } catch (e) {
      console.error('Failed to load settings:', e);
      set({ userId });
    }
  },

  setTheme: async (theme) => {
    const s = { ...get().settings, theme };
    set({ settings: s });
    const uid = get().userId;
    if (uid) await persist(uid, s);
  },

  setCurrency: async (currency) => {
    const s = { ...get().settings, currency };
    set({ settings: s });
    const uid = get().userId;
    if (uid) await persist(uid, s);
  },

  setNotifications: async (notifications) => {
    const s = { ...get().settings, notifications };
    set({ settings: s });
    const uid = get().userId;
    if (uid) await persist(uid, s);
  },

  setCustomTheme: async (customTheme) => {
    const s = { ...get().settings, customTheme };
    set({ settings: s });
    const uid = get().userId;
    if (uid) await persist(uid, s);
  },

  setSidebarCollapsed: async (sidebarCollapsed) => {
    const s = { ...get().settings, sidebarCollapsed };
    set({ settings: s });
    const uid = get().userId;
    if (uid) await persist(uid, s);
  },

  resetSettings: async () => {
    const s = DEFAULT_SETTINGS;
    set({ settings: s });
    const uid = get().userId;
    if (uid) await persist(uid, s);
  },

  updateSettings: async (partial) => {
    const s = { ...get().settings, ...partial };
    set({ settings: s });
    const uid = get().userId;
    if (uid) await persist(uid, s);
  },
}));
