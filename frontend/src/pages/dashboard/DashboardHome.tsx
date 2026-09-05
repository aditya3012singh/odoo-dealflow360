import { useAppSelector } from '../../store/hooks';
import { SalesRepDashboard } from './SalesRepDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { FinanceDashboard } from './FinanceDashboard';
import { AdminDashboard } from './AdminDashboard';
import type { Role } from '../../types';

export function DashboardHome() {
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role as Role;

  switch (role) {
    case 'SALES_REP':
    case 'CUSTOMER_SUPPORT':
      return <SalesRepDashboard />;
    case 'SALES_MANAGER':
      return <ManagerDashboard />;
    case 'FINANCE':
      return <FinanceDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      return (
        <div className="flex items-center justify-center h-64 text-slate-400 dark:text-zinc-500">
          <div className="text-center">
            <p className="text-3xl mb-2">👤</p>
            <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">No dashboard configured for your role: {role}</p>
          </div>
        </div>
      );
  }
}
