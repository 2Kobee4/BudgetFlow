import { Currency } from '../types';

const CURRENCY_LOCALES: Record<Currency, string> = {
  TND: 'fr-TN', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB',
};

export function formatCurrency(amount: number, currency: Currency = 'TND'): string {
  if (currency === 'TND') {
    return (
      new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(amount) +
      ' TND'
    );
  }
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatMonthYear(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(dateStr));
}

export function formatMonth(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(dateStr));
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getCurrentMonthKey(): string {
  return getMonthKey(new Date());
}

export function isSameMonth(dateStr: string, monthKey: string): boolean {
  return dateStr.startsWith(monthKey);
}

export function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
