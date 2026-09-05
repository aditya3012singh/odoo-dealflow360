import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Repeat,
  DollarSign,
  Receipt,
  FileCheck,
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { StatCardSkeleton, TableRowSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { billingService, type Invoice, type Subscription } from '../../services/billing.service';
import { approvalService } from '../../services/approval.service';
import type { Approval } from '../../types';

export function FinanceDashboard() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  // Decision Modal State
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [decisionAction, setDecisionAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [reason, setReason] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null);

  // Quick Payment Modal State
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [transactionRef, setTransactionRef] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [invData, subData, appData] = await Promise.all([
        billingService.listInvoices().catch(() => []),
        billingService.listSubscriptions().catch(() => []),
        approvalService.getPendingApprovals().catch(() => []),
      ]);
      setInvoices(invData);
      setSubscriptions(subData);
      // Filter approvals: Level 2 or role FINANCE, or high risk > 20
      const financeApprovals = appData.filter(
        (a) => a.level === 2 || a.approverRole === 'FINANCE' || Number(a.quotation?.riskScore || 0) > 20
      );
      setPendingApprovals(financeApprovals);
    } catch (err) {
      console.error('Failed to load finance dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Submit Level 2 Approval Decision
  const handleDecisionSubmit = async () => {
    if (!selectedApproval || !decisionAction) return;
    try {
      setSubmittingDecision(true);
      setDecisionError(null);
      await approvalService.processDecision(selectedApproval.id, {
        action: decisionAction,
        reason: reason.trim() || `Finance Level 2 sign-off recorded as ${decisionAction}`,
      });
      setDecisionSuccess(`Quotation ${decisionAction.toLowerCase()}d successfully.`);
      setSelectedApproval(null);
      setDecisionAction(null);
      setReason('');
      await fetchDashboardData();
      setTimeout(() => setDecisionSuccess(null), 4000);
    } catch (err: any) {
      console.error('Finance decision failed:', err);
      setDecisionError(err.response?.data?.message || 'Failed to process decision');
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Submit Quick Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;
    try {
      setSubmittingPayment(true);
      setPaymentError(null);
      await billingService.recordPayment(paymentInvoice.id, {
        amount: Number(paymentAmount),
        paymentMethod,
        transactionRef,
      });
      setPaymentInvoice(null);
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Quick payment failed:', err);
      setPaymentError(err.response?.data?.message || 'Payment recording failed. Please verify parameters.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Live KPI Calculations
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
  const totalOutstanding = Math.max(0, totalInvoiced - totalCollected);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 100;

  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)}Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)}L`;
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Finance & Billing Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Reconciliation ledger, hybrid billing streams, and Level 2 high-risk discount governance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg text-slate-600 dark:text-zinc-400 transition"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/billing')}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-3.5 py-2 rounded-lg text-xs font-medium transition shadow-sm"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Manage Invoices & Subscriptions
          </button>
        </div>
      </div>

      {decisionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{decisionSuccess}</span>
        </div>
      )}

      {/* Top Stat Cards */}
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
              title="Total Invoiced"
              value={formatCurrency(totalInvoiced)}
              subtitle={`${invoices.length} total invoices issued`}
              icon={<Receipt className="w-4 h-4 text-blue-500" />}
            />
            <StatCard
              title="Cash Collected"
              value={formatCurrency(totalCollected)}
              subtitle={`${collectionRate}% collection rate`}
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            />
            <StatCard
              title="Outstanding Balance"
              value={formatCurrency(totalOutstanding)}
              subtitle="Pending customer payment"
              icon={<Clock className="w-4 h-4 text-amber-500" />}
            />
            <StatCard
              title="Level 2 Approvals"
              value={pendingApprovals.length.toString()}
              subtitle="High-risk discount reviews"
              icon={<FileCheck className="w-4 h-4 text-purple-500" />}
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Ledger */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
                Recent Invoices & Receivables
              </h2>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                Physical orders and milestone invoices
              </p>
            </div>
            <button
              onClick={() => navigate('/billing')}
              className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-medium transition"
            >
              View all invoices <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/75 dark:bg-zinc-950/60 border-b border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-medium uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Total Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-slate-700 dark:text-zinc-300">
                {loading ? (
                  <>
                    <TableRowSkeleton columns={6} />
                    <TableRowSkeleton columns={6} />
                    <TableRowSkeleton columns={6} />
                  </>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400 dark:text-zinc-500">
                      No invoices recorded in the system yet.
                    </td>
                  </tr>
                ) : (
                  invoices.slice(0, 6).map((inv) => {
                    const isPaid = inv.status === 'PAID';
                    const remaining = Number(inv.totalAmount) - Number(inv.paidAmount || 0);

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition">
                        <td className="px-5 py-3 font-mono font-medium text-slate-900 dark:text-white">
                          {inv.invoiceNumber}
                          <div className="text-[10px] text-slate-400 font-normal">
                            Order: {inv.order?.orderNumber || 'Standard Order'}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-medium text-slate-800 dark:text-zinc-200">
                            {inv.order?.customer?.companyName || 'Corporate Client'}
                          </div>
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white font-mono">
                          ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                          {remaining > 0 && !isPaid && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                              Bal: ₹{remaining.toLocaleString('en-IN')}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={isPaid ? 'success' : inv.status === 'PARTIALLY_PAID' ? 'warning' : 'default'}>
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-slate-500 dark:text-zinc-400">
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {!isPaid ? (
                            <button
                              onClick={() => {
                                setPaymentInvoice(inv);
                                setPaymentAmount(remaining);
                                setTransactionRef(`TXN-${Date.now().toString().slice(-6)}`);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              Record Pay
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Settled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Level 2 High-Risk Finance Approval Queue */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-purple-500" />
                Level 2 Approval Queue
              </h2>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                Deals with Blended Risk Score &gt; 25
              </p>
            </div>
            <Badge variant="purple">{pendingApprovals.length} Pending</Badge>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/80" />
                No pending Level 2 approvals. All high-risk proposals are authorized!
              </div>
            ) : (
              pendingApprovals.map((a) => {
                const quote = a.quotation;
                const bRisk = Number(quote?.riskScore || 0);

                return (
                  <div
                    key={a.id}
                    className="p-3.5 border border-purple-100 dark:border-purple-950/50 bg-purple-50/40 dark:bg-purple-950/20 rounded-xl space-y-2 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                        {quote?.quotationNumber || 'Q-PROPOSAL'}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                        {bRisk.toFixed(1)} BRS
                      </span>
                    </div>

                    <div className="text-xs">
                      <div className="font-medium text-slate-800 dark:text-zinc-200">
                        {quote?.customer?.companyName || 'Corporate Client'}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Rep: {quote?.salesRep?.username || 'Sales Rep'}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono text-slate-600 dark:text-zinc-300 pt-1 border-t border-purple-100/80 dark:border-purple-900/40">
                      <span>Total: <b>₹{Number(quote?.totalAmount || 0).toLocaleString('en-IN')}</b></span>
                      <span>Margin: <b className="text-emerald-600 dark:text-emerald-400">{quote?.marginPercentage || 0}%</b></span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setSelectedApproval(a);
                          setDecisionAction('APPROVE');
                          setReason('Finance sign-off approved per strategic quarterly margin tolerance.');
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1 rounded-lg text-xs font-medium transition shadow-sm"
                      >
                        ✓ Authorize
                      </button>
                      <button
                        onClick={() => {
                          setSelectedApproval(a);
                          setDecisionAction('REJECT');
                          setReason('Discount exceeds allowable corporate margin threshold.');
                        }}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-1 rounded-lg text-xs font-medium transition shadow-sm"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Subscriptions Overview */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
              <Repeat className="w-4 h-4 text-blue-500" />
              Active Recurring Subscriptions (MRR / ARR)
            </h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
              Live software licenses and ongoing support contracts
            </p>
          </div>
          <button
            onClick={() => navigate('/billing')}
            className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-medium transition"
          >
            Manage Subscriptions <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <>
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </>
          ) : subscriptions.length === 0 ? (
            <div className="col-span-3 py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
              No active subscription lines yet. Subscriptions are initiated on order confirmation.
            </div>
          ) : (
            subscriptions.slice(0, 6).map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">
                    {sub.product?.name || sub.plan?.name || 'SaaS License'}
                  </span>
                  <Badge variant={sub.status === 'ACTIVE' ? 'success' : 'warning'}>
                    {sub.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {sub.customer?.companyName || 'Corporate Client'}
                </p>
                <div className="flex justify-between items-center text-xs font-mono pt-1 text-slate-600 dark:text-zinc-300">
                  <span>Rate: <b>₹{Number(sub.plan?.price || 0).toLocaleString('en-IN')}/{sub.plan?.billingInterval?.toLowerCase() || 'mo'}</b></span>
                  <span className="text-[11px] text-slate-400">Next: {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : 'Active'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Decision Modal */}
      {selectedApproval && decisionAction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                {decisionAction === 'APPROVE' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
                Finance {decisionAction === 'APPROVE' ? 'Authorize Quote' : 'Reject Quote'}
              </h3>
              <button
                onClick={() => {
                  setSelectedApproval(null);
                  setDecisionAction(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Quotation:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">
                  {selectedApproval.quotation?.quotationNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Total Value:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  ₹{Number(selectedApproval.quotation?.totalAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Blended Risk Score:</span>
                <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">
                  {selectedApproval.quotation?.riskScore || 0} BRS
                </span>
              </div>
            </div>

            {decisionError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{decisionError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Compliance & Financial Audit Rationale:
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter financial approval rationale..."
                rows={3}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={submittingDecision}
                onClick={() => {
                  setSelectedApproval(null);
                  setDecisionAction(null);
                }}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDecision}
                onClick={handleDecisionSubmit}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium text-white transition flex items-center gap-2 ${
                  decisionAction === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submittingDecision && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm {decisionAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handlePaymentSubmit}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                Record Payment
              </h3>
              <button
                type="button"
                onClick={() => setPaymentInvoice(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {paymentError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Invoice:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">{paymentInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Total Due:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">
                  ₹{Number(paymentInvoice.totalAmount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Payment Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                max={Number(paymentInvoice.totalAmount) - Number(paymentInvoice.paidAmount || 0)}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                required
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                  <option value="CREDIT_CARD">Corporate Card</option>
                  <option value="UPI">UPI Payment</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Transaction Ref
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UTR-982341"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentInvoice(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingPayment}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition flex items-center gap-1.5"
              >
                {submittingPayment && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Post Payment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
