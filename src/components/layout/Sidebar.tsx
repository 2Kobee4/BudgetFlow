import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  History,
  BarChart3,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wallet,
  LogOut,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useAuthStore } from '../../stores/useAuthStore';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/history', label: 'History', icon: History },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/goals', label: 'Savings Goals', icon: Target },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings, setSidebarCollapsed } = useSettingsStore();
  const { user, logout } = useAuthStore();
  const collapsed = settings.sidebarCollapsed;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Wallet size={18} color="white" />
        </div>
        {!collapsed && <span className="sidebar-logo-text">BudgetFlow</span>}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <div
              key={path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(path)}
              title={collapsed ? label : undefined}
            >
              <Icon className="nav-icon" size={20} />
              {!collapsed && <span className="nav-label">{label}</span>}
            </div>
          );
        })}
      </nav>

      {/* User profile & Collapse Button */}
      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* User Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--color-primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.8rem',
            flexShrink: 0
          }}>
            {user?.username?.substring(0, 1).toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.username}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </span>
            </div>
          )}
        </div>

        {/* Logout Menu Option */}
        <div
          className="nav-item nav-item-logout"
          onClick={logout}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="nav-icon" size={20} />
          {!collapsed && <span className="nav-label">Sign Out</span>}
        </div>

        {/* Collapse Button */}
        <button
          className="collapse-btn"
          onClick={() => setSidebarCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ borderTop: '1px solid var(--border-color)', borderRadius: 0, paddingTop: '10px', marginTop: '4px' }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Collapse Sidebar
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
