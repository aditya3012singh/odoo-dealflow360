import { useState } from 'react';
import {
  User as UserIcon,
  Shield,
  Key,
  Mail,
  Building,
  Clock,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Save,
  Check,
  Smartphone,
  Globe,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { authService } from '../../services/auth.service';
import { Badge } from '../../components/ui/Badge';
import { ROLE_COLORS, ROLE_LABELS, type Role } from '../../types';

export function UserProfilePage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);

  // Profile edit state
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileError(null);
      setProfileSuccess(null);
      await authService.updateProfile({ username, email });
      setProfileSuccess('Profile details updated successfully!');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    try {
      setChangingPassword(true);
      setPasswordError(null);
      setPasswordSuccess(null);
      await authService.changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password successfully changed!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      setPasswordError(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const userRole = (currentUser?.role as Role) || 'ADMIN';

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Account Profile & Credentials
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Manage your personal identity, employee workspace privileges, and access credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success">Active Session</Badge>
          <span className="text-xs font-mono text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
            JWT 7-Day Lifespan
          </span>
        </div>
      </div>

      {/* Hero Profile Card */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 transition-colors">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 dark:from-zinc-800 dark:to-zinc-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
            {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {currentUser?.username || 'Administrator'}
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold inline-block ${
                ROLE_COLORS[userRole]
              }`}
            >
              {ROLE_LABELS[userRole]}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
            <Mail className="w-3.5 h-3.5" />
            {currentUser?.email}
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-[11px] text-slate-400 dark:text-zinc-500">
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5" />
              Sales Operations HQ
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Enterprise RBAC Guarded
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Role: {userRole}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details Form */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5 transition-colors">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-blue-500" />
              Personal Information
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Update your workspace display handle and registered email address.
            </p>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                Username / Display Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                Assigned Platform Role
              </label>
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400">
                <span className="font-semibold text-slate-700 dark:text-zinc-300">
                  {ROLE_LABELS[userRole]} ({userRole})
                </span>
                <span className="text-[10px] text-slate-400">Managed by System Policy</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-medium transition shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {savingProfile ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5 transition-colors">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              Security & Credentials
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Update your workspace password with bcrypt 12-round hashing.
            </p>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition"
                required
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-medium transition shadow-sm disabled:opacity-50"
              >
                <Key className="w-3.5 h-3.5" />
                {changingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Active Session & Security Cards */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4 transition-colors">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          Active Session & Governance Health
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-1">
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium block">Token Lifespan</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white">7 Days (168 Hours)</p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Auto-refreshed via JWT header</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-1">
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium block">Authentication Protocol</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Bearer HS256 JWT</p>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500">Separated Customer Portal Tokens</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-1">
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium block">Security Audit Status</span>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Compliant ✓</p>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500">Every mutation recorded in AuditLog</span>
          </div>
        </div>
      </div>
    </div>
  );
}
