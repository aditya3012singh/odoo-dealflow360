import { FileText, Clock, TrendingUp, CheckCircle, PlusCircle, ArrowRight } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { useAppSelector } from '../../store/hooks';

const dummyQuotations = [
  { id: 'Q-2026-0015', customer: 'Acme Global Industries',  amount: '₹14,51,400', status: 'APPROVED',           date: 'Sep 2, 2026' },
  { id: 'Q-2026-0014', customer: 'Beta Technologies Corp',  amount: '₹88,200',    status: 'PENDING_MANAGER',    date: 'Sep 1, 2026' },
  { id: 'Q-2026-0013', customer: 'Nexus Solutions Ltd',     amount: '₹2,10,000',  status: 'DRAFT',              date: 'Aug 31, 2026' },
  { id: 'Q-2026-0012', customer: 'Pinnacle Corp',           amount: '₹4,60,000',  status: 'CONVERTED_TO_ORDER', date: 'Aug 30, 2026' },
  { id: 'Q-2026-0011', customer: 'Global Ventures Inc',     amount: '₹75,000',    status: 'REJECTED',           date: 'Aug 29, 2026' },
];

const statusBadge: Record<string, { label: string; variant: any }> = {
  DRAFT:              { label: 'Draft',            variant: 'default' },
  PENDING_MANAGER:    { label: 'Pending Approval', variant: 'warning' },
  PENDING_FINANCE:    { label: 'Pending Finance',  variant: 'purple'  },
  APPROVED:           { label: 'Approved',         variant: 'success' },
  REJECTED:           { label: 'Rejected',         variant: 'danger'  },
  CONVERTED_TO_ORDER: { label: 'Converted',        variant: 'info'    },
};

const dummyRecs = [
  { name: 'Thunderbolt 4 Triple-Display Dock', type: 'CROSS_SELL', marginDelta: 5000, promoted: true  },
  { name: '24/7 Dedicated Cloud SLA',          type: 'UPSELL',     marginDelta: 3200, promoted: false },
  { name: 'Extended Hardware Warranty',        type: 'UPSELL',     marginDelta: 1800, promoted: true  },
];

export function SalesRepDashboard() {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Hello, {user?.username?.split('(')[0]?.trim() ?? 'Sales Rep'} 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Here's your sales activity for today</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-zinc-200 text-white dark:text-black px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer">
          <PlusCircle className="w-3.5 h-3.5" />
          New Quotation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Active Quotations"    value="12"     subtitle="3 expiring soon"      icon={<FileText className="w-4 h-4" />}    />
        <StatCard title="Pending Approval"     value="5"      subtitle="Awaiting manager"      icon={<Clock className="w-4 h-4" />}       />
        <StatCard title="This Month's Revenue" value="₹24.2L" subtitle="+12% vs last month"   icon={<TrendingUp className="w-4 h-4" />}  />
        <StatCard title="Orders Closed"        value="8"      subtitle="This month"            icon={<CheckCircle className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Quotation table */}
        <div className="col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Recent Quotations</h2>
            <button className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-zinc-900 text-[11px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Quote #</th>
                <th className="px-5 py-3 text-left font-medium">Customer</th>
                <th className="px-5 py-3 text-left font-medium">Amount</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/60">
              {dummyQuotations.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition cursor-pointer">
                  <td className="px-5 py-3 font-mono text-slate-600 dark:text-zinc-400 text-xs">{q.id}</td>
                  <td className="px-5 py-3 text-slate-700 dark:text-zinc-300 text-xs">{q.customer}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-zinc-100 text-xs">{q.amount}</td>
                  <td className="px-5 py-3">
                    <Badge variant={statusBadge[q.status]?.variant ?? 'default'}>
                      {statusBadge[q.status]?.label ?? q.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-400 dark:text-zinc-500 text-xs">{q.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Upsell panel */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">AI Recommendations</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Top margin-optimizing suggestions</p>
          </div>
          <div className="p-4 space-y-3">
            {dummyRecs.map((r) => (
              <div key={r.name} className="p-3 border border-slate-100 dark:border-zinc-800 rounded-lg hover:border-slate-300 dark:hover:border-zinc-700 transition">
                <div className="flex items-center justify-between mb-1.5">
                  <Badge variant={r.type === 'UPSELL' ? 'purple' : 'info'}>{r.type}</Badge>
                  {r.promoted && <Badge variant="warning">🔥 Promo</Badge>}
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-zinc-100 mt-1">{r.name}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">+₹{r.marginDelta.toLocaleString()} margin</p>
                <button className="mt-2 w-full text-xs border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 py-1.5 rounded-lg font-medium transition">
                  Add to Quote
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
