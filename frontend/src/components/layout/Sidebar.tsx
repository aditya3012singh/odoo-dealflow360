import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Activity,
  KeyRound,
  ChevronLeft,
  Server,
  Zap,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { toggleSidebar } from '../../features/ui/uiSlice';
import { useCheckHealthQuery } from '../../features/auth/authApi';

export const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const isSidebarOpen = useAppSelector((state) => state.ui.isSidebarOpen);
  const { data: healthData, isError: healthError } = useCheckHealthQuery(undefined, {
    pollingInterval: 30000,
  });

  const isHealthy = Boolean(healthData && !healthError);

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'User Profile', path: '/profile', icon: User },
    { label: 'System Health', path: '/health', icon: Activity },
  ];

  if (!isSidebarOpen) return null;

  return (
    <aside
      style={{
        width: '240px',
        flexShrink: 0,
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem 1rem',
        minHeight: 'calc(100vh - 65px)',
        transition: 'all var(--transition-smooth)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Sidebar Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
            }}
          >
            Workspace
          </span>
          <button
            type="button"
            onClick={() => dispatch(toggleSidebar())}
            className="btn btn-icon btn-ghost"
            style={{ padding: '0.35rem' }}
            title="Collapse Sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Nav Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: active ? 600 : 500,
                  backgroundColor: active ? 'var(--badge-active-bg)' : 'transparent',
                  color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer: Health Check & System Status */}
      <div
        className="glass-card"
        style={{
          padding: '0.875rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--text-xs)',
          }}
        >
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Server size={14} /> Backend API
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: isHealthy ? 'var(--color-success)' : 'var(--color-warning)',
              fontWeight: 600,
            }}
          >
            <span
              className="pulse-indicator"
              style={{
                backgroundColor: isHealthy ? 'var(--color-success)' : 'var(--color-warning)',
                boxShadow: isHealthy ? '0 0 6px var(--color-success)' : '0 0 6px var(--color-warning)',
              }}
            />
            {isHealthy ? 'Connected' : 'Standalone'}
          </span>
        </div>
        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            lineHeight: 1.3,
          }}
        >
          RTK Query automated cache & re-auth active
        </div>
      </div>
    </aside>
  );
};
