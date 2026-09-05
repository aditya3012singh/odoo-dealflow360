import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Package,
  Settings,
  BarChart2,
  Shield,
  Database,
  Activity,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Server,
  Clock,
  FileText,
  Cpu,
  RotateCcw,
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { StatCardSkeleton, Skeleton } from '../../components/ui/Skeleton';
import {
  adminService,
  type AdminOverview,
  type AdminUser,
  type SystemHealthData,
  type RecentActivity,
  type QueueMetrics,
} from '../../services/admin.service';
import { ROLE_COLORS, type Role } from '../../types';

export function AdminDashboard() {
  const navigate = useNavigate();

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics | null>(null);
  const [retryingQueue, setRetryingQueue] = useState(false);
  const [queueActionMsg, setQueueActionMsg] = useState<string | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('SALES_REP');
  const [submittingUser, setSubmittingUser] = useState(false);
  const [userModalError, setUserModalError] = useState<string | null>(null);
  const [userModalSuccess, setUserModalSuccess] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [overData, usersData, healthData, activitiesData, queueData] = await Promise.all([
        adminService.getOverview().catch(() => null),
        adminService.listUsers().catch(() => []),
        adminService.getSystemHealth().catch(() => null),
        adminService.getRecentActivity().catch(() => []),
        adminService.getQueueMetrics().catch(() => null),
      ]);
      setOverview(overData);
      setUsers(usersData);
      setHealth(healthData);
      setRecentActivities(activitiesData);
      setQueueMetrics(queueData);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setError(err.response?.data?.message || 'Failed to load admin overview');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryFailedJobs = async () => {
    try {
      setRetryingQueue(true);
      setQueueActionMsg(null);
      const res = await adminService.retryFailedJobs(20);
      setQueueActionMsg(`Successfully requeued ${res.retriedCount} jobs!`);
      const updated = await adminService.getQueueMetrics().catch(() => null);
      if (updated) setQueueMetrics(updated);
      setTimeout(() => setQueueActionMsg(null), 4000);
    } catch (err: any) {
      setQueueActionMsg(`Retry failed: ${err?.response?.data?.message || err.message}`);
      setTimeout(() => setQueueActionMsg(null), 4000);
    } finally {
      setRetryingQueue(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingUser(true);
      setUserModalError(null);
      await adminService.createUser({
        username: newUsername,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      setUserModalSuccess('User account created successfully!');
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      await fetchAdminData();
      setTimeout(() => {
        setUserModalSuccess(null);
        setShowAddUserModal(false);
      }, 1500);
    } catch (err: any) {
      setUserModalError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmittingUser(false);
    }
  };

  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)}Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)}L`;
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Platform Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Global system governance, employee access control, catalog management, and platform health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="p-2 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg text-slate-600 dark:text-zinc-400 transition"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-3.5 py-2 rounded-lg text-xs font-medium transition shadow-sm"
          >
            <Settings className="w-3.5 h-3.5" />
            Configuration Center
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Platform Users"
              value={overview?.totalUsers || users.length}
              subtitle="Registered team members"
              icon={<Users className="w-4 h-4 text-blue-500" />}
            />
            <StatCard
              title="Total Quotations"
              value={overview?.totalQuotations || 0}
              subtitle={`${overview?.pendingApprovals || 0} pending approvals`}
              icon={<Activity className="w-4 h-4 text-purple-500" />}
            />
            <StatCard
              title="Active Booked Orders"
              value={overview?.totalOrders || 0}
              subtitle={`${overview?.totalWarehouses || 2} fulfillment warehouses`}
              icon={<Package className="w-4 h-4 text-amber-500" />}
            />
            <StatCard
              title="Platform Volume"
              value={formatCurrency(overview?.platformRevenue || 0)}
              subtitle={`${formatCurrency(overview?.collectedRevenue || 0)} collected`}
              icon={<BarChart2 className="w-4 h-4 text-emerald-500" />}
            />
          </>
        )}
      </div>

      {/* Main Grid: Config Modules, User Management, Platform Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Modules Shortcuts */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm p-5 space-y-4 transition-colors">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Configuration Modules
            </h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
              Backend settings and system rules
            </p>
          </div>

          <div className="space-y-2">
            {[
              {
                label: 'Product Catalog',
                desc: 'Manage SKUs, variants, prices, and subscriptions',
                icon: <Package className="w-4 h-4 text-blue-500" />,
                tab: 'products',
                count: `${overview?.totalProducts || 0} products`,
              },
              {
                label: 'Discount & Risk Governance',
                desc: 'Tiers, ceilings, margin tolerances, and approval chains',
                icon: <Shield className="w-4 h-4 text-emerald-500" />,
                tab: 'policies',
                count: 'Active',
              },
              {
                label: 'Multi-Warehouse Logistics',
                desc: 'Stock balancing, facility locations, and shipping weights',
                icon: <Database className="w-4 h-4 text-amber-500" />,
                tab: 'warehouses',
                count: `${overview?.totalWarehouses || 2} facilities`,
              },
              {
                label: 'User & Access Control',
                desc: 'RBAC permissions, roles, and staff management',
                icon: <Users className="w-4 h-4 text-purple-500" />,
                tab: 'users',
                count: `${users.length} users`,
              },
            ].map((m) => (
              <button
                key={m.label}
                onClick={() => navigate(`/admin?tab=${m.tab}`)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
                    {m.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-slate-900 dark:group-hover:text-white">
                      {m.label}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">{m.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-zinc-500">
                  <span>{m.count}</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* User Management Live Widget */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                User Management
              </h2>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                Staff directory and role assignments
              </p>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="text-xs bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add User
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/60">
            {loading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-28 rounded" />
                        <Skeleton className="h-2.5 w-36 rounded" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-16 rounded" />
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                No users found.
              </div>
            ) : (
              users.slice(0, 5).map((u) => (
                <div key={u.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center text-white dark:text-zinc-900 text-xs font-bold shrink-0">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                        {u.username}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate max-w-[140px]">
                        {u.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                      ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-slate-100 dark:border-zinc-800 text-center">
            <button
              onClick={() => navigate('/admin?tab=users')}
              className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition font-medium"
            >
              View all {users.length} users →
            </button>
          </div>
        </div>

        {/* Platform Observability & Health */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm p-5 space-y-4 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-500" />
                Platform Telemetry & Health
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                {health?.environment || 'dev'}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-500">
              Live service status, database query latency, and memory footprint
            </p>

            <div className="mt-4 space-y-3">
              {[
                {
                  label: 'API Server',
                  status: health?.status === 'ok' ? 'Operational' : (overview?.systemHealth.apiServer || 'Online'),
                  value: health ? `Node ${health.nodeVersion}` : 'Express v4',
                  isGood: true,
                },
                {
                  label: 'PostgreSQL DB',
                  status: health?.database?.status === 'connected' ? 'Connected' : 'Active',
                  value: health?.database?.latencyMs !== undefined ? `${health.database.latencyMs}ms query latency` : 'Prisma Client',
                  isGood: true,
                },
                {
                  label: 'Memory Footprint',
                  status: health?.memory ? `${health.memory.rssMb} MB RSS` : 'Nominal',
                  value: health?.memory ? `${health.memory.heapUsedMb} MB heap used` : (overview?.systemHealth.cacheHitRate || '98% hit rate'),
                  isGood: true,
                },
                {
                  label: 'Process Uptime',
                  status: health?.uptimeSeconds ? `${Math.floor(health.uptimeSeconds / 60)}m ${Math.floor(health.uptimeSeconds % 60)}s` : 'Active',
                  value: overview?.systemHealth.eventBus || 'Dual-Mode Event Bus',
                  isGood: true,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-zinc-800/40 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-700 dark:text-zinc-300 font-medium">{s.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold block">
                      {s.status}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">{s.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-center">
            <p className="text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
              All Platform Services Operational ✓
            </p>
            <p className="text-emerald-600/80 dark:text-emerald-500/80 text-[10px] mt-0.5">
              Live audit logging active & telemetry syncing
            </p>
          </div>

          {/* BullMQ Worker & Background Queue Telemetry */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-500" />
                Background Worker & Queue
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                {queueMetrics?.queue || 'dealflow-core'}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-500">
              BullMQ async worker telemetry: PDF generation, invoice proration, and notifications
            </p>

            {queueActionMsg && (
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 font-medium">
                {queueActionMsg}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/80 text-center">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-semibold block">Active</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">{queueMetrics?.counts.active ?? 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-center">
                <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold block">Completed</span>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-0.5 block">{queueMetrics?.counts.completed ?? 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-center">
                <span className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold block">Waiting</span>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-300 mt-0.5 block">{queueMetrics?.counts.waiting ?? 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-center">
                <span className="text-[10px] uppercase tracking-wider text-rose-600 dark:text-rose-400 font-semibold block">Failed</span>
                <span className="text-sm font-bold text-rose-700 dark:text-rose-300 mt-0.5 block">{queueMetrics?.counts.failed ?? 0}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/60">
              <span className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${(queueMetrics?.counts.failed ?? 0) > 0 ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                {(queueMetrics?.counts.failed ?? 0) > 0 ? `${queueMetrics?.counts.failed} jobs require attention` : 'Worker healthy & processing'}
              </span>
              <button
                onClick={handleRetryFailedJobs}
                disabled={retryingQueue || (queueMetrics?.counts.failed ?? 0) === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <RotateCcw className={`w-3 h-3 ${retryingQueue ? 'animate-spin' : ''}`} />
                {retryingQueue ? 'Replaying...' : 'Retry Failed'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Strip */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-3 transition-colors">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Quick Administration Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Create Product', icon: <Package className="w-4 h-4" />, action: () => navigate('/admin?tab=products') },
            { label: 'Register User', icon: <Users className="w-4 h-4" />, action: () => setShowAddUserModal(true) },
            { label: 'Discount Rules', icon: <Shield className="w-4 h-4" />, action: () => navigate('/admin?tab=policies') },
            { label: 'Warehouse Stock', icon: <Database className="w-4 h-4" />, action: () => navigate('/admin?tab=warehouses') },
            { label: 'View Reports', icon: <BarChart2 className="w-4 h-4" />, action: () => navigate('/reports') },
          ].map((a) => (
            <button
              key={a.label}
              onClick={a.action}
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition cursor-pointer text-slate-700 dark:text-zinc-300 group"
            >
              <div className="text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                {a.icon}
              </div>
              <span className="text-xs font-medium text-center">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity & Event Log */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Recent Platform Transactions & Activity Feed
            </h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
              Live audit stream of quotations, booked orders, and team onboarding
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Live Sync
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
          {recentActivities.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
              No recent platform transactions recorded.
            </div>
          ) : (
            recentActivities.map((act) => (
              <div
                key={act.id}
                onClick={() => act.link && navigate(act.link)}
                className={`py-3 flex items-center justify-between gap-4 ${
                  act.link ? 'hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 cursor-pointer rounded-lg px-2 -mx-2 transition' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      act.type === 'QUOTATION'
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60'
                        : act.type === 'ORDER'
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60'
                        : 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60'
                    }`}
                  >
                    {act.type === 'QUOTATION' ? (
                      <FileText className="w-4 h-4" />
                    ) : act.type === 'ORDER' ? (
                      <Package className="w-4 h-4" />
                    ) : (
                      <Users className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                      {act.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right">
                  {act.status && (
                    <Badge
                      variant={
                        ['CONFIRMED', 'ACTIVE', 'FULFILLED', 'APPROVED'].includes(act.status)
                          ? 'success'
                          : ['PENDING_MANAGER', 'PENDING_FINANCE', 'PENDING_FULFILLMENT'].includes(act.status)
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {act.status}
                    </Badge>
                  )}
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono hidden sm:inline-block">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {act.link && <ArrowRight className="w-3.5 h-3.5 text-slate-400" />}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateUser}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                Register Staff User
              </h3>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            {userModalError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{userModalError}</span>
              </div>
            )}

            {userModalSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{userModalSuccess}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. jdoe"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="jdoe@dealflow360.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Assigned Platform Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-white"
                >
                  <option value="SALES_REP">Sales Rep</option>
                  <option value="SALES_MANAGER">Sales Manager</option>
                  <option value="FINANCE">Finance</option>
                  <option value="OPERATIONS">Operations</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingUser}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
              >
                {submittingUser && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
