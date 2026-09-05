import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAppDispatch } from '../app/hooks';
import { setCredentials } from '../features/auth/authSlice';
import { addToast } from '../features/ui/uiSlice';
import { useRegisterMutation } from '../features/auth/authApi';
import { OAuthButtons } from '../components/common/OAuthButtons';

export const RegisterPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const [registerApi, { isLoading }] = useRegisterMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    try {
      const res = await registerApi({ username, email, password }).unwrap();
      if (res.success) {
        dispatch(
          addToast({
            type: 'success',
            message: 'Registration successful! Please sign in with your credentials.',
          })
        );
        navigate('/login');
      }
    } catch (err: any) {
      console.warn('Registration failed:', err);
      const message = err?.data?.message || err?.message || 'Registration failed. Please check backend server.';
      setValidationError(message);
      dispatch(addToast({ type: 'error', message }));
    }
  };

  const handleInstantDemoSignup = () => {
    const newUser = {
      id: `usr_${Date.now()}`,
      username: username.trim() || 'NewExplorer',
      email: email.trim() || 'explorer@company.com',
      role: 'developer',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    };
    const token = `mock_reg_token_${Date.now()}`;

    dispatch(setCredentials({ user: newUser, accessToken: token }));
    dispatch(
      addToast({
        type: 'success',
        message: 'Account created and authenticated instantly!',
      })
    );
    navigate('/dashboard');
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
          maxWidth: '480px',
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>Create an Account</h1>
          <p style={{ fontSize: 'var(--text-sm)' }}>
            Join ApexHub to unlock modern enterprise workflows.
          </p>
        </div>

        {/* Validation error display */}
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

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-username">
              Username
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <User size={18} />
              </span>
              <input
                id="reg-username"
                type="text"
                required
                className="form-input has-icon-left"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">
              Email Address
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Mail size={18} />
              </span>
              <input
                id="reg-email"
                type="email"
                required
                className="form-input has-icon-left"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">
              Password
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Lock size={18} />
              </span>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input has-icon-left has-icon-right"
                placeholder="At least 6 characters"
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

          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">
              Confirm Password
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Lock size={18} />
              </span>
              <input
                id="reg-confirm"
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input has-icon-left"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
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
                <span className="spinner" /> Creating Account...
              </>
            ) : (
              <>
                <UserPlus size={18} /> Sign Up Now
              </>
            )}
          </button>
        </form>

        {/* Quick Instant Sign Up for testing */}
        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleInstantDemoSignup}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontSize: 'var(--text-xs)',
              textDecoration: 'underline',
            }}
          >
            Instant Demo Signup & Login
          </button>
        </div>

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
          <span>OR SIGN UP WITH</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
        </div>

        {/* OAuth Social Buttons */}
        <OAuthButtons actionLabel="Sign up with" />

        {/* Back to Login Link */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--color-primary)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
