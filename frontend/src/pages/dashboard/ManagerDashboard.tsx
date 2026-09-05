import { CheckSquare, Clock, Users, TrendingUp, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { useAppSelector } from '../../store/hooks';

const pendingApprovals = [
  { id: 'APP-001', quote: 'Q-2026-0014', rep: 'Sarah Jenkins', customer: 'Beta Technologies',  amount: '₹88,200',   riskScore: 8.5,  discount: '12%', time: '2h ago' },
  { id: 'APP-002', quote: 'Q-2026-0013', rep: 'David Kim',     customer: 'Nexus Solutions',    amount: '₹2,10,000', riskScore: 14.3, discount: '17%', time: '5h ago' },
  { id: 'APP-003', quote: 'Q-2026-0010', rep: 'Priya Shah',    customer: 'Global Ventures',    amount: '₹75,000',   riskScore: 9.8,  discount: '15%', time: '1d ago' },
];

const dealAlerts = [
  { id: 1, type: 'STALLED',          quote: 'Q-2026-0008', customer: 'TechNova Ltd',  days: 9,    severity: 'HIGH'   },
  { id: 2, type: 'DISCOUNT_ANOMALY', quote: 'Q-2026-0007', customer: 'Rapid Systems', discount: '22%', severity: 'MEDIUM' },
  { id: 3, type: 'LOW_MARGIN',       quote: 'Q-2026-0006', customer: 'Alpha Corp',    margin: '8%',    severity: 'HIGH'   },
];

const severityVariant: Record<string, any> = { HIGH: 'danger', MEDIUM: 'warning', LOW: 'info' };

export function ManagerDashboard() {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Manager Dashboard — {user?.username?.split('(')[0]?.trim()}
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Approval queue and team performance overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Pending Approvals" value="8"      subtitle="Requires action"     icon={<CheckSquare className="w-4 h-4" />} />
        <StatCard title="Team Quotations"   value="45"     subtitle="This month"          icon={<Clock className="w-4 h-4" />}       />
        <StatCard title="Active Reps"       value="6"      subtitle="In your team"        icon={<Users className="w-4 h-4" />}       />
        <StatCard title="Team Revenue"      value="₹82.4L" subtitle="+18% vs last month" icon={<TrendingUp className="w-4 h-4" />}  />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Approval queue */}
        <div className="col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Pending Approvals</h2>
            <Badge variant="warning">{pendingApprovals.length} waiting</Badge>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-zinc-800/60">
            {pendingApprovals.map((a) => (
              <div key={a.id} className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-slate-500 dark:text-zinc-400 text-xs">{a.quote}</span>
                      <span className="text-slate-200 dark:text-zinc-700">•</span>
                      <span className="text-xs text-slate-400 dark:text-zinc-500">{a.rep}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">{a.customer}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 dark:text-zinc-500">
                      <span>Amount: <b className="text-slate-700 dark:text-zinc-300">{a.amount}</b></span>
                      <span>Discount: <b className="text-amber-600 dark:text-amber-400">{a.discount}</b></span>
                      <span>Risk: <b className={a.riskScore > 10 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>{a.riskScore}</b></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button className="flex items-center gap-1 border border-rose-200 dark:border-rose-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-2">{a.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Deal health alerts */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Deal Alerts</h2>
            <button className="text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 flex items-center gap-1 transition">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {dealAlerts.map((a) => (
              <div
                key={a.id}
                className={`p-3 rounded-lg border transition-colors ${
                  a.severity === 'HIGH'
                    ? 'border-rose-100 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20'
                    : 'border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge variant={severityVariant[a.severity]}>{a.severity}</Badge>
                  <span className="font-mono text-[11px] text-slate-400 dark:text-zinc-500">{a.quote}</span>
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-zinc-200">{a.customer}</p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                  {a.type === 'STALLED'          && `Inactive for ${a.days} days`}
                  {a.type === 'DISCOUNT_ANOMALY' && `Discount ${(a as any).discount} is above average`}
                  {a.type === 'LOW_MARGIN'       && `Margin ${(a as any).margin} below threshold`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
