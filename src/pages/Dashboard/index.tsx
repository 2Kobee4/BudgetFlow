import React, { useRef } from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { useIncomeStore } from '../../stores/useIncomeStore';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import {
  getMonthlyIncome,
  getMonthlyExpenses,
  getMonthlyBalance,
} from '../../utils/calculations';
import { formatCurrency, formatMonth } from '../../utils/formatters';
import IncomeSection from './IncomeSection';
import ExpenseSection from './ExpenseSection';
import CalendarWidget from '../../components/calendar/CalendarWidget';
import { shortcutHandlers } from '../../hooks/useKeyboardShortcuts';

export default function Dashboard() {
  const { incomes } = useIncomeStore();
  const { expenses } = useExpenseStore();
  const { settings } = useSettingsStore();

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthLabel = formatMonth(new Date().toISOString());

  const monthIncome = getMonthlyIncome(incomes, currentMonth);
  const monthExpenses = getMonthlyExpenses(expenses, currentMonth);
  const monthBalance = getMonthlyBalance(incomes, expenses, currentMonth);
  const saved = monthIncome - monthExpenses;
  const savingsRate = monthIncome > 0 ? Math.round((saved / monthIncome) * 100) : 0;

  // Shortcut handler registration
  const incomeOpenRef = useRef<(() => void) | null>(null);
  const expenseOpenRef = useRef<(() => void) | null>(null);

  shortcutHandlers.openAddIncome = () => incomeOpenRef.current?.();
  shortcutHandlers.openAddExpense = () => expenseOpenRef.current?.();

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Stat Cards Row ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
      }}>
        {/* Income Card */}
        <div className="stat-card" style={{ '--card-accent': 'var(--color-success)' } as React.CSSProperties}>
          <div className="stat-card-label">
            <TrendingUp size={14} color="var(--color-success)" />
            {monthLabel} Income
          </div>
          <div className="stat-card-value" style={{ color: 'var(--color-success)' }}>
            {formatCurrency(monthIncome, settings.currency)}
          </div>
          <div className="stat-card-sub">
            {incomes.filter((i) => i.date.startsWith(currentMonth)).length} source(s) this month
          </div>
        </div>

        {/* Remaining Budget Card */}
        <div
          className="stat-card"
          style={{ '--card-accent': monthBalance >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' } as React.CSSProperties}
        >
          <div className="stat-card-label">
            <Wallet size={14} color="var(--color-primary)" />
            Remaining Budget
          </div>
          <div
            className="stat-card-value"
            style={{ color: monthBalance >= 0 ? 'var(--text-primary)' : 'var(--color-danger)' }}
          >
            {formatCurrency(Math.abs(monthBalance), settings.currency)}
            {monthBalance < 0 && ' over'}
          </div>
          <div className="stat-card-sub">
            Spent: {formatCurrency(monthExpenses, settings.currency)}
          </div>
        </div>

        {/* Monthly Savings Card */}
        <div
          className="stat-card"
          style={{ '--card-accent': saved >= 0 ? 'var(--color-accent)' : 'var(--color-warning)' } as React.CSSProperties}
        >
          <div className="stat-card-label">
            <PiggyBank size={14} color="var(--color-accent)" />
            Monthly Savings
          </div>
          <div
            className="stat-card-value"
            style={{ color: saved >= 0 ? 'var(--color-accent)' : 'var(--color-warning)' }}
          >
            {formatCurrency(Math.abs(saved), settings.currency)}
          </div>
          <div className="stat-card-sub">
            Savings rate: <strong style={{ color: savingsRate >= 20 ? 'var(--color-success)' : 'var(--text-secondary)' }}>{savingsRate}%</strong>
            {' · '}
            Expenses: {formatCurrency(monthExpenses, settings.currency)}
          </div>
        </div>
      </div>

      {/* ── Main Content: Two Columns ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* Left Column: Income + Expenses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Income */}
          <div className="card" style={{ padding: 20 }}>
            <IncomeSection onOpenModal={(fn) => { incomeOpenRef.current = fn; }} />
          </div>

          {/* Expenses */}
          <div className="card" style={{ padding: 20 }}>
            <ExpenseSection onOpenModal={(fn) => { expenseOpenRef.current = fn; }} />
          </div>
        </div>

        {/* Right Column: Calendar */}
        <div style={{ position: 'sticky', top: 0 }}>
          <CalendarWidget />
        </div>
      </div>
    </div>
  );
}
