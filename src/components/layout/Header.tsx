import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Your financial overview' },
  '/history': { title: 'History', subtitle: 'All transactions' },
  '/analytics': { title: 'Analytics', subtitle: 'Spending trends & insights' },
  '/goals': { title: 'Savings Goals', subtitle: 'Track your progress' },
  '/settings': { title: 'Settings', subtitle: 'Preferences & data' },
};

export default function Header() {
  const location = useLocation();
  const info = PAGE_TITLES[location.pathname] ?? { title: 'BudgetFlow', subtitle: '' };
  const today = formatDate(new Date().toISOString());

  return (
    <header className="app-header">
      <div>
        <div className="header-title">{info.title}</div>
        <div className="header-subtitle">{info.subtitle}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '8px' }}>
          {today}
        </div>
      </div>
    </header>
  );
}
