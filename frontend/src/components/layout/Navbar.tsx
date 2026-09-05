import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Bell,
  Settings,
  LogOut,
  User as UserIcon,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  Shield,
  Sliders,
  X,
  FileText,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { ROLE_LABELS, ROLE_COLORS, type Role } from '../../types';
import { ThemeToggle } from '../common/ThemeToggle';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'danger' | 'warning' | 'success' | 'info';
  link: string;
  read: boolean;
}

const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'High Risk Escalation',
    message: 'Quotation Q-2026-0015 flagged with BRS 74 (requires Level 2 Finance approval)',
    timestamp: '12m ago',
    type: 'danger',
    link: '/approvals',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Low Stock Alert',
    message: 'MacBook Pro M3 Max in Main Warehouse below 5 units threshold',
    timestamp: '45m ago',
    type: 'warning',
    link: '/admin?tab=warehouses',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Fulfillment Split Dispatched',
    message: 'Order #ORD-1082 auto-split across Main & East facilities',
    timestamp: '2h ago',
    type: 'success',
    link: '/fulfillment',
    read: false,
  },
  {
    id: 'notif-4',
    title: 'New Portal Session',
    message: 'Acme Global procurement team logged into negotiation portal',
    timestamp: '3h ago',
    type: 'info',
    link: '/customers',
    read: true,
  },
];

export function Navbar({ onToggleMobileMenu }: NavbarProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const userRole = (user?.role as Role) || 'VIEWER';

  // Dropdown states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setShowNotifications(false);
    navigate(item.link);
  };

  // Derive breadcrumb from current path
  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/quotations/new')) return 'New Deal Builder';
    if (path.startsWith('/quotations/')) return 'Quotation Details';
    if (path.startsWith('/quotations')) return 'Quotations Pipeline';
    if (path.startsWith('/approvals')) return 'Approval Queue';
    if (path.startsWith('/fulfillment')) return 'Fulfillment & Dispatch';
    if (path.startsWith('/billing')) return 'Invoicing & Subscriptions';
    if (path.startsWith('/orders')) return 'Orders Matrix';
    if (path.startsWith('/deal-health')) return 'Deal Health & Margins';
    if (path.startsWith('/reports')) return 'Reports & Analytics';
    if (path.startsWith('/customers')) return 'Customer Directory';
    if (path.startsWith('/admin')) return 'Admin Configuration Suite';
    if (path.startsWith('/settings')) return 'System Settings';
    if (path.startsWith('/profile')) return 'My Account Profile';
    return 'Operations Console';
  };

  return (
    <header className="h-14 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-4 sm:px-6 shrink-0 z-30 transition-colors duration-200">
      {/* Left: Mobile hamburger & Dynamic breadcrumbs */}
      <div className="flex items-center gap-2.5">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 transition"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs sm:text-sm">
          <Link
            to="/dashboard"
            className="font-bold tracking-tight text-slate-900 dark:text-white hover:opacity-80 transition"
          >
            DealFlow360
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-700 shrink-0" />
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 truncate max-w-[140px] sm:max-w-xs">
            {getBreadcrumbTitle()}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notification Bell & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 hover:text-slate-800 dark:hover:text-zinc-200 transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse ring-2 ring-white dark:ring-black" />
            )}
          </button>

          {/* Floating Notification Box */}
          {showNotifications && (
            <div className="absolute right-0 sm:right-auto sm:-left-32 md:-left-48 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="p-3.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-950/40">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Notifications
                  </span>
                  {unreadCount > 0 ? (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                      {unreadCount} unread
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-500">
                      All caught up
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No new notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 text-xs flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition cursor-pointer ${
                        !n.read ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          n.type === 'danger'
                            ? 'bg-rose-500'
                            : n.type === 'warning'
                            ? 'bg-amber-500'
                            : n.type === 'success'
                            ? 'bg-emerald-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <p className={`font-semibold text-xs truncate ${!n.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-zinc-400'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-slate-50/75 dark:bg-zinc-950/60 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                <Link
                  to="/admin?tab=audit"
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-medium flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  View Audit Trail
                </Link>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings Quick Icon */}
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 hover:text-slate-800 dark:hover:text-zinc-200 transition"
          title="System Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Pill & Interactive Profile Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu((prev) => !prev)}
            className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 rounded-xl px-2.5 py-1.5 transition-all text-left"
          >
            <div className="w-6 h-6 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm text-white dark:text-black font-bold text-[10px]">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 leading-none truncate max-w-[100px]">
                {user?.username?.split('(')[0]?.trim() || user?.email?.split('@')[0]}
              </p>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-medium inline-block mt-0.5 ${
                  ROLE_COLORS[userRole]
                }`}
              >
                {ROLE_LABELS[userRole]}
              </span>
            </div>
          </button>

          {/* Floating User Menu Box */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              {/* Profile Overview */}
              <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-zinc-800/80">
                <p className="font-bold text-slate-900 dark:text-white truncate">
                  {user?.username || 'Administrator'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                  {user?.email}
                </p>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium inline-block mt-1.5 ${
                    ROLE_COLORS[userRole]
                  }`}
                >
                  {ROLE_LABELS[userRole]} Privilege
                </span>
              </div>

              {/* Navigation Actions */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/profile');
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2.5 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition text-left"
                >
                  <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                  My Account Profile
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2.5 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition text-left"
                >
                  <Sliders className="w-3.5 h-3.5 text-purple-500" />
                  Platform System Settings
                </button>

                {userRole === 'ADMIN' && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/admin');
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition text-left"
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    Admin Configuration Suite
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    dispatch(logout());
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-left font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
