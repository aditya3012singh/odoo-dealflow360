import { Bell, Settings, LogOut, User as UserIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { ROLE_LABELS, ROLE_COLORS, type Role } from '../../types';
import { ThemeToggle } from '../common/ThemeToggle';

export function Navbar() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  return (
    <header className="h-14 bg-white dark:bg-black border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0 transition-colors duration-200">
      {/* Left: breadcrumb / title */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">DealFlow360</span>
        <span className="text-slate-300 dark:text-zinc-700">|</span>
        <span className="text-xs text-slate-400 dark:text-zinc-500">Sales Operations Platform</span>
      </div>

      {/* Right: user actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notification bell */}
        <button className="relative p-2 rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-900 hover:text-slate-700 dark:hover:text-zinc-200 transition">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </button>

        {/* Settings */}
        <button className="p-2 rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-900 hover:text-slate-700 dark:hover:text-zinc-200 transition">
          <Settings className="w-4 h-4" />
        </button>

        {/* User pill */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 transition-colors">
          <div className="w-6 h-6 bg-black dark:bg-white rounded-full flex items-center justify-center shrink-0">
            <UserIcon className="w-3.5 h-3.5 text-white dark:text-black" />
          </div>
          <div className="leading-tight">
            <p className="text-xs font-medium text-slate-800 dark:text-zinc-200 leading-none">
              {user?.username?.split('(')[0]?.trim() || user?.email}
            </p>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                ROLE_COLORS[(user?.role as Role) ?? 'VIEWER']
              }`}
            >
              {ROLE_LABELS[(user?.role as Role) ?? 'VIEWER']}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => dispatch(logout())}
          className="p-2 rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 transition"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
