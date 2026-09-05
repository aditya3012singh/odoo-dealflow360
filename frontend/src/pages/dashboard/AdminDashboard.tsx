import { Users, Package, Settings, BarChart2, Shield, Database, Activity } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';

const systemStats = [
  { label: 'Total Users',      value: '24',     change: '+3 this week'          },
  { label: 'Total Quotations', value: '187',    change: '+12 today'             },
  { label: 'Active Orders',    value: '43',     change: '8 pending fulfillment' },
  { label: 'Platform Revenue', value: '₹3.4Cr', change: '+22% this month'       },
];

const recentUsers = [
  { name: 'Sarah Jenkins',  email: 'rep@dealflow360.com',     role: 'SALES_REP'     },
  { name: 'Marcus Vance',   email: 'manager@dealflow360.com', role: 'SALES_MANAGER' },
  { name: 'Fiona Sterling', email: 'finance@dealflow360.com', role: 'FINANCE'       },
];

const roleColors: Record<string, any> = {
  ADMIN: 'danger', SALES_REP: 'info', SALES_MANAGER: 'purple', FINANCE: 'success', OPERATIONS: 'warning',
};

const configModules = [
  { label: 'Product Catalog',    desc: 'Manage products, variants, pricing', icon: <Package className="w-4 h-4" />,  count: '42 products'  },
  { label: 'Discount Policies',  desc: 'Tiers, ceilings, approval chains',  icon: <Shield className="w-4 h-4" />,   count: '6 policies'   },
  { label: 'Warehouses',         desc: 'Stock levels, locations, weights',   icon: <Database className="w-4 h-4" />, count: '2 warehouses' },
  { label: 'Subscription Plans', desc: 'Recurring billing intervals',        icon: <Settings className="w-4 h-4" />, count: '3 plans'      },
];

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Platform-wide overview and configuration</p>
        </div>
        <Badge variant="danger">ADMIN</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {systemStats.map((s) => (
          <StatCard key={s.label} title={s.label} value={s.value} subtitle={s.change} icon={<Activity className="w-4 h-4" />} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Config modules */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Configuration Modules</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Backend setup & management</p>
          </div>
          <div className="p-4 space-y-1.5">
            {configModules.map((m) => (
              <button
                key={m.label}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 transition text-left cursor-pointer"
              >
                <div className="w-8 h-8 bg-slate-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center text-slate-600 dark:text-zinc-400 shrink-0">
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-zinc-200">{m.label}</p>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">{m.desc}</p>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 shrink-0">{m.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User management */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">User Management</h2>
            <button className="text-xs bg-slate-900 dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-lg font-medium hover:bg-black dark:hover:bg-zinc-200 transition cursor-pointer">
              + Add User
            </button>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-zinc-800/60">
            {recentUsers.map((u) => (
              <div key={u.email} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black text-xs font-bold shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-800 dark:text-zinc-200">{u.name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">{u.email}</p>
                  </div>
                </div>
                <Badge variant={roleColors[u.role] ?? 'default'}>{u.role.replace('_', ' ')}</Badge>
              </div>
            ))}
            <div className="px-5 py-3 text-center">
              <button className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
                View all 24 users →
              </button>
            </div>
          </div>
        </div>

        {/* Platform health */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Platform Health</h2>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: 'API Server',    status: 'Online',    value: '45ms avg',     ok: true },
              { label: 'PostgreSQL DB', status: 'Connected', value: 'Neon Cloud',   ok: true },
              { label: 'Redis Cache',   status: 'Running',   value: '98% hit rate', ok: true },
              { label: 'Event Bus',     status: 'Active',    value: 'Dual mode',    ok: true },
              { label: 'Socket.IO',     status: 'Connected', value: '3 clients',    ok: true },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${s.ok ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span className="text-xs text-slate-700 dark:text-zinc-300">{s.label}</span>
                </div>
                <div className="text-right">
                  <p className={`text-[11px] font-medium ${s.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{s.status}</p>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg p-3 text-center">
              <p className="text-emerald-700 dark:text-emerald-400 font-medium text-xs">All Systems Operational ✓</p>
              <p className="text-emerald-500 dark:text-emerald-600 text-[11px] mt-0.5">Last checked: just now</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 transition-colors">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Add Product',    icon: <Package className="w-4 h-4" /> },
            { label: 'Create User',    icon: <Users className="w-4 h-4" />   },
            { label: 'View Reports',   icon: <BarChart2 className="w-4 h-4" /> },
            { label: 'Discount Rules', icon: <Shield className="w-4 h-4" /> },
            { label: 'Manage Plans',   icon: <Settings className="w-4 h-4" /> },
          ].map((a) => (
            <button
              key={a.label}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-900 transition cursor-pointer"
            >
              <div className="text-slate-600 dark:text-zinc-400">{a.icon}</div>
              <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
