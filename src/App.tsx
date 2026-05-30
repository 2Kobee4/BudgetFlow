import React, { useEffect, useState } from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Analytics from './pages/Analytics';
import SavingsGoals from './pages/SavingsGoals';
import Settings from './pages/Settings';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import { useAuthStore } from './stores/useAuthStore';
import { useSettingsStore } from './stores/useSettingsStore';
import { useIncomeStore } from './stores/useIncomeStore';
import { useExpenseStore } from './stores/useExpenseStore';
import { useCategoryStore } from './stores/useCategoryStore';
import { useGoalStore } from './stores/useGoalStore';
import { useEventStore } from './stores/useEventStore';
import { useNotifications } from './hooks/useNotifications';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// ─── Protected app (rendered only when logged in) ───────────────────────────
function AppContent() {
  useNotifications();
  useKeyboardShortcuts();
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/goals" element={<SavingsGoals />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppShell>
  );
}

// ─── Root app ────────────────────────────────────────────────────────────────
export default function App() {
  const { user, restoreSession } = useAuthStore();
  const { settings, initialize: initSettings } = useSettingsStore();
  const { initialize: initIncomes } = useIncomeStore();
  const { initialize: initExpenses } = useExpenseStore();
  const { initialize: initCategories } = useCategoryStore();
  const { initialize: initGoals } = useGoalStore();
  const { initialize: initEvents } = useEventStore();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [dataLoaded, setDataLoaded] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    restoreSession();
  }, []);

  // Load all user data once authenticated
  useEffect(() => {
    if (user && !dataLoaded) {
      const uid = user.id;
      Promise.all([
        initSettings(uid),
        initIncomes(uid),
        initExpenses(uid),
        initCategories(uid),
        initGoals(uid),
        initEvents(uid),
      ]).then(() => setDataLoaded(true));
    }
    if (!user) {
      setDataLoaded(false);
    }
  }, [user]);

  // Apply theme to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    if (settings.customTheme?.fontSize) {
      document.documentElement.style.setProperty(
        '--font-size-base',
        `${settings.customTheme.fontSize}px`
      );
    }
    if (settings.customTheme?.borderRadius !== undefined) {
      document.documentElement.style.setProperty(
        '--radius',
        `${settings.customTheme.borderRadius}px`
      );
    }
    if (settings.customTheme?.primaryColor) {
      document.documentElement.style.setProperty(
        '--color-primary',
        settings.customTheme.primaryColor
      );
    }
    if (settings.customTheme?.accentColor) {
      document.documentElement.style.setProperty(
        '--color-accent',
        settings.customTheme.accentColor
      );
    }
  }, [settings]);

  const toastStyle = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
  };

  return (
    <>
      {/* Always show the toaster */}
      <Toaster position="bottom-right" toastOptions={{ style: toastStyle }} />

      {!user ? (
        // ── Auth screens ──────────────────────────────────────────────────
        authView === 'login' ? (
          <LoginPage onGoRegister={() => setAuthView('register')} />
        ) : (
          <RegisterPage onGoLogin={() => setAuthView('login')} />
        )
      ) : (
        // ── Protected app ─────────────────────────────────────────────────
        <MemoryRouter>
          <AppContent />
        </MemoryRouter>
      )}
    </>
  );
}
