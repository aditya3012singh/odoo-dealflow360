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

  const [showCounterForm, setShowCounterForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [counterDiscount, setCounterDiscount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [submittingCounter, setSubmittingCounter] = useState(false);
  const [counterSuccess, setCounterSuccess] = useState<string | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);

  async function loadQuote() {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await portalService.getQuotation(id);
      setQuote(data);
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
    if (!id || !counterDiscount) return;
    try {
      setSubmittingCounter(true);
      setCounterSuccess(null);
      await portalService.submitCounterOffer(
        id,
        Number(counterDiscount),
        counterMessage.trim() || undefined
      );
      setCounterSuccess('Counter-offer proposal submitted for commercial review.');
      setCounterDiscount('');
      setCounterMessage('');
      setShowCounterForm(false);
      await loadQuote();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to submit counter-offer.');
    } finally {
      setSubmittingCounter(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!id) return;
    try {
      setConfirming(true);
      setConfirmSuccess(null);
      await portalService.confirmAndConvert(id);
      setConfirmSuccess('Order successfully placed! Split fulfillment and billing initiated.');
      await loadQuote();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to confirm order.');
    } finally {
      setConfirming(false);
    }
  };

  const handleComment = async () => {
    if (!id || !comment.trim()) return;
    try {
      await portalService.addComment(id, comment.trim());
      setComment('');
      setShowCommentForm(false);
      await loadComments();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to send comment.');
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
          {/* Line items skeleton */}
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

          {/* Pricing & action summary skeleton */}
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
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-xs transition cursor-pointer"
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

  return (
    <div className="space-y-6">
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
            <Printer className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Download Official Quote (PDF)</span>
          </button>
          <button
            onClick={() => {
              loadQuote();
              loadComments();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
            title="Refresh quote"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {counterSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{counterSuccess}</span>
        </div>
      )}

      {confirmSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500 text-white font-medium flex items-center gap-3 text-xs shadow-lg">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">{confirmSuccess}</p>
            <p className="opacity-90 text-[11px] mt-0.5">
              Your order has been queued for warehouse inventory allocation and automated delivery split.
            </p>
          </div>
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

      {/* Interactive Actions (Confirm Order & Counter Offer) */}
      {!isConverted && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  : 'This quotation is under internal commercial review. You can also confirm immediately to expedite final sign-off.'}
              </p>
            </div>
            <button
              onClick={handleConfirmOrder}
              disabled={confirming}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
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
                Need a volume incentive or adjusted terms? Propose a target discount percentage.
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
                <div className="mt-3 space-y-2 pt-2 border-t border-amber-200 dark:border-amber-800/50">
                  <input
                    type="number"
                    value={counterDiscount}
                    onChange={(e) => setCounterDiscount(e.target.value)}
                    placeholder="Requested discount % (e.g. 18)"
                    className="w-full px-3 py-2 border border-amber-200 dark:border-amber-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100"
                    min="1"
                    max="50"
                  />
                  <textarea
                    value={counterMessage}
                    onChange={(e) => setCounterMessage(e.target.value)}
                    placeholder="Notes or justification for this pricing (optional)..."
                    rows={2}
                    className="w-full px-3 py-2 border border-amber-200 dark:border-amber-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 resize-none"
                  />
                  <button
                    onClick={handleCounterOffer}
                    disabled={submittingCounter || !counterDiscount}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {submittingCounter ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>{submittingCounter ? 'Submitting Proposal...' : 'Submit Counter-Offer'}</span>
                  </button>
                </div>
              )}
            </div>
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
              const isRep = c.authorType === 'REP' || c.type === 'REP';
              return (
                <div key={c.id || i} className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                        isRep ? 'bg-slate-900 dark:bg-white dark:text-black' : 'bg-emerald-600'
                      }`}
                    >
                      {(c.author?.username || c.authorName || (isRep ? 'R' : 'C')).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      {c.author?.username || (isRep ? 'Sales Executive' : 'You (Client)')}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                      {new Date(c.createdAt || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 ml-8 whitespace-pre-wrap">
                    {c.message || c.text}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {showCommentForm && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/40 space-y-2">
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
    </div>
  );
}
