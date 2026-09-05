import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles, ArrowRight } from 'lucide-react';
import { useAppDispatch } from '../app/hooks';
import { setCredentials, setAuthLoading } from '../features/auth/authSlice';
import { addToast } from '../features/ui/uiSlice';
import { useLoginMutation } from '../features/auth/authApi';
import { OAuthButtons } from '../components/common/OAuthButtons';

export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const [loginApi, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!email || !password) {
      setValidationError('Please enter both email and password.');
      return;
    }

    try {
      // Attempt API login with backend
      const res = await loginApi({ email, password }).unwrap();
      if (res.success && res.data) {
        dispatch(setCredentials(res.data));
        dispatch(
          addToast({
            type: 'success',
            message: `Welcome back, ${res.data.user.username}!`,
          })
        );
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      console.warn('API login failed, checking error format:', err);
      const serverMessage = err?.data?.message || err?.message || 'Invalid credentials or server offline.';
      setValidationError(serverMessage);

      // Offer demo sign-in hint
      dispatch(
        addToast({
          type: 'error',
          message: serverMessage,
        })
      );
    }
  };

  const handleDemoLogin = () => {
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
        message: 'Logged in with Demo Administrator credentials!',
      })
    );
    navigate(from, { replace: true });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 180px)',
        padding: '1rem',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative glow */}
        <div
          style={{
            position: 'absolute',
            top: '-30%',
            right: '-30%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, hsla(238, 82%, 63%, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Card Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>Welcome Back</h1>
          <p style={{ fontSize: 'var(--text-sm)' }}>
            Sign in to access your dashboard and manage your application.
          </p>
        </div>

        {/* Quick Demo Login Pill */}
        <div
          style={{
            backgroundColor: 'var(--badge-active-bg)',
            border: '1px solid hsla(238, 82%, 63%, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--text-xs)' }}>
            <Sparkles size={16} color="var(--color-primary)" />
            <span>Fast test? Use instant demo login:</span>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="btn btn-primary"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
            }}
          >
            One-Click Demo
          </button>
        </div>

        {/* Error alert if validation failed */}
        {validationError && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              fontSize: 'var(--text-xs)',
              border: '1px solid hsla(350, 89%, 60%, 0.3)',
            }}
          >
            {validationError}
          </div>
        )}

        {/* Traditional Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Mail size={18} />
              </span>
              <input
                id="email"
                type="email"
                required
                className="form-input has-icon-left"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  dispatch(addToast({ type: 'info', message: 'Password reset link sent to demo registered email.' }));
                }}
                style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)' }}
              >
                Forgot password?
              </a>
            </div>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Lock size={18} />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input has-icon-left has-icon-right"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
          >
            {isLoading ? (
              <>
                <span className="spinner" /> Authenticating...
              </>
            ) : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            color: 'var(--text-muted)',
            fontSize: 'var(--text-xs)',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
          <span>OR SOCIAL LOGIN</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
        </div>

        {/* OAuth Buttons (Google & GitHub) */}
        <OAuthButtons actionLabel="Sign in with" />

        {/* Card Footer: Switch to Sign Up */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            marginTop: '0.25rem',
          }}
        >
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{
              color: 'var(--color-primary)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            Create account <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};
