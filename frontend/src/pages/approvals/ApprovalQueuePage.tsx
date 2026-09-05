import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Building2,
  TrendingUp,
  Percent,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Clock,
  User,
  MessageSquare,
} from 'lucide-react';
import { approvalService } from '../../services/approval.service';
import type { Approval } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Skeleton';

export function ApprovalQueuePage() {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Decision modal state
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [decisionAction, setDecisionAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await approvalService.getPendingApprovals();
      setApprovals(data);
    } catch (err: any) {
      console.error('Failed to load pending approvals:', err);
      setError(err.response?.data?.message || 'Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const openDecisionModal = (app: Approval, action: 'APPROVE' | 'REJECT') => {
    setSelectedApproval(app);
    setDecisionAction(action);
    setReason(
      action === 'APPROVE'
        ? 'Discount approved per strategic account expansion policy.'
        : 'Discount exceeds allowed corporate margin tolerance.'
    );
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval) return;
    if (!reason.trim()) {
      setError('A reason is required for compliance and audit logging.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await approvalService.processDecision(selectedApproval.id, {
        action: decisionAction,
        reason: reason.trim(),
      });
      setSuccessMsg(res.message || `Approval ${decisionAction.toLowerCase()}d successfully.`);
      setSelectedApproval(null);
      fetchApprovals();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Decision failed:', err);
      setError(err.response?.data?.message || 'Failed to process decision');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Approval Queue
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Review deals exceeding discount thresholds and evaluate Blended Risk Scores.
          </p>
        </div>
        <button
          onClick={fetchApprovals}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Queue Listing */}
      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : approvals.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">All Clear!</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
            There are currently no quotations pending manager or finance sign-off. All deals are compliant.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((app) => {
            const quote = app.quotation;
            if (!quote) return null;

            const margin = Number(quote.marginPercentage || 0);
            const isFinanceLevel = app.level === 2;

            return (
              <div
                key={app.id}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-3.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                      {quote.quotationNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                        isFinanceLevel
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60'
                      }`}
                    >
                      {isFinanceLevel ? 'Level 2 (Finance Escalation)' : 'Level 1 (Sales Manager)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Requested {new Date(app.requestedAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Deal Snapshot Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block mb-1">Customer</span>
                    <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{quote.customer?.companyName}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Tier: {quote.customer?.customerTier?.name || 'Gold'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block mb-1">Total Deal Value</span>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white font-mono">
                      ₹{Number(quote.totalAmount).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-mono">
                      -₹{Number(quote.discountAmount).toLocaleString('en-IN')} Discount
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block mb-1">Gross Margin</span>
                    <div className="font-semibold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{margin.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block mb-1">Blended Risk Score</span>
                    <div className="font-semibold text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono">
                      <Percent className="w-3.5 h-3.5" />
                      <span>{Number(quote.riskScore).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Line Items Preview */}
                <div className="bg-slate-50 dark:bg-zinc-950/50 rounded-lg p-3 text-xs space-y-1.5">
                  <div className="font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Line Items Contributing to Risk:
                  </div>
                  {quote.items?.map((item) => {
                    const hasExcess = (item.discountExcess ?? 0) > 0;
                    return (
                      <div key={item.id} className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-zinc-800/60 last:border-0">
                        <div>
                          <span className="font-medium text-slate-900 dark:text-zinc-200">{item.product?.name}</span>
                          <span className="text-slate-400 dark:text-zinc-500 ml-2">Qty: {item.quantity}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono">₹{Number(item.lineTotal).toLocaleString('en-IN')}</span>
                          <span className={`font-semibold ${hasExcess ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-zinc-400'}`}>
                            {item.discountPercentage}% Discount
                            {hasExcess && ` (${item.discountExcess}% excess)`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => navigate(`/quotations/${quote.id}`)}
                    className="text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1"
                  >
                    <span>View full quotation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => openDecisionModal(app, 'REJECT')}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 transition-colors"
                    >
                      Reject Deal
                    </button>
                    <button
                      onClick={() => openDecisionModal(app, 'APPROVE')}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 transition-colors"
                    >
                      Authorize Approval
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decision Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {decisionAction === 'APPROVE' ? 'Authorize Quotation' : 'Reject Quotation'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Provide an immutable audit reason for {selectedApproval.quotation?.quotationNumber}.
            </p>

            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                  Audit Reason (Mandatory)
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain the commercial or margin rationale..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApproval(null)}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reason.trim()}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg text-white transition-colors ${
                    decisionAction === 'APPROVE'
                      ? 'bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submitting ? 'Processing...' : `Confirm ${decisionAction}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
