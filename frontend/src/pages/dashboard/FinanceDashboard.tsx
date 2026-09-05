import { CreditCard, TrendingUp, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';

const invoices = [
  { id: 'INV-ONE-886430', order: 'ORD-2026-0019', customer: 'Acme Global Industries', amount: '₹13,80,600', status: 'PAID',           dueDate: 'Sep 10, 2026' },
  { id: 'INV-ONE-771201', order: 'ORD-2026-0018', customer: 'Beta Technologies',      amount: '₹88,200',    status: 'ISSUED',         dueDate: 'Sep 15, 2026' },
  { id: 'INV-ONE-660982', order: 'ORD-2026-0017', customer: 'Nexus Solutions',        amount: '₹2,05,800',  status: 'PARTIALLY_PAID', dueDate: 'Sep 5, 2026'  },
  { id: 'INV-ONE-554301', order: 'ORD-2026-0016', customer: 'Pinnacle Corp',          amount: '₹4,25,300',  status: 'PAID',           dueDate: 'Aug 30, 2026' },
];

const pendingFinanceApprovals = [
  { quote: 'Q-2026-0009', customer: 'Stellar Dynamics', riskScore: 28.5, discount: '24%', amount: '₹5,20,000' },
  { quote: 'Q-2026-0005', customer: 'Apex Industrial',  riskScore: 31.2, discount: '26%', amount: '₹8,10,000' },
];

const invoiceStatusVariant: Record<string, any> = {
  PAID: 'success', ISSUED: 'info', PARTIALLY_PAID: 'warning', OVERDUE: 'danger',
};

export function FinanceDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Finance Dashboard</h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Billing overview and high-risk approvals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Invoiced"    value="₹1.2Cr"  subtitle="This month"          icon={<CreditCard className="w-4 h-4" />}   />
        <StatCard title="Collected"         value="₹88.4L"  subtitle="73% collection rate" icon={<CheckCircle className="w-4 h-4" />}  />
        <StatCard title="Outstanding"       value="₹31.6L"  subtitle="15 invoices"         icon={<Clock className="w-4 h-4" />}        />
        <StatCard title="Finance Approvals" value="2"        subtitle="High-risk pending"   icon={<TrendingUp className="w-4 h-4" />}   />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Invoice table */}
        <div className="col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Recent Invoices</h2>
            <button className="text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 flex items-center gap-1 transition">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-zinc-900 text-[11px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Invoice</th>
                <th className="px-5 py-3 text-left font-medium">Customer</th>
                <th className="px-5 py-3 text-left font-medium">Amount</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/60">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition cursor-pointer">
                  <td className="px-5 py-3 font-mono text-slate-500 dark:text-zinc-400 text-xs">{inv.id}</td>
                  <td className="px-5 py-3 text-slate-700 dark:text-zinc-300 text-xs">{inv.customer}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-zinc-100 text-xs">{inv.amount}</td>
                  <td className="px-5 py-3">
                    <Badge variant={invoiceStatusVariant[inv.status] ?? 'default'}>
                      {inv.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-400 dark:text-zinc-500 text-xs">{inv.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Finance approval queue */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Finance Approval Queue</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">High-risk Level 2 sign-off required</p>
          </div>
          <div className="p-4 space-y-3">
            {pendingFinanceApprovals.map((a) => (
              <div key={a.quote} className="p-4 border border-rose-100 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-950/20 rounded-lg transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-medium text-slate-600 dark:text-zinc-400">{a.quote}</span>
                  <Badge variant="danger">Risk: {a.riskScore}</Badge>
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-zinc-200">{a.customer}</p>
                <div className="flex gap-3 mt-1 text-xs text-slate-400 dark:text-zinc-500">
                  <span>Amount: <b className="text-slate-700 dark:text-zinc-300">{a.amount}</b></span>
                  <span>Discount: <b className="text-rose-600 dark:text-rose-400">{a.discount}</b></span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer">
                    ✓ Approve
                  </button>
                  <button className="flex-1 border border-rose-200 dark:border-rose-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer">
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
