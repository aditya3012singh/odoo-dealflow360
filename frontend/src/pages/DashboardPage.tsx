import React from 'react';
import {
  Layers,
  Shield,
  Activity,
  CheckCircle2,
  RefreshCw,
  Bell,
  Sun,
  Moon,
  User,
  Key,
  Server,
  Zap,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { toggleTheme } from '../features/theme/themeSlice';
import { addToast } from '../features/ui/uiSlice';
import { useCheckHealthQuery, useGetProfileQuery } from '../features/auth/authApi';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated } = useAppSelector((state) => state.auth);
  const { mode, resolvedTheme } = useAppSelector((state) => state.theme);

  // RTK Query hooks
  const { data: healthData, isLoading: isHealthLoading, refetch: refetchHealth } =
    useCheckHealthQuery(undefined, { pollingInterval: 30000 });
  const { data: profileData, refetch: refetchProfile } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  const currentUser = profileData?.data || user;

  const handleTestToast = () => {
    dispatch(
      addToast({
        type: 'info',
        message: 'Redux UI notification triggered successfully!',
      })
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Welcome Banner */}
      <div
        className="glass-card"
        style={{
          padding: '2.25rem',
          background:
            resolvedTheme === 'dark'
              ? 'linear-gradient(135deg, hsla(238, 82%, 63%, 0.15) 0%, hsla(187, 92%, 53%, 0.08) 100%)'
              : 'linear-gradient(135deg, hsla(238, 82%, 63%, 0.08) 0%, hsla(187, 92%, 53%, 0.05) 100%)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-active">
                <Shield size={12} /> {currentUser?.role?.toUpperCase() || 'DEVELOPER'}
              </span>
              <span className="badge badge-success">
                <span className="pulse-indicator" /> Redux RTK Session Active
              </span>
            </div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>
              Welcome back, <span className="gradient-text">{currentUser?.username || 'Explorer'}</span>!
            </h1>
            <p style={{ marginTop: '0.25rem', fontSize: 'var(--text-base)' }}>
              Your workspace is running with full Redux Toolkit state persistence and RTK Query caching.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/profile" className="btn btn-outline">
              <User size={16} /> Edit Profile
            </Link>
            <button type="button" onClick={() => dispatch(toggleTheme())} className="btn btn-secondary">
              {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              Toggle Theme
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Key Architecture & Status Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Card 1: Live State Management Status */}
        <div className="glass-card glass-card-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Redux Architecture
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--badge-active-bg)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Redux Toolkit + RTK Query</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Unified single store managing slices + server cache
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              fontSize: 'var(--text-xs)',
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Auth Slice:</span>
              <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>Active (Authenticated)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Theme Slice:</span>
              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{mode} ({resolvedTheme})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Base Query:</span>
              <span style={{ fontWeight: 600 }}>baseQueryWithReauth</span>
            </div>
          </div>
        </div>

        {/* Card 2: Backend API Observability */}
        <div className="glass-card glass-card-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Backend Health Check
            </span>
            <button
              onClick={() => refetchHealth()}
              className="btn btn-icon btn-ghost"
              title="Refresh Health"
              style={{ padding: '0.35rem' }}
            >
              <RefreshCw size={16} className={isHealthLoading ? 'spinner' : ''} />
            </button>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                className="pulse-indicator"
                style={{
                  backgroundColor: healthData?.status === 'healthy' ? 'var(--color-success)' : 'var(--color-warning)',
                }}
              />
              <span style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>
                {healthData?.status ? healthData.status.toUpperCase() : 'STANDALONE MODE'}
              </span>
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Endpoint: <code style={{ color: 'var(--color-primary)' }}>/api/health-check</code>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              fontSize: 'var(--text-xs)',
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Target Proxy:</span>
              <span style={{ fontWeight: 600 }}>http://localhost:4000</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Polling Interval:</span>
              <span style={{ fontWeight: 600 }}>30 seconds</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status Code:</span>
              <span style={{ fontWeight: 600, color: healthData ? 'var(--color-success)' : 'var(--color-warning)' }}>
                {healthData ? '200 OK' : 'Local Fallback'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Security & Session */}
        <div className="glass-card glass-card-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              JWT Security Token
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'hsla(152, 69%, 45%, 0.15)',
                color: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Key size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Bearer JWT Active</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Automatic header injection via RTK Query
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              fontSize: 'var(--text-xs)',
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Token Storage:</span>
              <span style={{ fontWeight: 600 }}>localStorage & State</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Refresh Cookie:</span>
              <span style={{ fontWeight: 600 }}>httpOnly lax</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Token Preview:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                {token ? `${token.substring(0, 16)}...` : 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Live Playground */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: '0.5rem' }}>
          Interactive State Playground
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Test the state changes in real time. Redux slices and RTK Query hooks handle all UI and network events synchronously.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
          <button type="button" onClick={() => dispatch(toggleTheme())} className="btn btn-primary">
            {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            Toggle Dark/Light Mode
          </button>

          <button type="button" onClick={handleTestToast} className="btn btn-secondary">
            <Bell size={16} />
            Dispatch Toast Notification
          </button>

          <button type="button" onClick={() => refetchProfile()} className="btn btn-outline">
            <RefreshCw size={16} />
            Refetch Profile Cache (RTK Query)
          </button>
        </div>
      </div>
    </div>
  );
};
