import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  TrendingUp,
  CheckCircle,
  PlusCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { StatCardSkeleton, TableRowSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { useAppSelector } from '../../store/hooks';
import { quotationService } from '../../services/quotation.service';
import type { Quotation, QuotationStatus, Product } from '../../types';

const statusBadge: Record<QuotationStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' }> = {
  DRAFT:              { label: 'Draft',            variant: 'default' },
  PENDING_MANAGER:    { label: 'Pending Approval', variant: 'warning' },
  PENDING_FINANCE:    { label: 'Pending Finance',  variant: 'purple'  },
  APPROVED:           { label: 'Approved',         variant: 'success' },
  REJECTED:           { label: 'Rejected',         variant: 'danger'  },
  CONVERTED_TO_ORDER: { label: 'Converted',        variant: 'info'    },
};

export function SalesRepDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const [qData, pData] = await Promise.all([
          quotationService.getQuotations(),
          quotationService.getProducts(),
        ]);
        if (!isMounted) return;
        setQuotations(qData);
        setProducts(pData);
      } catch (err) {
        console.error('Error loading sales rep dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live metrics
  const activeQuotations = quotations.filter(
    (q) => q.status === 'DRAFT' || q.status === 'PENDING_MANAGER' || q.status === 'PENDING_FINANCE' || q.status === 'APPROVED'
  ).length;

  const pendingApproval = quotations.filter(
    (q) => q.status === 'PENDING_MANAGER' || q.status === 'PENDING_FINANCE'
  ).length;

  const ordersClosed = quotations.filter((q) => q.status === 'CONVERTED_TO_ORDER').length;

  const totalRevenue = quotations
    .filter((q) => q.status === 'APPROVED' || q.status === 'CONVERTED_TO_ORDER')
    .reduce((acc, q) => acc + Number(q.totalAmount || 0), 0);

  const formattedRevenue =
    totalRevenue >= 100000
      ? `₹${(totalRevenue / 100000).toFixed(1)}L`
      : `₹${totalRevenue.toLocaleString('en-IN')}`;

  // Recent 5 quotations
  const recentQuotations = [...quotations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Recommendations based on products
  const suggestedProducts = products.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Hello, {user?.name || user?.username?.split('(')[0]?.trim() || 'Sales Rep'} 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Here's your live sales operations overview
          </p>
        </div>
        <button
          onClick={() => navigate('/quotations/new')}
          className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-zinc-200 text-white dark:text-black px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Quotation
        </button>
      </div>

      {/* Metric Cards */}
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
              title="Active Quotations"
              value={activeQuotations.toString()}
              subtitle="Drafts & pending deals"
              icon={<FileText className="w-4 h-4" />}
            />
            <StatCard
              title="Pending Approvals"
              value={pendingApproval.toString()}
              subtitle="Awaiting manager/finance sign-off"
              icon={<Clock className="w-4 h-4" />}
            />
            <StatCard
              title="Approved Revenue"
              value={formattedRevenue}
              subtitle="From approved & converted quotes"
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <StatCard
              title="Orders Closed"
              value={ordersClosed.toString()}
              subtitle="Converted to fulfillment"
              icon={<CheckCircle className="w-4 h-4" />}
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quotation Table */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Recent Quotations</h2>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Your latest deals and proposal activity</p>
            </div>
            <button
              onClick={() => navigate('/quotations')}
              className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-medium transition"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/70 dark:bg-zinc-950/50 text-[11px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3 text-left">Quote #</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Amount</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {loading ? (
                  <>
                    <TableRowSkeleton columns={5} />
                    <TableRowSkeleton columns={5} />
                    <TableRowSkeleton columns={5} />
                    <TableRowSkeleton columns={5} />
                  </>
                ) : recentQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                      No quotations found. Create your first quotation to get started!
                    </td>
                  </tr>
                ) : (
                  recentQuotations.map((q) => (
                    <tr
                      key={q.id}
                      onClick={() => navigate(`/quotations/${q.id}`)}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition cursor-pointer group"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-700 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-white">
                        {q.quotationNumber}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-700 dark:text-zinc-300 font-medium">
                        {q.customer?.companyName || 'Standard Account'}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-900 dark:text-zinc-100">
                        ₹{Number(q.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={statusBadge[q.status]?.variant ?? 'default'}>
                          {statusBadge[q.status]?.label ?? q.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-400 dark:text-zinc-500">
                        {new Date(q.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Recommendations Panel */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm transition-colors space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Margin Booster</h2>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400">
              Co-purchase AI
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Top catalog items to cross-sell and boost margin contribution on active deals.
          </p>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ) : suggestedProducts.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 dark:text-zinc-500">
              No products found in catalog.
            </div>
          ) : (
            <div className="space-y-3">
              {suggestedProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3.5 rounded-lg border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 space-y-2 hover:border-slate-300 dark:hover:border-zinc-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {prod.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 mt-0.5">
                        ₹{Number(prod.basePrice).toLocaleString('en-IN')} • {prod.category?.name || 'Hardware'}
                      </div>
                    </div>
                    <Badge variant="purple">Cross-sell</Badge>
                  </div>
                  <button
                    onClick={() => navigate('/quotations/new')}
                    className="w-full mt-2 py-1.5 text-xs font-medium rounded-md bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Quote with Product
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
