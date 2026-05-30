import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Palette, DollarSign, Bell, Database, Check,
  Download, Upload, RefreshCw, Moon, Sun, Waves,
  Leaf, Sunset, Sparkles, User, LogOut, KeyRound, Trash2, Eye, EyeOff,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useIncomeStore } from '../../stores/useIncomeStore';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useGoalStore } from '../../stores/useGoalStore';
import { useEventStore } from '../../stores/useEventStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { ThemeName, Currency, BackupData } from '../../types';
import { exportJson } from '../../utils/exporters';
import { toast } from 'sonner';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const THEMES: { id: ThemeName; label: string; icon: React.ReactNode; preview: string[] }[] = [
  { id: 'dark', label: 'Dark', icon: <Moon size={16} />, preview: ['#0f1117', '#1a1d27', '#6366f1'] },
  { id: 'light', label: 'Light', icon: <Sun size={16} />, preview: ['#f4f6fb', '#ffffff', '#6366f1'] },
  { id: 'midnight', label: 'Midnight', icon: <Sparkles size={16} />, preview: ['#060811', '#0d1020', '#7c3aed'] },
  { id: 'ocean', label: 'Ocean', icon: <Waves size={16} />, preview: ['#061a2e', '#0c2444', '#0ea5e9'] },
  { id: 'emerald', label: 'Emerald', icon: <Leaf size={16} />, preview: ['#051a10', '#0a2918', '#10b981'] },
  { id: 'sunset', label: 'Sunset', icon: <Sunset size={16} />, preview: ['#1a0c00', '#2a1500', '#f97316'] },
];

const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: 'TND', label: 'Tunisian Dinar', symbol: 'TND' },
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
];

function SectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ color: 'var(--color-primary)' }}>{icon}</div>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{title}</div>
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: 28 }}>{description}</div>
    </div>
  );
}

export default function Settings() {
  const {
    settings,
    setTheme,
    setCurrency,
    setCustomTheme,
    setNotifications,
    resetSettings,
    updateSettings,
  } = useSettingsStore();

  const { user, logout, changePassword, deleteAccount } = useAuthStore();
  const { incomes } = useIncomeStore();
  const { expenses } = useExpenseStore();
  const { categories } = useCategoryStore();
  const { goals } = useGoalStore();
  const { events } = useEventStore();

  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(settings.customTheme?.primaryColor ?? '');
  const [accentColor, setAccentColor] = useState(settings.customTheme?.accentColor ?? '');
  const [fontSize, setFontSize] = useState(settings.customTheme?.fontSize ?? 14);
  const [borderRadius, setBorderRadius] = useState(settings.customTheme?.borderRadius ?? 12);

  // Change password state
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [deleteConfirmPw, setDeleteConfirmPw] = useState('');

  const handleChangePassword = async () => {
    if (!oldPw || !newPw || !confirmPw) { toast.error('Fill in all password fields'); return; }
    if (newPw !== confirmPw) { toast.error('New passwords do not match'); return; }
    if (newPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      await changePassword(oldPw, newPw);
      toast.success('Password changed successfully!');
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } catch (e: any) { toast.error(String(e)); }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount(deleteConfirmPw);
      toast.success('Account deleted');
    } catch (e: any) { toast.error(String(e)); }
  };

  const handleExportBackup = () => {
    exportJson({
      version: 1,
      exportedAt: new Date().toISOString(),
      incomes,
      expenses,
      categories,
      goals,
      events,
      settings,
    });
    toast.success('Backup exported successfully!');
  };

  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !user) return;
      try {
        const text = await file.text();
        const backup: BackupData = JSON.parse(text);

        if (!backup.incomes || !backup.expenses || !backup.settings) {
          toast.error('Invalid backup file format');
          return;
        }

        const mappedIncomes = backup.incomes.map((i) => ({
          id: i.id,
          user_id: user.id,
          title: i.title,
          amount: i.amount,
          date: i.date,
          note: i.note ?? null,
        }));

        const mappedExpenses = backup.expenses.map((exp) => ({
          id: exp.id,
          userId: user.id,
          title: exp.title,
          amount: exp.amount,
          categoryId: exp.categoryId,
          date: exp.date,
          note: exp.note ?? null,
          recurring: exp.recurring ?? false,
        }));

        const mappedCategories = (backup.categories ?? []).map((c) => ({
          id: c.id,
          user_id: user.id,
          name: c.name,
          color: c.color,
        }));

        const mappedGoals = (backup.goals ?? []).map((g) => ({
          id: g.id,
          userId: user.id,
          title: g.title,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount ?? 0,
          deadline: g.deadline ?? null,
          color: g.color ?? null,
        }));

        const mappedEvents = (backup.events ?? []).map((ev) => ({
          id: ev.id,
          userId: user.id,
          title: ev.title,
          date: ev.date,
          color: ev.color,
          description: ev.description ?? null,
          reminderDays: ev.reminderDays ?? null,
        }));

        const dbSettings = {
          user_id: user.id,
          theme: backup.settings.theme,
          currency: backup.settings.currency,
          notif_enabled: backup.settings.notifications.enabled ? 1 : 0,
          notif_days: backup.settings.notifications.defaultReminderDays,
          sidebar_collapsed: backup.settings.sidebarCollapsed ? 1 : 0,
          custom_primary: backup.settings.customTheme?.primaryColor ?? null,
          custom_accent: backup.settings.customTheme?.accentColor ?? null,
          custom_font_size: backup.settings.customTheme?.fontSize ?? null,
          custom_radius: backup.settings.customTheme?.borderRadius ?? null,
        };

        // Call Tauri to import backup into SQLite
        await invoke('import_backup', {
          userId: user.id,
          incomes: mappedIncomes,
          expenses: mappedExpenses,
          categories: mappedCategories,
          goals: mappedGoals,
          events: mappedEvents,
          settings: dbSettings,
        });

        toast.success('Backup restored! Restarting...');
        setTimeout(() => window.location.reload(), 1200);
      } catch (err: any) {
        toast.error(`Failed to restore backup: ${String(err)}`);
      }
    };
    input.click();
  };

  const handleApplyCustomTheme = async () => {
    await setCustomTheme({
      primaryColor: primaryColor || undefined,
      accentColor: accentColor || undefined,
      fontSize,
      borderRadius,
    });
    toast.success('Custom theme applied!');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Settings</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* ── Appearance ──────────────────────────────────────────────── */}
        <div className="card" style={{ padding: 24, gridColumn: '1 / -1' }}>
          <SectionHeader
            icon={<Palette size={18} />}
            title="Appearance"
            description="Choose a built-in theme or customize colors and typography."
          />

          {/* Theme Picker */}
          <div style={{ marginBottom: 24 }}>
            <div className="input-label" style={{ marginBottom: 12 }}>Built-in Themes</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
              {THEMES.map((theme) => (
                <div
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: settings.theme === theme.id
                      ? '2px solid var(--color-primary)'
                      : '2px solid var(--border-color)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  {/* Preview colors */}
                  <div style={{ display: 'flex', height: 48 }}>
                    {theme.preview.map((c, i) => (
                      <div key={i} style={{ flex: 1, background: c }} />
                    ))}
                  </div>
                  <div style={{
                    padding: '6px 8px',
                    background: theme.preview[0],
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: theme.id === 'light' ? '#0f1117' : '#fff',
                  }}>
                    {theme.icon}
                    {theme.label}
                  </div>
                  {settings.theme === theme.id && (
                    <div style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: 'var(--color-primary)',
                      borderRadius: '50%',
                      width: 18,
                      height: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Check size={11} color="white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Custom Theme */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
            <div className="input-label" style={{ marginBottom: 12 }}>Custom Overrides</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <div className="input-group">
                <label className="input-label">Primary Color</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="color"
                    value={primaryColor || '#6366f1'}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ width: 40, height: 38, borderRadius: 6, border: '1px solid var(--border-color)', cursor: 'pointer', padding: 2 }}
                  />
                  <input
                    className="input"
                    placeholder="#6366f1"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Accent Color</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="color"
                    value={accentColor || '#06b6d4'}
                    onChange={(e) => setAccentColor(e.target.value)}
                    style={{ width: 40, height: 38, borderRadius: 6, border: '1px solid var(--border-color)', cursor: 'pointer', padding: 2 }}
                  />
                  <input
                    className="input"
                    placeholder="#06b6d4"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Font Size: {fontSize}px</label>
                <input
                  type="range"
                  min="12"
                  max="18"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  style={{ width: '100%', marginTop: 9, accentColor: 'var(--color-primary)' }}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Border Radius: {borderRadius}px</label>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(Number(e.target.value))}
                  style={{ width: '100%', marginTop: 9, accentColor: 'var(--color-primary)' }}
                />
              </div>
            </div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={handleApplyCustomTheme}>
              Apply Custom Theme
            </button>
          </div>
        </div>

        {/* ── Currency ─────────────────────────────────────────────────── */}
        <div className="card" style={{ padding: 24 }}>
          <SectionHeader
            icon={<DollarSign size={18} />}
            title="Currency"
            description="Choose your default display currency."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CURRENCIES.map((c) => (
              <div
                key={c.value}
                onClick={() => { setCurrency(c.value); toast.success(`Currency set to ${c.label}`); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  border: settings.currency === c.value
                    ? '1px solid var(--color-primary)'
                    : '1px solid var(--border-color)',
                  background: settings.currency === c.value ? 'rgba(99,102,241,0.08)' : 'var(--bg-hover)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: settings.currency === c.value ? 'var(--color-primary)' : 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: settings.currency === c.value ? 'white' : 'var(--text-secondary)',
                  flexShrink: 0,
                }}>
                  {c.symbol}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{c.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.value}</div>
                </div>
                {settings.currency === c.value && (
                  <Check size={16} color="var(--color-primary)" style={{ marginLeft: 'auto' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Notifications ─────────────────────────────────────────── */}
        <div className="card" style={{ padding: 24 }}>
          <SectionHeader
            icon={<Bell size={18} />}
            title="Notifications"
            description="Configure reminders for upcoming events."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  Enable Notifications
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Get reminded about upcoming events
                </div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.notifications.enabled}
                  onChange={(e) =>
                    setNotifications({ ...settings.notifications, enabled: e.target.checked })
                  }
                />
                <span className="toggle-track" />
              </label>
            </div>

            {settings.notifications.enabled && (
              <div>
                <label className="input-label">Reminder Lead Time</label>
                <select
                  className="select"
                  value={settings.notifications.defaultReminderDays}
                  onChange={(e) =>
                    setNotifications({
                      ...settings.notifications,
                      defaultReminderDays: Number(e.target.value),
                    })
                  }
                >
                  <option value={1}>1 day before</option>
                  <option value={3}>3 days before</option>
                  <option value={7}>7 days before</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ── Data & Backup ─────────────────────────────────────────── */}
        <div className="card" style={{ padding: 24, gridColumn: '1 / -1' }}>
          <SectionHeader
            icon={<Database size={18} />}
            title="Data & Backup"
            description="Export or restore your financial data. Backups include all transactions, categories, goals, events, and settings."
          />

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleExportBackup}>
              <Download size={16} /> Export Backup
            </button>
            <button className="btn btn-secondary" onClick={handleImportBackup}>
              <Upload size={16} /> Import Backup
            </button>
            <div style={{ flex: 1 }} />
            <button
              className="btn btn-danger"
              onClick={() => setConfirmReset(true)}
            >
              <RefreshCw size={16} /> Reset to Defaults
            </button>
          </div>

          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 8, background: 'var(--bg-hover)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            📊 Current data: {incomes.length} incomes · {expenses.length} expenses · {categories.length} categories · {goals.length} goals · {events.length} events
          </div>

          {/* Keyboard Shortcuts Reference */}
          <div style={{ marginTop: 16, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
            <div className="input-label" style={{ marginBottom: 10 }}>Keyboard Shortcuts</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {[
                { keys: 'Ctrl + N', action: 'Add Expense' },
                { keys: 'Ctrl + Shift + N', action: 'Add Income' },
                { keys: 'Ctrl + F', action: 'Search Transactions' },
                { keys: 'Ctrl + S', action: 'Export Backup' },
              ].map((s) => (
                <div key={s.keys} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <kbd style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 5,
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                  }}>
                    {s.keys}
                  </kbd>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

        {/* ── Account ───────────────────────────────────────────────────── */}
        <div className="card" style={{ padding: 24, gridColumn: '1 / -1' }}>
          <SectionHeader
            icon={<User size={18} />}
            title="Account"
            description="Manage your login credentials and account security."
          />

          {/* User Info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '14px 18px', borderRadius: 10,
            background: 'var(--bg-hover)', marginBottom: 20,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', fontWeight: 700, color: 'white',
            }}>
              {user?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user?.username}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</div>
            </div>
            <button
              className="btn btn-danger btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={logout}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>

          {/* Change Password */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20, marginBottom: 20 }}>
            <div className="input-label" style={{ marginBottom: 12 }}>
              <KeyRound size={13} style={{ display: 'inline', marginRight: 6 }} />
              Change Password
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'end' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Current Password</label>
                <input className="input" type={showPw ? 'text' : 'password'}
                  value={oldPw} onChange={(e) => setOldPw(e.target.value)}
                  placeholder="••••••••" />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">New Password</label>
                <input className="input" type={showPw ? 'text' : 'password'}
                  value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  placeholder="••••••••" />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Confirm New</label>
                <input className="input" type={showPw ? 'text' : 'password'}
                  value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="••••••••" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
              <button className="btn btn-primary btn-sm" onClick={handleChangePassword}>
                <KeyRound size={13} /> Update Password
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowPw(v => !v)}
                style={{ fontSize: '0.78rem' }}
              >
                {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                {showPw ? 'Hide' : 'Show'} passwords
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <div style={{
            borderTop: '1px solid var(--border-color)', paddingTop: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-danger)' }}>
                Delete Account
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Permanently deletes your account and all data
              </div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={13} /> Delete Account
            </button>
          </div>
        </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset All Settings"
        message="This will reset all appearance and notification settings to their defaults. Your financial data will not be affected."
        confirmLabel="Reset Settings"
        onConfirm={async () => {
          await resetSettings();
          toast.success('Settings reset to defaults');
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      />

      {/* Delete Account confirm */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title" style={{ color: 'var(--color-danger)' }}>Delete Account</div>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                This will permanently delete your account and ALL your data. This cannot be undone.
              </p>
              <div className="input-group">
                <label className="input-label">Confirm your password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Enter password to confirm"
                  value={deleteConfirmPw}
                  onChange={(e) => setDeleteConfirmPw(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setConfirmDelete(false); setDeleteConfirmPw(''); }}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={!deleteConfirmPw}>
                <Trash2 size={14} /> Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
