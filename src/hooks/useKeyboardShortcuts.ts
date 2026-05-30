import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useIncomeStore } from '../stores/useIncomeStore';
import { useExpenseStore } from '../stores/useExpenseStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useGoalStore } from '../stores/useGoalStore';
import { useEventStore } from '../stores/useEventStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { exportJson } from '../utils/exporters';

// Global modal open state — components register their handlers here
export const shortcutHandlers = {
  openAddExpense: null as (() => void) | null,
  openAddIncome: null as (() => void) | null,
  focusSearch: null as (() => void) | null,
};

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { incomes } = useIncomeStore();
  const { expenses } = useExpenseStore();
  const { categories } = useCategoryStore();
  const { goals } = useGoalStore();
  const { events } = useEventStore();
  const { settings } = useSettingsStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+N — Add Expense
      if (ctrl && !e.shiftKey && e.key === 'n') {
        e.preventDefault();
        shortcutHandlers.openAddExpense?.();
        navigate('/');
      }

      // Ctrl+Shift+N — Add Income
      if (ctrl && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        shortcutHandlers.openAddIncome?.();
        navigate('/');
      }

      // Ctrl+F — Focus Search
      if (ctrl && e.key === 'f') {
        e.preventDefault();
        shortcutHandlers.focusSearch?.();
        navigate('/history');
      }

      // Ctrl+S — Backup
      if (ctrl && e.key === 's') {
        e.preventDefault();
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
        toast.success('Backup saved successfully');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [incomes, expenses, categories, goals, events, settings]);
}
