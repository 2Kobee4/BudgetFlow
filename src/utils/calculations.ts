import { Income, Expense, Category } from '../types';
import { getCurrentMonthKey, isSameMonth } from './formatters';

export function getMonthlyIncome(incomes: Income[], monthKey?: string): number {
  const key = monthKey ?? getCurrentMonthKey();
  return incomes.filter((i) => isSameMonth(i.date, key)).reduce((sum, i) => sum + i.amount, 0);
}

export function getMonthlyExpenses(expenses: Expense[], monthKey?: string): number {
  const key = monthKey ?? getCurrentMonthKey();
  return expenses.filter((e) => isSameMonth(e.date, key)).reduce((sum, e) => sum + e.amount, 0);
}

export function getMonthlyBalance(incomes: Income[], expenses: Expense[], monthKey?: string): number {
  return getMonthlyIncome(incomes, monthKey) - getMonthlyExpenses(expenses, monthKey);
}

export function getCategoryMonthlyTotal(expenses: Expense[], categoryId: string, monthKey?: string): number {
  const key = monthKey ?? getCurrentMonthKey();
  return expenses
    .filter((e) => e.categoryId === categoryId && isSameMonth(e.date, key))
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getExpensesByCategory(
  expenses: Expense[],
  categories: Category[],
  monthKey?: string
): { category: Category; total: number }[] {
  return categories
    .map((cat) => ({ category: cat, total: getCategoryMonthlyTotal(expenses, cat.id, monthKey) }))
    .sort((a, b) => b.total - a.total);
}

export function getAllMonthKeys(incomes: Income[], expenses: Expense[]): string[] {
  const all = [
    ...incomes.map((i) => i.date.slice(0, 7)),
    ...expenses.map((e) => e.date.slice(0, 7)),
  ];
  const unique = [...new Set(all)].sort();
  if (unique.length === 0) {
    const now = new Date();
    return [`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`];
  }
  return unique;
}

export function getCompletionPercentage(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function estimateCompletionMonths(
  remaining: number,
  incomes: Income[],
  expenses: Expense[]
): number | null {
  const monthKeys = getAllMonthKeys(incomes, expenses);
  if (monthKeys.length === 0) return null;
  const totals = monthKeys.map((mk) => getMonthlyBalance(incomes, expenses, mk));
  const avgSavings = totals.reduce((s, t) => s + t, 0) / totals.length;
  if (avgSavings <= 0) return null;
  return Math.ceil(remaining / avgSavings);
}
