import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../common/ToastContainer';
import { useAppSelector } from '../../app/hooks';

export const AppLayout: React.FC = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
      }}
    >
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, width: '100%', position: 'relative' }}>
        {/* Sidebar rendered for authenticated users */}
        {isAuthenticated && <Sidebar />}

        {/* Dynamic Route Outlet */}
        <main
          style={{
            flex: 1,
            padding: '2rem 1.5rem',
            maxWidth: isAuthenticated ? '1200px' : '100%',
            margin: '0 auto',
            width: '100%',
            overflowX: 'hidden',
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Persistent Toast Notification Layer */}
      <ToastContainer />

      {/* Clean Modern Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '1.25rem 1.5rem',
          textAlign: 'center',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-surface-translucent)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div>
            © {new Date().getFullYear()} ApexHub Enterprise Frontend. Built with React 19 & Redux Toolkit RTK Query.
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span>Architecture: Slices + RTK Query</span>
            <span>•</span>
            <span>Dark / Light Persistence</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
