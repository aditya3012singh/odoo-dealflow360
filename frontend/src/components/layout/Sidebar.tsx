import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Package,
  CreditCard,
  AlertTriangle,
  Settings,
  Users,
  BarChart2,
  ShoppingCart,
  Sliders,
  X,
  UserCheck,
} from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import type { Role } from '../../types';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  roles: Role[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard',    to: '/dashboard',   icon: <LayoutDashboard className="w-4 h-4" />, roles: ['ADMIN','SALES_REP','SALES_MANAGER','FINANCE','OPERATIONS','CUSTOMER_SUPPORT','VIEWER'] },
  { label: 'Quotations',   to: '/quotations',  icon: <FileText className="w-4 h-4" />,        roles: ['ADMIN','SALES_REP','SALES_MANAGER','FINANCE','OPERATIONS'] },
  { label: 'Approvals',    to: '/approvals',   icon: <CheckSquare className="w-4 h-4" />,     roles: ['ADMIN','SALES_MANAGER','FINANCE'] },
  { label: 'Fulfillment',  to: '/fulfillment', icon: <Package className="w-4 h-4" />,         roles: ['ADMIN','OPERATIONS','SALES_REP','SALES_MANAGER'] },
  { label: 'Billing',      to: '/billing',     icon: <CreditCard className="w-4 h-4" />,      roles: ['ADMIN','FINANCE'] },
  { label: 'Orders',       to: '/orders',      icon: <ShoppingCart className="w-4 h-4" />,    roles: ['ADMIN','SALES_REP','SALES_MANAGER','OPERATIONS'] },
  { label: 'Deal Health',  to: '/deal-health', icon: <AlertTriangle className="w-4 h-4" />,   roles: ['ADMIN','SALES_MANAGER'] },
  { label: 'Reports',      to: '/reports',     icon: <BarChart2 className="w-4 h-4" />,       roles: ['ADMIN','SALES_MANAGER','FINANCE'] },
  { label: 'Customers',    to: '/customers',   icon: <Users className="w-4 h-4" />,           roles: ['ADMIN','SALES_REP','SALES_MANAGER'] },
  { label: 'Admin Config', to: '/admin',       icon: <Settings className="w-4 h-4" />,        roles: ['ADMIN'] },
  { label: 'Settings',     to: '/settings',    icon: <Sliders className="w-4 h-4" />,         roles: ['ADMIN'] },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const user = useAppSelector((state) => state.auth.user);
  const userRole = user?.role as Role;
  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-56 bg-white dark:bg-black border-r border-slate-200 dark:border-zinc-800 flex flex-col shrink-0 h-screen transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo and Mobile Close */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center">
            <div className="w-7 h-7 rounded-lg bg-black dark:bg-white flex items-center justify-center mr-2 text-white dark:text-black font-bold text-[10px] shrink-0 shadow-sm">
              DF
            </div>
            <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">DealFlow360</span>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 transition"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-sm font-semibold'
                    : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-100'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom User Card */}
        <div className="border-t border-slate-200 dark:border-zinc-800 px-4 py-3 bg-slate-50/50 dark:bg-zinc-950/40">
          <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-zinc-500">Active Account</p>
          <p className="text-xs font-medium text-slate-700 dark:text-zinc-300 truncate mt-0.5">{user?.email}</p>
        </div>
      </aside>
    </>
  );
}
