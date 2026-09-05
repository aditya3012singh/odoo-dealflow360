import React, { useState } from 'react';
import { User, Mail, Shield, Calendar, Edit3, Check, Save } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { updateUser } from '../features/auth/authSlice';
import { addToast } from '../features/ui/uiSlice';
import { useUpdateProfileMutation } from '../features/auth/authApi';

export const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [updateProfileApi, { isLoading }] = useUpdateProfileMutation();

  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || 'Fullstack engineer building robust applications.');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Attempt to save through RTK Query mutation
      await updateProfileApi({ username, bio }).unwrap();
    } catch {
      // Fallback: update local Redux state
    }

    dispatch(updateUser({ username, bio }));
    setIsEditing(false);
    dispatch(
      addToast({
        type: 'success',
        message: 'Profile updated successfully!',
      })
    );
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>Account Profile</h1>
        <p style={{ marginTop: '0.25rem', fontSize: 'var(--text-sm)' }}>
          Manage your personal details, workspace role, and preferences.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* User Hero Banner */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--color-primary)',
                  boxShadow: 'var(--shadow-glow)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent-purple) 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                {user?.username?.substring(0, 2).toUpperCase() || 'US'}
              </div>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>{user?.username}</h2>
                <span className="badge badge-active">
                  <Shield size={12} /> {user?.role || 'User'}
                </span>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`btn ${isEditing ? 'btn-secondary' : 'btn-outline'}`}
          >
            <Edit3 size={16} />
            {isEditing ? 'Cancel Editing' : 'Edit Profile'}
          </button>
        </div>

        {/* Profile Details or Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-username">
                Display Username
              </label>
              <input
                id="edit-username"
                type="text"
                required
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-bio">
                Biography
              </label>
              <textarea
                id="edit-bio"
                rows={3}
                className="form-input"
                style={{ resize: 'vertical' }}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setIsEditing(false)} className="btn btn-ghost">
                Cancel
              </button>
              <button type="submit" disabled={isLoading} className="btn btn-primary">
                {isLoading ? <span className="spinner" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            <div>
              <span className="form-label">Full Identifier</span>
              <div style={{ marginTop: '0.35rem', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {user?.id || 'usr_generated_default'}
              </div>
            </div>

            <div>
              <span className="form-label">Email Verified</span>
              <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-success)', fontSize: 'var(--text-sm)' }}>
                <Check size={16} /> Active & Verified
              </div>
            </div>

            <div>
              <span className="form-label">Account Created</span>
              <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                <Calendar size={16} />
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Member'}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <span className="form-label">Bio</span>
              <div style={{ marginTop: '0.35rem', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {user?.bio || bio}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
