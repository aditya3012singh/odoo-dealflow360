import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building2,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Clock,
  Layers,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { approvalService } from '../../services/approval.service';
import type { Approval } from '../../types';
import { CardSkeleton } from '../../components/ui/Skeleton';

const APPROVAL_PRESETS = [
  'Discount approved per strategic account volume commitment.',
  'Authorized based on long-term client retention & renewal expansion.',
  'Special executive commercial sign-off granted; healthy gross margin preserved.',
];

const REJECT_PRESETS = [
  'Discount exceeds corporate gross margin floor (minimum 20% required).',
  'Volume requested does not qualify for Tier 2 custom pricing tier.',
  'Please renegotiate with client proposing a 10% maximum discount limit.',
];

export function ApprovalQueuePage() {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'LEVEL_1' | 'LEVEL_2'>('ALL');
  const [collapsedQuotes, setCollapsedQuotes] = useState<Record<string, boolean>>({});

  const toggleCollapse = (quoteId: string) => {
    setCollapsedQuotes((prev) => ({
      ...prev,
      [quoteId]: !prev[quoteId],
    }));
  };

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
    setReason(action === 'APPROVE' ? APPROVAL_PRESETS[0] : REJECT_PRESETS[0]);
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval) return;
    if (!reason.trim()) {
      setError('A mandatory audit reason is required for governance compliance.');
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

  // Filter approvals by tab
  const filteredApprovals = useMemo(() => {
    if (activeTab === 'LEVEL_1') return approvals.filter((a) => a.level === 1);
    if (activeTab === 'LEVEL_2') return approvals.filter((a) => a.level === 2);
    return approvals;
  }, [approvals, activeTab]);

  const level1Count = approvals.filter((a) => a.level === 1).length;
  const level2Count = approvals.filter((a) => a.level === 2).length;

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Governance & Approval Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
              {approvals.length} Pending
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Review customer counter-proposals and quotations exceeding automated tier discount allowances.
          </p>
        </div>

        <button
          onClick={fetchApprovals}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center justify-between gap-3 text-red-700 dark:text-red-400 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center justify-between gap-3 text-emerald-700 dark:text-emerald-400 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Queue Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800/80 pb-2">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <span>All Pending Deals</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 dark:bg-black/20">
            {approvals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('LEVEL_1')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'LEVEL_1'
              ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-black'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <span>Level 1: Sales Operations</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 dark:bg-black/20">
            {level1Count}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('LEVEL_2')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'LEVEL_2'
              ? 'bg-rose-600 text-white dark:bg-rose-500 dark:text-black'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <span>Level 2: Finance Escalations</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 dark:bg-black/20">
            {level2Count}
          </span>
        </button>
      </div>

      {/* Queue Listing */}
      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">All Clear! No Pending Approvals</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
            All enterprise quotations are within approved corporate discount and margin policies. No sign-offs are queued.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredApprovals.map((app) => {
            const quote = app.quotation;
            if (!quote) return null;

            const margin = Number(quote.marginPercentage || 0);
            const isFinanceLevel = app.level === 2;
            const tierLimit = Number((quote.customer as any)?.customerTier?.defaultDiscount || 15);
            const riskScore = Number(quote.riskScore || 0);

            // Compute highest applied discount across items
            const maxDiscount = Math.max(
              ...((quote.items || []).map((it) => Number(it.discountPercentage || 0))),
              0
            );
            const discountExcess = Math.max(0, maxDiscount - tierLimit);

            return (
              <div
                key={app.id}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
              >
                {/* Header Row: Quotation ID, Level Badge, Timing */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-3.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                      {quote.quotationNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                        isFinanceLevel
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60'
                      }`}
                    >
                      {isFinanceLevel ? 'Level 2: Finance Escalation' : 'Level 1: Sales Operations'}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                      Sales Rep: {quote.salesRep?.username || 'Rep assigned'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Submitted {new Date(app.requestedAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Deal Context Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-zinc-950/40 rounded-xl p-4 border border-slate-100 dark:border-zinc-800/60 text-xs">
                  {/* Customer context */}
                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block mb-1 font-medium">Customer Account</span>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{quote.customer?.companyName}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-[10px] font-semibold text-slate-700 dark:text-zinc-300">
                        {quote.customer?.customerTier?.name || 'Gold'} Tier
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                        Base: {tierLimit}% limit
                      </span>
                    </div>
                  </div>

                  {/* Deal Value */}
                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block mb-1 font-medium">Commercial Value</span>
                    <div className="font-bold text-base text-slate-900 dark:text-white font-mono">
                      ₹{Number(quote.totalAmount).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-mono font-medium">
                      -₹{Number(quote.discountAmount).toLocaleString('en-IN')} ({maxDiscount}% Max)
                    </span>
                  </div>

                  {/* Gross Margin */}
                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block mb-1 font-medium">Gross Margin</span>
                    <div
                      className={`font-bold text-base flex items-center gap-1 font-mono ${
                        margin < 20 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>{margin.toFixed(1)}%</span>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                      Corporate Floor: 20.0%
                    </span>
                  </div>

                  {/* Blended Risk Score */}
                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block mb-1 font-medium">Risk Assessment</span>
                    <div
                      className={`font-bold text-base flex items-center gap-1 font-mono ${
                        riskScore > 25
                          ? 'text-rose-600 dark:text-rose-400'
                          : riskScore > 10
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>BRS: {riskScore.toFixed(1)}%</span>
                    </div>
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      {discountExcess > 0 ? `+${discountExcess}% beyond tier` : 'Compliant'}
                    </span>
                  </div>
                </div>

                {/* Audit Context & Reason Banner */}
                {app.reason && (
                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
                    <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span className="font-bold">Escalation Trigger: </span>
                      <span>{app.reason}</span>
                    </div>
                  </div>
                )}

                {/* Line Items Detail Preview (Collapsible) */}
                <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => toggleCollapse(quote.id)}
                    className="w-full bg-slate-50 dark:bg-zinc-950/60 px-3.5 py-2.5 text-[11px] font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between hover:bg-slate-100/80 dark:hover:bg-zinc-900 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Products in Quotation ({quote.items?.length || 0})</span>
                      {quote.items?.some((it) => Number(it.discountPercentage || 0) > tierLimit) && (
                        <span className="ml-1 px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 text-[10px] lowercase font-semibold">
                          excess discount detected
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-normal">
                        {collapsedQuotes[quote.id] ? 'Show line breakdown' : 'Hide details'}
                      </span>
                      {collapsedQuotes[quote.id] ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </button>

                  {!collapsedQuotes[quote.id] && (
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800/60 max-h-56 overflow-y-auto animate-in fade-in duration-150">
                      {quote.items?.map((item) => {
                        const itemDisc = Number(item.discountPercentage || 0);
                        const isExcess = itemDisc > tierLimit;
                        const itemMargin = Number(item.marginPercentage || 0);

                        return (
                          <div
                            key={item.id}
                            className="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/40 dark:hover:bg-zinc-950/30"
                          >
                            <div className="min-w-0 pr-3">
                              <div className="font-semibold text-slate-900 dark:text-white truncate">
                                {item.product?.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                ₹{Number(item.unitPrice).toLocaleString('en-IN')} × {item.quantity} units
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-right">
                              <div>
                                <span
                                  className={`inline-block font-mono font-semibold px-2 py-0.5 rounded text-[11px] ${
                                    isExcess
                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                      : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                                  }`}
                                >
                                  {itemDisc}% Disc. {isExcess && `(+${itemDisc - tierLimit}% excess)`}
                                </span>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Margin: <strong className={itemMargin < 20 ? 'text-rose-500' : 'text-emerald-500'}>{itemMargin.toFixed(1)}%</strong>
                                </div>
                              </div>

                              <div className="font-mono font-bold text-slate-900 dark:text-white min-w-[90px]">
                                ₹{Number(item.lineTotal).toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <button
                    onClick={() => navigate(`/quotations/${quote.id}`)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Inspect Full Quotation Builder</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openDecisionModal(app, 'REJECT')}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 transition-colors cursor-pointer"
                    >
                      Reject Quotation
                    </button>
                    <button
                      onClick={() => openDecisionModal(app, 'APPROVE')}
                      className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Authorize Approval</span>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {decisionAction === 'APPROVE' ? 'Authorize Quotation Approval' : 'Reject Commercial Quotation'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Deal: {selectedApproval.quotation?.quotationNumber} • Account: {selectedApproval.quotation?.customer?.companyName}
                </p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  decisionAction === 'APPROVE'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                {decisionAction}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {decisionAction === 'APPROVE'
                ? 'Approving will instantly stamp compliance audit logs and transition the quotation to APPROVED, allowing the customer to confirm order fulfillment.'
                : 'Rejecting will notify the account executive and return the quotation to draft/revision status.'}
            </p>

            {/* Quick 1-Click Rationale Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Quick Compliance Presets
              </label>
              <div className="space-y-1.5">
                {(decisionAction === 'APPROVE' ? APPROVAL_PRESETS : REJECT_PRESETS).map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReason(p)}
                    className={`w-full text-left p-2 rounded-lg text-xs border transition-colors cursor-pointer ${
                      reason === p
                        ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-zinc-800 font-semibold text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    "{p}"
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Audit Rationale Note (Mandatory for SOX / Corporate Compliance)
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain commercial decision rationale..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedApproval(null)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reason.trim()}
                  className={`px-5 py-2 text-xs font-bold rounded-xl text-white transition-colors cursor-pointer disabled:opacity-50 ${
                    decisionAction === 'APPROVE'
                      ? 'bg-slate-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submitting ? 'Signing off...' : `Confirm ${decisionAction === 'APPROVE' ? 'Authorization' : 'Rejection'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
