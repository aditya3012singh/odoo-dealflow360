import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Send,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building,
  Printer,
  XCircle,
  ThumbsDown,
  Percent,
  Sliders,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { DealLifecycleStepper } from '../../components/common/DealLifecycleStepper';
import {
  portalService,
  type PortalQuoteDetail,
} from '../../services/portal.service';

const statusConfig: Record<string, { label: string; variant: 'purple' | 'success' | 'warning' | 'info' | 'default' }> = {
  APPROVED:           { label: 'Approved ✓',      variant: 'success' },
  UNDER_NEGOTIATION:  { label: 'Under Review',    variant: 'warning' },
  PENDING_MANAGER:    { label: 'Pending Review',  variant: 'warning' },
  PENDING_FINANCE:    { label: 'Pending Finance', variant: 'purple'  },
  CONVERTED_TO_ORDER: { label: 'Order Placed ✓',  variant: 'info'    },
  CONFIRMED:          { label: 'Confirmed ✓',     variant: 'info'    },
  REJECTED:           { label: 'Declined',        variant: 'default' },
  DRAFT:              { label: 'Draft',            variant: 'default' },
};

const DECLINE_REASON_PRESETS = [
  'Pricing exceeds authorized project budget for this fiscal quarter.',
  'Payment terms or discount schedule not aligned with corporate procurement policy.',
  'Lead time and delivery timeline does not meet project deadline.',
  'Decided to evaluate alternative vendor or retain existing infrastructure.',
];

function formatINR(val: number | string | undefined | null) {
  const num = Number(val || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function PortalQuotationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quote, setQuote] = useState<PortalQuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // In-app banner notifications (eliminates browser alert() dialogs)
  const [actionError, setActionError] = useState<string | null>(null);
  const [counterSuccess, setCounterSuccess] = useState<string | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);
  const [declineSuccess, setDeclineSuccess] = useState<string | null>(null);

  // Counter offer state
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterDiscount, setCounterDiscount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [submittingCounter, setSubmittingCounter] = useState(false);
  const [useItemizedCounter, setUseItemizedCounter] = useState(false);
  const [itemDiscounts, setItemDiscounts] = useState<Record<string, number>>({});

  // Decline proposal modal state
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState(DECLINE_REASON_PRESETS[0]);
  const [declining, setDeclining] = useState(false);

  // Order confirmation state
  const [confirming, setConfirming] = useState(false);

  // Discussion state
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  async function loadQuote() {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await portalService.getQuotation(id);
      setQuote(data);

      // Initialize item discounts for counter-offer builder
      if (data?.items) {
        const initialMap: Record<string, number> = {};
        data.items.forEach((it) => {
          initialMap[it.id] = Number(it.discountPercentage || 0);
        });
        setItemDiscounts(initialMap);
      }
    } catch (err: any) {
      console.error('Failed to load quotation:', err);
      setError(err?.response?.data?.message || 'Quotation not found or unauthorized.');
    } finally {
      setLoading(false);
    }
  }

  async function loadComments() {
    if (!id) return;
    try {
      setCommentsLoading(true);
      const res = await portalService.getComments(id);
      setComments(res);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  }

  useEffect(() => {
    loadQuote();
    loadComments();
  }, [id]);

  const handleCounterOffer = async () => {
    if (!id) return;
    const discountVal = Number(counterDiscount);
    if (isNaN(discountVal) || discountVal <= 0 || discountVal > 50) {
      setActionError('Please specify a valid requested discount percentage between 1% and 50%.');
      return;
    }

    let finalMessage = counterMessage.trim();
    if (useItemizedCounter && quote?.items) {
      const itemBreakdown = quote.items
        .map((it) => {
          const targetDisc = itemDiscounts[it.id] ?? Number(it.discountPercentage);
          return `• ${it.product.name} (${it.product.sku}): Target ${targetDisc}% discount`;
        })
        .join('\n');
      finalMessage = finalMessage
        ? `${finalMessage}\n\nItemized Revision Request:\n${itemBreakdown}`
        : `Itemized Revision Request:\n${itemBreakdown}`;
    }

    try {
      setSubmittingCounter(true);
      setActionError(null);
      setCounterSuccess(null);
      await portalService.submitCounterOffer(
        id,
        discountVal,
        finalMessage || undefined
      );
      setCounterSuccess('Counter-offer proposal submitted for commercial review. Our sales operations team has been notified.');
      setCounterDiscount('');
      setCounterMessage('');
      setShowCounterForm(false);
      await loadQuote();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to submit counter-offer. Please try again.');
    } finally {
      setSubmittingCounter(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!id) return;
    try {
      setConfirming(true);
      setActionError(null);
      setConfirmSuccess(null);
      await portalService.confirmAndConvert(id);
      setConfirmSuccess('Order successfully placed! Split fulfillment and billing initiated.');
      await loadQuote();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to confirm order. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const handleDecline = async () => {
    if (!id) return;
    try {
      setDeclining(true);
      setActionError(null);
      setDeclineSuccess(null);
      await portalService.declineQuotation(id, declineReason.trim() || undefined);
      setDeclineSuccess('Quotation proposal has been declined. Your account representative has been notified.');
      setShowDeclineModal(false);
      await loadQuote();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to decline proposal. Please try again.');
    } finally {
      setDeclining(false);
    }
  };

  const handleComment = async () => {
    if (!id || !comment.trim()) return;
    try {
      setActionError(null);
      await portalService.addComment(id, comment.trim());
      setComment('');
      setShowCommentForm(false);
      await loadComments();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to send note.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Top Back & Status Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Hero Card Skeleton */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>

        {/* Two Column Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <Skeleton className="h-5 w-36" />
              <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="space-y-1.5 text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                      <Skeleton className="h-3 w-16 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/portal/dashboard')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>
        <div className="p-6 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error || 'Quotation could not be located.'}</span>
        </div>
      </div>
    );
  }

  const cfg = statusConfig[quote.status] ?? { label: quote.status, variant: 'default' };
  const canConfirm = quote.status === 'APPROVED';
  const isConverted = quote.status === 'CONVERTED_TO_ORDER' || quote.status === 'CONFIRMED';
  const isRejected = quote.status === 'REJECTED';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Back Navigation & Status */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/portal/dashboard')}
          className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white text-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs text-slate-700 dark:text-zinc-300 font-semibold transition cursor-pointer shadow-sm"
            title="Download / Print Official Quotation PDF"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Download Official Quote (PDF)</span>
          </button>
          <button
            onClick={() => {
              loadQuote();
              loadComments();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="Refresh quote"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modern Banner Notifications */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="font-semibold underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {counterSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{counterSuccess}</span>
          </div>
          <button onClick={() => setCounterSuccess(null)} className="font-semibold underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {confirmSuccess && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white font-medium flex items-center justify-between gap-3 text-xs shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">{confirmSuccess}</p>
              <p className="opacity-90 text-[11px] mt-0.5">
                Your order has been queued for warehouse inventory allocation and automated delivery split.
              </p>
            </div>
          </div>
          <button onClick={() => setConfirmSuccess(null)} className="font-semibold underline cursor-pointer text-white/90">
            Dismiss
          </button>
        </div>
      )}

      {declineSuccess && (
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-3 text-xs text-slate-800 dark:text-zinc-200 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <XCircle className="w-4 h-4 shrink-0 text-slate-500" />
            <span>{declineSuccess}</span>
          </div>
          <button onClick={() => setDeclineSuccess(null)} className="font-semibold underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {isRejected && !declineSuccess && (
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 flex items-center gap-3 text-xs text-slate-700 dark:text-zinc-300">
          <XCircle className="w-4 h-4 shrink-0 text-slate-500" />
          <span>
            This quotation proposal is closed (declined). Need updated terms or a revised product specification? Please add a note in the discussion ledger or contact your sales representative.
          </span>
        </div>
      )}

      {/* End-to-End Deal Journey Stepper */}
      <DealLifecycleStepper
        status={quote.status}
        quotationNumber={quote.quotationNumber}
        orderNumber={quote.orderId ? `SO-${quote.quotationNumber.replace('QT-', '')}` : undefined}
        createdAt={quote.createdAt}
        updatedAt={quote.updatedAt}
      />

      {/* Header card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 transition-colors shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {quote.quotationNumber}
              </h1>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" /> {quote.customer.companyName}
              </span>
              {quote.expiresAt && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Valid until{' '}
                  {new Date(quote.expiresAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
              Total Payable Amount
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formatINR(quote.totalAmount)}
            </p>
          </div>
        </div>

        {/* Commercial Breakdown */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/60">
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">Gross Subtotal</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 mt-0.5">
              {formatINR(quote.subtotal)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/60">
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">Discount Applied</p>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
              - {formatINR(quote.discountAmount)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/60">
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">Estimated Tax (GST)</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 mt-0.5">
              {formatINR(quote.taxAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Line items table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm transition-colors">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
            Quotation Line Items
          </h2>
          <span className="text-xs text-slate-400 dark:text-zinc-500">
            {quote.items.length} Product{quote.items.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 dark:bg-zinc-950/50 text-[11px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3 text-left">Product</th>
                <th className="px-6 py-3 text-right">Quantity</th>
                <th className="px-6 py-3 text-right">Unit Price</th>
                <th className="px-6 py-3 text-right">Discount</th>
                <th className="px-6 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {quote.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.product.imageUrl && (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                        />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                          {item.product.name}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">
                          SKU: {item.product.sku}
                          {item.product.isRecurring && ' · Subscription Plan'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-slate-700 dark:text-zinc-300 font-medium">
                    {item.quantity} {item.product.unit || 'units'}
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-slate-700 dark:text-zinc-300">
                    {formatINR(item.unitPrice)}
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-amber-600 dark:text-amber-400 font-medium">
                    {Number(item.discountPercentage)}%
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-semibold text-slate-900 dark:text-zinc-100">
                    {formatINR(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Actions (Confirm Order, Counter Offer, Decline Proposal) */}
      {!isConverted && !isRejected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Order confirmation card */}
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-5 flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                  Ready to Lock In Pricing?
                </h3>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400/90 mb-4">
                {canConfirm
                  ? 'This quote has received commercial approval. Confirm to generate the formal sales order, allocate warehouse stock, and initiate dispatch.'
                  : 'This quotation is under commercial review. You can confirm immediately to expedite final sign-off.'}
              </p>
            </div>
            <button
              onClick={handleConfirmOrder}
              disabled={confirming}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {confirming ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Converting to Order...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                  <span>Confirm & Convert to Order</span>
                </>
              )}
            </button>
          </div>

          {/* Counter offer card */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-5 flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                  Request Commercial Revision
                </h3>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400/90 mb-3">
                Need a volume incentive or adjusted terms? Propose target discount percentages.
              </p>
            </div>

            <div>
              <button
                onClick={() => setShowCounterForm(!showCounterForm)}
                className="w-full border border-amber-300 dark:border-amber-700 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 text-amber-900 dark:text-amber-300 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>Propose Counter-Offer</span>
                {showCounterForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showCounterForm && (
                <div className="mt-3 space-y-2 pt-2 border-t border-amber-200 dark:border-amber-800/50 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-900 dark:text-amber-300 mb-1">
                      Overall Requested Discount (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={counterDiscount}
                        onChange={(e) => setCounterDiscount(e.target.value)}
                        placeholder="e.g. 18"
                        className="w-full px-3 py-2 pl-7 border border-amber-200 dark:border-amber-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100"
                        min="1"
                        max="50"
                      />
                      <Percent className="w-3 h-3 text-amber-500 absolute left-2.5 top-3" />
                    </div>
                  </div>

                  {/* Toggle itemized counter proposal */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setUseItemizedCounter(!useItemizedCounter)}
                      className="text-[11px] text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>{useItemizedCounter ? 'Hide Itemized Line Adjustments' : 'Specify per-item target discounts'}</span>
                    </button>

                    {useItemizedCounter && (
                      <div className="mt-2 space-y-1.5 p-2.5 bg-amber-100/60 dark:bg-amber-950/40 rounded-lg border border-amber-200/60 dark:border-amber-800/40 max-h-40 overflow-y-auto">
                        {quote.items.map((it) => (
                          <div key={it.id} className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="truncate max-w-[130px] text-slate-800 dark:text-zinc-200 font-medium">
                              {it.product.name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={itemDiscounts[it.id] ?? Number(it.discountPercentage)}
                                onChange={(e) =>
                                  setItemDiscounts((prev) => ({
                                    ...prev,
                                    [it.id]: Number(e.target.value),
                                  }))
                                }
                                className="w-14 px-1.5 py-1 text-right border border-amber-300 dark:border-amber-700 rounded bg-white dark:bg-zinc-900 text-xs text-slate-800 dark:text-zinc-100"
                              />
                              <span className="text-amber-700 dark:text-amber-400">%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <textarea
                    value={counterMessage}
                    onChange={(e) => setCounterMessage(e.target.value)}
                    placeholder="Notes or business justification for this pricing..."
                    rows={2}
                    className="w-full px-3 py-2 border border-amber-200 dark:border-amber-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 resize-none"
                  />
                  <button
                    onClick={handleCounterOffer}
                    disabled={submittingCounter || !counterDiscount}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {submittingCounter ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>{submittingCounter ? 'Submitting Proposal...' : 'Submit Counter-Offer'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Decline proposal card */}
          <div className="bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ThumbsDown className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  Decline Proposal
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
                Not moving forward with this specification? Formally close this proposal with feedback for our sales team.
              </p>
            </div>
            <button
              onClick={() => setShowDeclineModal(true)}
              className="w-full border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Decline Quotation</span>
            </button>
          </div>
        </div>
      )}

      {/* Discussion & Comments section */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
              Negotiation & Discussion Ledger
            </h2>
          </div>
          <button
            onClick={() => setShowCommentForm(!showCommentForm)}
            className="text-xs border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
          >
            + Add Note / Question
          </button>
        </div>

        {commentsLoading ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-7 h-7 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="w-7 h-7 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>
        ) : !comments.length ? (
          <div className="px-6 py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
            No discussion notes on this quotation yet. Have a question? Add a note above.
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-zinc-800/60">
            {comments.map((c, i) => {
              const isRep =
                c.authorType === 'REP' ||
                c.authorRole === 'SALES_REP' ||
                c.type === 'REP';
              const isManager =
                c.authorType === 'MANAGER' ||
                c.authorRole === 'SALES_MANAGER' ||
                c.authorRole === 'ADMIN';

              const roleLabel = isManager
                ? 'Finance & Ops Manager'
                : isRep
                ? 'Sales Representative'
                : 'Customer (You)';

              const roleBadgeClass = isManager
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                : isRep
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';

              const avatarBgClass = isManager
                ? 'bg-purple-600'
                : isRep
                ? 'bg-indigo-600'
                : 'bg-emerald-600';

              return (
                <div key={c.id || i} className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${avatarBgClass}`}
                    >
                      {(c.authorName || (isRep ? 'R' : isManager ? 'M' : 'C')).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      {c.authorName || (isRep ? 'Sales Representative' : 'Customer')}
                    </span>
                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${roleBadgeClass}`}>
                      {roleLabel}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 ml-auto">
                      {new Date(c.createdAt || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 ml-8 whitespace-pre-wrap">
                    {c.comment || c.message || c.text}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {showCommentForm && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/40 space-y-2 animate-in fade-in">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ask a question or provide delivery/billing instructions..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCommentForm(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleComment}
                disabled={!comment.trim()}
                className="flex items-center gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 px-4 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3 h-3" /> Post Note
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Decline Proposal Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                  <ThumbsDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Decline Quotation Proposal
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Ref: {quote.quotationNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeclineModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400">
              Are you sure you want to decline this quotation? This will notify your dedicated account representative and archive this proposal.
            </p>

            {/* Decline reason presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Select Reason for Declining
              </label>
              <div className="space-y-1.5">
                {DECLINE_REASON_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDeclineReason(preset)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs border transition-colors cursor-pointer ${
                      declineReason === preset
                        ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-zinc-800 font-semibold text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    "{preset}"
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Additional Feedback (Optional)
              </label>
              <textarea
                rows={2}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Share any additional context or terms that could make this work..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                disabled={declining}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDecline}
                disabled={declining}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {declining ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>{declining ? 'Declining...' : 'Confirm Decline'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
