import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { setCredentials } from '../features/auth/authSlice';
import { addToast } from '../features/ui/uiSlice';

export const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token') || searchParams.get('accessToken');
    const userParam = searchParams.get('user');

    if (token) {
      let user = {
        id: 'usr_oauth_authenticated',
        username: 'Social User',
        email: 'social@example.com',
        role: 'user',
      };

      if (userParam) {
        try {
          user = JSON.parse(decodeURIComponent(userParam));
        } catch {
          // keep fallback
        }
      }

      dispatch(setCredentials({ user, accessToken: token }));
      dispatch(
        addToast({
          type: 'success',
          message: 'Social authentication completed successfully!',
        })
      );
      navigate('/dashboard', { replace: true });
    } else {
      dispatch(
        addToast({
          type: 'error',
          message: 'OAuth callback did not receive an access token.',
        })
      );
      navigate('/login', { replace: true });
    }
  }, [searchParams, dispatch, navigate]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem',
      }}
    >
      <div className="spinner" style={{ width: '2rem', height: '2rem' }} />
      <h2>Finalizing authentication...</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
        Securing tokens and preparing your workspace.
      </p>
    </div>
  );
};
