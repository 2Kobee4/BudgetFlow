// ─── Income ───────────────────────────────────────────────────────────────────
export interface Income {
  id: string;
  user_id?: number;
  title: string;
  amount: number;
  date: string;
  note?: string;
}

// ─── Category ─────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  user_id?: number;
  name: string;
  color: string;
  icon?: string;
}

// ─── Expense ──────────────────────────────────────────────────────────────────
export interface Expense {
  id: string;
  user_id?: number;
  title: string;
  amount: number;
  categoryId: string;
  date: string;
  note?: string;
  recurring: boolean;
}

// ─── Savings Goal ─────────────────────────────────────────────────────────────
export interface SavingsGoal {
  id: string;
  user_id?: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color?: string;
  icon?: string;
}
export type Goal = SavingsGoal; // alias for store compatibility

// ─── Event ────────────────────────────────────────────────────────────────────
export interface CalendarEvent {
  id: string;
  user_id?: number;
  title: string;
  date: string;
  color: string;
  description?: string;
  reminderDays?: number;
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export type ThemeName = 'light' | 'dark' | 'midnight' | 'ocean' | 'emerald' | 'sunset';
export type Currency = 'TND' | 'USD' | 'EUR' | 'GBP';

export interface CustomThemeOverride {
  primaryColor?: string;
  accentColor?: string;
  borderRadius?: number;
  fontSize?: number;
}

export interface NotificationSettings {
  enabled: boolean;
  defaultReminderDays: number;
}

export interface AppSettings {
  theme: ThemeName;
  currency: Currency;
  customTheme?: CustomThemeOverride;
  notifications: NotificationSettings;
  sidebarCollapsed: boolean;
}
export type Settings = AppSettings; // alias for store compatibility

// ─── Backup ───────────────────────────────────────────────────────────────────
export interface BackupData {
  version: number;
  exportedAt: string;
  incomes: Income[];
  expenses: Expense[];
  categories: Category[];
  goals: SavingsGoal[];
  events: CalendarEvent[];
  settings: AppSettings;
}

// ─── History Row ──────────────────────────────────────────────────────────────
export type TransactionType = 'income' | 'expense';

export interface HistoryRow {
  id: string;
  date: string;
  type: TransactionType;
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
  title: string;
  amount: number;
  note?: string;
  recurring?: boolean;
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export type ChartType = 'line' | 'bar' | 'area';
export type DatasetKey = 'income' | 'expenses' | 'savings' | `category_${string}`;

export interface ChartDataPoint {
  month: string;
  [key: string]: number | string;
}
