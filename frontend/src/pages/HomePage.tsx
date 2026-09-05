import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  Shield,
  Sparkles,
  ArrowRight,
  SunMoon,
  Zap,
  Lock,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setCredentials } from '../features/auth/authSlice';
import { addToast } from '../features/ui/uiSlice';

export const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const handleOneClickDemo = () => {
    const demoUser = {
      id: 'usr_demo_8829',
      username: 'Alex Rivera',
      email: 'alex.rivera@enterprise.com',
      role: 'Administrator',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      bio: 'Fullstack Architect & Lead Engineer',
      createdAt: '2026-01-15T09:00:00Z',
    };
    const demoToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo_token_authenticated';

    dispatch(setCredentials({ user: demoUser, accessToken: demoToken }));
    dispatch(
      addToast({
        type: 'success',
        message: 'Welcome to ApexHub! Authenticated in demo mode.',
      })
    );
    navigate('/dashboard');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem', padding: '2rem 0' }}>
      {/* Hero Section */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '1.5rem',
          maxWidth: '850px',
          margin: '0 auto',
        }}
      >
        <div className="badge badge-active" style={{ padding: '0.4rem 0.9rem', fontSize: 'var(--text-xs)' }}>
          <Sparkles size={14} /> Production Enterprise React 19 Architecture
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
          }}
        >
          Modern State Management,{' '}
          <span className="gradient-text">Masterfully Engineered.</span>
        </h1>

        <p
          style={{
            fontSize: 'var(--text-lg)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '680px',
          }}
        >
          A unified frontend platform combining <strong>Redux Toolkit</strong>, <strong>RTK Query</strong>, 
          OAuth authentication, dark and light modes, and seamless backend integration.
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginTop: '0.5rem',
          }}
        >
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.8rem 1.75rem', fontSize: 'var(--text-base)' }}>
              Open Dashboard <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.8rem 1.75rem', fontSize: 'var(--text-base)' }}>
                Get Started Free <ArrowRight size={18} />
              </Link>
              <button
                type="button"
                onClick={handleOneClickDemo}
                className="btn btn-secondary"
                style={{ padding: '0.8rem 1.5rem', fontSize: 'var(--text-base)' }}
              >
                <Sparkles size={18} color="var(--color-primary)" /> One-Click Live Demo
              </button>
            </>
          )}
        </div>
      </section>

      {/* Architecture Highlights Grid */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1100px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div className="glass-card glass-card-hover" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--badge-active-bg)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={20} />
          </div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Unified Redux Toolkit</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Single store managing UI slices (`theme`, `ui`, `auth`) alongside RTK Query's server cache with zero redundant boilerplate.
          </p>
        </div>

        <div className="glass-card glass-card-hover" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'hsla(187, 92%, 53%, 0.15)',
              color: 'var(--color-accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SunMoon size={20} />
          </div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Dark & Light Themes</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Carefully curated HSL color tokens with smooth transitions, glassmorphic blur, and persistent user preference in localStorage.
          </p>
        </div>

        <div className="glass-card glass-card-hover" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'hsla(152, 69%, 45%, 0.15)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={20} />
          </div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>OAuth & Full Auth Flow</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Google & GitHub OAuth, user registration, JWT access token handling, and automatic refresh token rotation on 401 Unauthorized.
          </p>
        </div>
      </section>
    </div>
  );
};
