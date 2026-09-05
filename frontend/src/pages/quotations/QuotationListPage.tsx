import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  FileText,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Percent,
  RefreshCw,
  Building2,
  Trash2,
} from 'lucide-react';
import { quotationService } from '../../services/quotation.service';
import type { Quotation, QuotationStatus } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Skeleton';

function getStepIndex(status: string): number {
  const s = (status || 'DRAFT').toUpperCase();
  switch (s) {
    case 'DRAFT': return 0;
    case 'PENDING_MANAGER':
    case 'PENDING_FINANCE': return 1;
    case 'APPROVED':
    case 'UNDER_NEGOTIATION': return 2;
    case 'CONVERTED_TO_ORDER':
    case 'ORDER_PLACED': return 3;
    case 'CONFIRMED':
    case 'PROCESSING':
    case 'PARTIALLY_FULFILLED': return 4;
    case 'DISPATCHED':
    case 'SHIPPED':
    case 'DELIVERED':
    case 'FULFILLED': return 5;
    default: return 0;
  }
}

export function QuotationListPage() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);

  // Delete modal state
  const [deleteQuote, setDeleteQuote] = useState<Quotation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await quotationService.getQuotations({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as QuotationStatus) : undefined,
      });
      setQuotations(data);
    } catch (err: any) {
      console.error('Failed to load quotations:', err);
      setError(err.response?.data?.message || 'Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuotations();
  };

  const handleDeleteClick = (e: React.MouseEvent, q: Quotation) => {
    e.stopPropagation(); // Don't navigate to the quote page
    setDeleteQuote(q);
  };

  const confirmDelete = async () => {
    if (!deleteQuote) return;
    try {
      setDeleting(true);
      setError(null);
      await quotationService.deleteQuotation(deleteQuote.id);
      setDeleteQuote(null);
      fetchQuotations();
    } catch (err: any) {
      console.error('Failed to delete quotation:', err);
      setError(err.response?.data?.message || 'Failed to delete quotation');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="default">Draft</Badge>;
      case 'PENDING_MANAGER':
        return <Badge variant="warning">Pending Manager</Badge>;
      case 'PENDING_FINANCE':
        return <Badge variant="danger">Pending Finance</Badge>;
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'CONVERTED_TO_ORDER':
        return <Badge variant="info">Converted to Order</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="default">{status.replace(/_/g, ' ')}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Quotations & Pipeline
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Build deals with automated discount governance, live margin calculation, and approval routing.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchQuotations}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors"
            title="Reload data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/quotations/new')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Quotation
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search quotation # or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 dark:text-zinc-500 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_MANAGER">Pending Manager</option>
            <option value="PENDING_FINANCE">Pending Finance</option>
            <option value="APPROVED">Approved</option>
            <option value="CONVERTED_TO_ORDER">Converted to Order</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : quotations.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-zinc-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No quotations found</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            Get started by creating your first deal with automated risk calculation and live margin tracking.
          </p>
          <button
            onClick={() => navigate('/quotations/new')}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Quotation
          </button>
        </div>
      ) : (
        /* Quotation Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotations.map((q) => {
            const margin = Number(q.marginPercentage || 0);
            const marginColor =
              margin >= 30
                ? 'text-emerald-600 dark:text-emerald-400'
                : margin >= 20
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-rose-600 dark:text-rose-400';

            return (
              <div
                key={q.id}
                onClick={() => navigate(`/quotations/${q.id}`)}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-sm font-medium text-slate-900 dark:text-zinc-100">
                      {q.quotationNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getStatusBadge(q.status)}
                      <button
                        onClick={(e) => handleDeleteClick(e, q)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Delete Quotation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-zinc-200">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                      <span className="truncate">{q.customer?.companyName || 'Unknown Customer'}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2">
                      <span>Tier: {q.customer?.customerTier?.name || 'Standard'}</span>
                      <span>•</span>
                      <span>{q.items?.length || 0} line items</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 mb-1">
                    <span>Total Deal Value</span>
                    <span className="font-semibold text-sm text-slate-900 dark:text-white font-mono">
                      ₹{Number(q.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mt-2">
                    <div className="flex items-center gap-1">
                      <TrendingUp className={`w-3.5 h-3.5 ${marginColor}`} />
                      <span className={`font-medium ${marginColor}`}>
                        {margin.toFixed(1)}% Margin
                      </span>
                    </div>

                    {Number(q.riskScore || 0) > 0 && (
                      <div className="flex items-center gap-1 text-slate-500 dark:text-zinc-400 font-mono">
                        <Percent className="w-3 h-3" />
                        <span>BRS: {Number(q.riskScore).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-2.5 flex items-center justify-between text-xs border-t border-slate-100 dark:border-zinc-800/60">
                    {/* Mini Deal Journey Pipeline Dots */}
                    <div className="flex items-center gap-1.5" title={`Milestone Stage ${getStepIndex(q.status) + 1} of 6`}>
                      {Array.from({ length: 6 }).map((_, i) => {
                        const stepIdx = getStepIndex(q.status);
                        const isDone = i < stepIdx;
                        const isCurrent = i === stepIdx;
                        return (
                          <span
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all ${
                              isDone
                                ? 'bg-purple-600 dark:bg-purple-500'
                                : isCurrent
                                ? 'bg-purple-600 dark:bg-purple-400 ring-2 ring-purple-300 dark:ring-purple-900 animate-pulse'
                                : 'bg-slate-200 dark:bg-zinc-800'
                            }`}
                          />
                        );
                      })}
                    </div>

                    <div className="flex items-center text-xs font-medium text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      <span>Open Deal</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteQuote && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Delete Quotation
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Are you sure you want to delete {deleteQuote.quotationNumber}?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-300">
              This action will permanently delete this quotation, all line items, approval logs, and customer negotiation requests. This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteQuote(null)}
                disabled={deleting}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete Quotation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
