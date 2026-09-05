import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Layers,
  LogOut,
  User as UserIcon,
  Shield,
  Menu,
  X,
  Activity,
  ChevronDown,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import { toggleSidebar, addToast } from '../../features/ui/uiSlice';
import { ThemeToggle } from '../common/ThemeToggle';
import { useLogoutMutation } from '../../features/auth/authApi';

export const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [logoutApi] = useLogoutMutation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await logoutApi().unwrap();
    } catch {
      // Proceed with local logout regardless of server response
    }
    dispatch(logout());
    dispatch(
      addToast({
        type: 'info',
        message: 'You have been logged out successfully.',
      })
    );
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        width: '100%',
        backgroundColor: 'var(--navbar-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        transition: 'background-color var(--transition-base), border-color var(--transition-base)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.85rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Brand Logo & Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => dispatch(toggleSidebar())}
              className="btn btn-icon btn-ghost"
              title="Toggle Sidebar"
              style={{ display: 'inline-flex' }}
            >
              <Menu size={20} />
            </button>
          )}

          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontWeight: 700,
              fontSize: 'var(--text-lg)',
              letterSpacing: '-0.02em',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent-cyan) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px -2px hsla(238, 82%, 63%, 0.4)',
              }}
            >
              <Layers size={20} />
            </div>
            <span className="gradient-text" style={{ fontWeight: 800, fontSize: '1.25rem' }}>
              ApexHub
            </span>
          </Link>
        </div>

        {/* Center: Nav links (Desktop) */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '1.5rem',
          }}
          className="desktop-nav"
        >
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: isActive('/dashboard') ? 600 : 500,
                  color: isActive('/dashboard') ? 'var(--color-primary)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: isActive('/profile') ? 600 : 500,
                  color: isActive('/profile') ? 'var(--color-primary)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                Profile
              </Link>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-success">
                <span className="pulse-indicator" style={{ width: '6px', height: '6px' }}></span>
                System Live
              </span>
            </div>
          )}
        </nav>

        {/* Right: Actions, Theme Toggle, Auth Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {isAuthenticated && user ? (
            /* User Profile Pill & Dropdown */
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.35rem 0.65rem 0.35rem 0.35rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  transition: 'border-color var(--transition-fast)',
                }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent-purple) 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 700,
                    }}
                  >
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  {user.username}
                </span>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
              </button>

              {/* User Menu Dropdown */}
              {dropdownOpen && (
                <div
                  className="glass-card"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 0.5rem)',
                    width: '230px',
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 1100,
                  }}
                >
                  <div
                    style={{
                      padding: '0.5rem 0.5rem 0.75rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                      {user.username}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.email}
                    </div>
                    <div style={{ marginTop: '0.35rem' }}>
                      <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>
                        <Shield size={10} /> {user.role || 'user'}
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="btn btn-ghost"
                    style={{
                      justifyContent: 'flex-start',
                      width: '100%',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    <UserIcon size={16} /> My Profile
                  </Link>

                  <Link
                    to="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="btn btn-ghost"
                    style={{
                      justifyContent: 'flex-start',
                      width: '100%',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    <Activity size={16} /> Dashboard
                  </Link>

                  <div
                    style={{
                      height: '1px',
                      backgroundColor: 'var(--border-subtle)',
                      margin: '0.35rem 0',
                    }}
                  />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn btn-ghost"
                    style={{
                      justifyContent: 'flex-start',
                      width: '100%',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-danger)',
                    }}
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Unauthenticated Login & Signup Buttons */
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Link to="/login" className="btn btn-ghost" style={{ fontSize: 'var(--text-sm)' }}>
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
                style={{ fontSize: 'var(--text-sm)' }}
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="btn btn-icon btn-ghost mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: 'none' }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-ghost"
                style={{ justifyContent: 'flex-start' }}
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-ghost"
                style={{ justifyContent: 'flex-start' }}
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="btn btn-ghost"
                style={{ justifyContent: 'flex-start', color: 'var(--color-danger)' }}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-outline"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};
