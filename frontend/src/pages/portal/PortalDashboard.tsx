import { FileText, Clock, CheckCircle, MessageSquare, ArrowRight } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';

const myQuotations = [
  { id: 'q-2026-0019', quotationNumber: 'Q-2026-0019', amount: '₹13,80,600', status: 'APPROVED',           items: 1, lastUpdated: 'Sep 3, 2026',  validUntil: 'Oct 3, 2026' },
  { id: 'q-2026-0015', quotationNumber: 'Q-2026-0015', amount: '₹14,51,400', status: 'UNDER_NEGOTIATION',  items: 2, lastUpdated: 'Sep 1, 2026',  validUntil: 'Oct 1, 2026' },
  { id: 'q-2026-0010', quotationNumber: 'Q-2026-0010', amount: '₹88,200',    status: 'CONVERTED_TO_ORDER', items: 1, lastUpdated: 'Aug 28, 2026', validUntil: null          },
];

const recentActivity = [
  { icon: '📝', text: "Your counter-offer for Q-2026-0015 is under review",           time: '2h ago' },
  { icon: '✅', text: 'Q-2026-0019 has been approved — ready to confirm',              time: '1d ago' },
  { icon: '💬', text: 'Sales rep replied to your comment on Q-2026-0015',             time: '2d ago' },
  { icon: '📄', text: 'New quotation Q-2026-0019 sent to you',                        time: '3d ago' },
];

const statusConfig: Record<string, { label: string; variant: any; action?: string }> = {
  APPROVED:           { label: 'Approved ✓',     variant: 'success', action: 'Confirm Order'  },
  UNDER_NEGOTIATION:  { label: 'Under Review',   variant: 'warning', action: 'View Details'   },
  PENDING_MANAGER:    { label: 'Pending Approval',variant: 'warning', action: 'View Details'   },
  PENDING_FINANCE:    { label: 'Pending Finance', variant: 'purple',  action: 'View Details'   },
  CONVERTED_TO_ORDER: { label: 'Order Placed ✓', variant: 'info',    action: 'Track Order'    },
  DRAFT:              { label: 'Draft',           variant: 'default', action: 'View'           },
};

export function PortalDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 transition-colors">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">Welcome, Acme Global Industries 👋</h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          You have <span className="text-slate-900 dark:text-white font-semibold">1 quotation ready to confirm</span> and 1 awaiting negotiation.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Quotations',     value: '2', icon: <FileText className="w-4 h-4" /> },
          { label: 'Awaiting Confirmation', value: '1', icon: <Clock className="w-4 h-4" /> },
          { label: 'Orders Placed',         value: '3', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Unread Messages',       value: '2', icon: <MessageSquare className="w-4 h-4" /> },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-4 flex items-center gap-4 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-500 dark:text-zinc-400 shrink-0">
              {s.icon}
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{s.value}</p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Quotation cards */}
        <div className="col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">My Quotations</h2>
          {myQuotations.map((q) => {
            const cfg = statusConfig[q.status] ?? { label: q.status, variant: 'default', action: 'View' };
            return (
              <div
                key={q.id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors cursor-pointer"
                onClick={() => navigate(`/portal/quotations/${q.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-slate-600 dark:text-zinc-400 text-xs">{q.quotationNumber}</span>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">{q.amount}</p>
                    <div className="flex gap-4 text-[11px] text-slate-400 dark:text-zinc-500">
                      <span>{q.items} item{q.items > 1 ? 's' : ''}</span>
                      <span>Updated {q.lastUpdated}</span>
                      {q.validUntil && <span>Valid until {q.validUntil}</span>}
                    </div>
                  </div>
                  <button
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                      q.status === 'APPROVED'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200'
                        : 'border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300'
                    }`}
                    onClick={(e) => { e.stopPropagation(); navigate(`/portal/quotations/${q.id}`); }}
                  >
                    {cfg.action} <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Activity feed */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Recent Activity</h2>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-zinc-800/60">
            {recentActivity.map((a, i) => (
              <div key={i} className="px-5 py-3 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition">
                <div className="flex items-start gap-3">
                  <span className="text-sm shrink-0">{a.icon}</span>
                  <div>
                    <p className="text-xs text-slate-700 dark:text-zinc-300">{a.text}</p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">{a.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-5 flex items-center justify-between transition-colors">
        <div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Q-2026-0019 is approved and ready to confirm!</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Confirm now to lock in pricing and initiate fulfillment.</p>
        </div>
        <button
          onClick={() => navigate('/portal/quotations/q-2026-0019')}
          className="bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 px-5 py-2.5 rounded-lg text-xs font-medium transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          Confirm Order <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
