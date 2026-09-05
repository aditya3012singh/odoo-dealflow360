import React from 'react';
import { Activity, RefreshCw, Server, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useCheckHealthQuery } from '../features/auth/authApi';

export const HealthPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useCheckHealthQuery(undefined, {
    pollingInterval: 15000,
  });

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>System Observability</h1>
          <p style={{ marginTop: '0.25rem', fontSize: 'var(--text-sm)' }}>
            Real-time health monitoring of backend services and database connections.
          </p>
        </div>
        <button type="button" onClick={() => refetch()} className="btn btn-outline">
          <RefreshCw size={16} className={isLoading ? 'spinner' : ''} />
          Refresh Status
        </button>
      </div>

      <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: !isError ? 'hsla(152, 69%, 45%, 0.15)' : 'hsla(38, 92%, 50%, 0.15)',
                color: !isError ? 'var(--color-success)' : 'var(--color-warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Activity size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Service Status</h2>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Target: http://localhost:4000/api/health-check
              </p>
            </div>
          </div>

          <span className={`badge ${!isError ? 'badge-success' : 'badge-warning'}`}>
            <span
              className="pulse-indicator"
              style={{
                backgroundColor: !isError ? 'var(--color-success)' : 'var(--color-warning)',
              }}
            />
            {!isError ? 'Operational' : 'Simulated / Standalone'}
          </span>
        </div>

        {/* Breakdown info */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            maxHeight: '280px',
            overflowY: 'auto',
          }}
        >
          {isLoading ? (
            <div>Querying backend service diagnostics...</div>
          ) : data ? (
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : (
            <div>
              {`{
  "status": "standalone",
  "message": "Frontend is running in local preview mode. Start backend server at port 4000 to link live database & Redis.",
  "timestamp": "${new Date().toISOString()}",
  "services": {
    "auth": "ready",
    "theme": "active",
    "rtk_query": "online"
  }
}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
