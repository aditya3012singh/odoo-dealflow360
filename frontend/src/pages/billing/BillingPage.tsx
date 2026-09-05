import { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertTriangle,
  Receipt,
  Repeat,
  Calculator,
  Search,
  ArrowRight,
  PauseCircle,
  PlayCircle,
  XCircle,
} from 'lucide-react';
import {
  billingService,
  type Invoice,
  type Subscription,
  type ProrationResult,
} from '../../services/billing.service';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { CardSkeleton, StatCardSkeleton } from '../../components/ui/Skeleton';

export function BillingPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'subscriptions' | 'proration'>('invoices');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment modal state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Subscription status updating
  const [updatingSubId, setUpdatingSubId] = useState<string | null>(null);

  // Proration Calculator state
  const [calcCurrentPrice, setCalcCurrentPrice] = useState<number>(5000);
  const [calcNewPrice, setCalcNewPrice] = useState<number>(12000);
  const [calcDaysRemaining, setCalcDaysRemaining] = useState<number>(18);
  const [calcDaysInMonth, setCalcDaysInMonth] = useState<number>(30);
  const [prorationResult, setProrationResult] = useState<ProrationResult | null>(null);
  const [calculatingProration, setCalculatingProration] = useState(false);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [invData, subData] = await Promise.all([
        billingService.listInvoices().catch(() => []),
        billingService.listSubscriptions().catch(() => []),
      ]);
      setInvoices(invData);
      setSubscriptions(subData);
    } catch (err: any) {
      console.error('Failed to load billing data:', err);
      setError(err.response?.data?.message || 'Failed to fetch billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const openPaymentModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    const remaining = Number(inv.totalAmount) - Number(inv.paidAmount || 0);
    setPaymentAmount(remaining);
    setTransactionRef(`TXN-${Date.now().toString().slice(-6)}`);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      setSubmittingPayment(true);
      setError(null);
      await billingService.recordPayment(selectedInvoice.id, {
        amount: Number(paymentAmount),
        paymentMethod,
        transactionRef,
      });
      setSuccessMsg(
        `Payment of ₹${Number(paymentAmount).toLocaleString('en-IN')} recorded successfully!`
      );
      setSelectedInvoice(null);
      await fetchBillingData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Payment failed:', err);
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleUpdateSubscription = async (id: string, status: string) => {
    try {
      setUpdatingSubId(id);
      await billingService.updateSubscriptionStatus(id, status);
      setSuccessMsg(`Subscription status updated to ${status}.`);
      await fetchBillingData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update subscription status');
    } finally {
      setUpdatingSubId(null);
    }
  };

  const handleCalculateProration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCalculatingProration(true);
      const res = await billingService.calculateProration({
        currentPrice: calcCurrentPrice,
        newPrice: calcNewPrice,
        daysRemaining: calcDaysRemaining,
        daysInMonth: calcDaysInMonth,
      });
      setProrationResult(res);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to calculate proration');
    } finally {
      setCalculatingProration(false);
    }
  };

  // KPI calculations
  const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
  const totalOutstanding = Math.max(0, totalBilled - totalCollected);
  const activeSubsCount = subscriptions.filter((s) => s.status === 'ACTIVE').length;

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesStatus =
        invoiceStatusFilter === 'ALL' ? true : inv.status === invoiceStatusFilter;
      const invNum = (inv.invoiceNumber || '').toLowerCase();
      const cName = (inv.order?.customer?.companyName || '').toLowerCase();
      const s = searchQuery.toLowerCase();
      return matchesStatus && (invNum.includes(s) || cName.includes(s));
    });
  }, [invoices, invoiceStatusFilter, searchQuery]);

  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)}Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)}L`;
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Hybrid Billing & Invoices
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Reconcile one-time hardware invoices, recurring SaaS schedules, and contract prorations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBillingData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

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

      {/* KPI Metric Cards */}
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
              title="Total Billed"
              value={formatCurrency(totalBilled)}
              subtitle={`${invoices.length} invoices generated`}
              icon={<Receipt className="w-4 h-4 text-blue-500" />}
            />
            <StatCard
              title="Cash Collected"
              value={formatCurrency(totalCollected)}
              subtitle={`${totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100}% collection rate`}
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            />
            <StatCard
              title="Outstanding Balance"
              value={formatCurrency(totalOutstanding)}
              subtitle="Pending customer payment"
              icon={<Clock className="w-4 h-4 text-amber-500" />}
            />
            <StatCard
              title="Active Subscriptions"
              value={activeSubsCount.toString()}
              subtitle={`${subscriptions.length} total SaaS contracts`}
              icon={<Repeat className="w-4 h-4 text-purple-500" />}
            />
          </>
        )}
      </div>

      {/* Multi-Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-zinc-800 flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'invoices'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Invoices & Receivables ({invoices.length})
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'subscriptions'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <Repeat className="w-4 h-4" />
          Recurring Subscriptions ({subscriptions.length})
        </button>

        <button
          onClick={() => setActiveTab('proration')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'proration'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Contract Proration Calculator
        </button>
      </div>

      {/* TAB 1: INVOICES & RECEIVABLES */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {['ALL', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setInvoiceStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    invoiceStatusFilter === st
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-zinc-900'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {st === 'ALL' ? 'All Invoices' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice # or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-600"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-12 text-center">
              <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                No invoices found
              </h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                No invoices matching the current filter criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((inv) => {
                const isPaid = inv.status === 'PAID';
                const remaining = Number(inv.totalAmount) - Number(inv.paidAmount || 0);

                return (
                  <div
                    key={inv.id}
                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                          {inv.invoiceNumber}
                        </span>
                        <Badge
                          variant={
                            isPaid ? 'success' : inv.status === 'PARTIALLY_PAID' ? 'warning' : 'default'
                          }
                        >
                          {inv.status}
                        </Badge>
                        <span className="text-xs text-slate-500 dark:text-zinc-400">
                          Order: {inv.order?.orderNumber || 'ORD-DIRECT'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 dark:text-zinc-500 block mb-1">Customer</span>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {inv.order?.customer?.companyName || 'Corporate Client'}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 dark:text-zinc-500 block mb-1">Total Due</span>
                        <div className="font-semibold text-sm text-slate-900 dark:text-white font-mono">
                          ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-400">Includes GST</span>
                      </div>

                      <div>
                        <span className="text-slate-400 dark:text-zinc-500 block mb-1">Paid Amount</span>
                        <div className="font-semibold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                          ₹{Number(inv.paidAmount || 0).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 dark:text-zinc-500 block mb-1">Outstanding Balance</span>
                        <div
                          className={`font-semibold text-sm font-mono ${
                            remaining > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                          }`}
                        >
                          ₹{remaining.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Line Items */}
                    {inv.items && inv.items.length > 0 && (
                      <div className="bg-slate-50 dark:bg-zinc-950/40 rounded-lg p-3 text-xs space-y-1 border border-slate-100 dark:border-zinc-800/60">
                        <div className="font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                          Billed Items:
                        </div>
                        {inv.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-slate-600 dark:text-zinc-300">
                            <span>{item.description} (x{item.quantity})</span>
                            <span className="font-mono font-medium">₹{Number(item.lineTotal).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    {!isPaid && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => openPaymentModal(inv)}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Record Payment
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RECURRING SUBSCRIPTIONS */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
                Active Customer SaaS Contracts
              </h2>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                Automated recurring intervals (Monthly, Quarterly, Annual) generated from hybrid quotes
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              {subscriptions.length} Subscriptions Total
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-12 text-center">
              <Repeat className="w-8 h-8 text-slate-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                No active subscriptions
              </h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 max-w-md mx-auto">
                Subscriptions are created automatically when quotes containing recurring products are converted into orders.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscriptions.map((sub) => {
                const isActive = sub.status === 'ACTIVE';
                const isPaused = sub.status === 'PAUSED';

                return (
                  <div
                    key={sub.id}
                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {sub.product?.name || sub.plan?.name || 'SaaS Subscription'}
                        </span>
                        <Badge variant={isActive ? 'success' : isPaused ? 'warning' : 'danger'}>
                          {sub.status}
                        </Badge>
                      </div>

                      <div className="text-xs space-y-1 text-slate-600 dark:text-zinc-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400 dark:text-zinc-500">Customer:</span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {sub.customer?.companyName || sub.customer?.name || 'Client Account'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 dark:text-zinc-500">Plan:</span>
                          <span className="font-medium">
                            {sub.plan?.name || 'Standard Tier'} ({sub.plan?.billingInterval || 'MONTHLY'})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 dark:text-zinc-500">Rate:</span>
                          <span className="font-mono font-semibold text-slate-900 dark:text-white">
                            ₹{Number(sub.plan?.price || 0).toLocaleString('en-IN')}/{sub.plan?.billingInterval?.toLowerCase() || 'mo'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 dark:text-zinc-500">Next Billing Date:</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">
                            {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Billing Schedules */}
                      {sub.billingSchedules && sub.billingSchedules.length > 0 && (
                        <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-lg border border-slate-100 dark:border-zinc-800 text-[11px] space-y-1">
                          <span className="text-slate-500 dark:text-zinc-400 font-medium block">
                            Upcoming Scheduled Runs:
                          </span>
                          {sub.billingSchedules.slice(0, 3).map((sch) => (
                            <div key={sch.id} className="flex justify-between text-slate-600 dark:text-zinc-400">
                              <span>Cycle #{sch.periodNumber} • {new Date(sch.billingDate).toLocaleDateString()}</span>
                              <span className="font-mono font-medium text-slate-800 dark:text-zinc-200">
                                ₹{Number(sch.amount).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Status Management Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-end gap-2">
                      {isActive ? (
                        <button
                          disabled={updatingSubId === sub.id}
                          onClick={() => handleUpdateSubscription(sub.id, 'PAUSED')}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-400 transition flex items-center gap-1.5"
                        >
                          <PauseCircle className="w-3.5 h-3.5" />
                          Pause Subscription
                        </button>
                      ) : isPaused ? (
                        <button
                          disabled={updatingSubId === sub.id}
                          onClick={() => handleUpdateSubscription(sub.id, 'ACTIVE')}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 transition flex items-center gap-1.5"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          Resume Subscription
                        </button>
                      ) : null}

                      {sub.status !== 'CANCELLED' && (
                        <button
                          disabled={updatingSubId === sub.id}
                          onClick={() => handleUpdateSubscription(sub.id, 'CANCELLED')}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-700 dark:text-rose-400 transition flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PRORATION CALCULATOR */}
      {activeTab === 'proration' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleCalculateProration}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-4"
          >
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-purple-500" />
                Contract Proration Engine
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Calculate mid-cycle plan upgrades, downgrades, and contract term balance credits per policy.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Current Monthly Rate (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={calcCurrentPrice}
                  onChange={(e) => setCalcCurrentPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  New Monthly Rate (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={calcNewPrice}
                  onChange={(e) => setCalcNewPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Days Remaining in Cycle
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={calcDaysRemaining}
                  onChange={(e) => setCalcDaysRemaining(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Days in Month Cycle
                </label>
                <input
                  type="number"
                  min="28"
                  max="31"
                  value={calcDaysInMonth}
                  onChange={(e) => setCalcDaysInMonth(parseInt(e.target.value) || 30)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={calculatingProration}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 shadow-sm"
              >
                {calculatingProration && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Compute Proration Breakdown
              </button>
            </div>
          </form>

          {/* Results Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                Proration Calculation Result
              </h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">
                Formula: (New Daily Rate × Days Remaining) − (Unused Current Rate Credit)
              </p>

              {prorationResult ? (
                <div className="mt-4 space-y-3">
                  <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">Unused Credit from Current Plan:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        −₹{Number(prorationResult.unusedCurrentCredit).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">Prorated Charge for New Plan:</span>
                      <span className="font-mono text-slate-900 dark:text-white font-medium">
                        +₹{Number(prorationResult.proratedNewCharge).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="border-t border-slate-200 dark:border-zinc-800 pt-2 flex justify-between text-sm font-semibold">
                      <span className="text-slate-900 dark:text-white">
                        {prorationResult.isCredit ? 'Credit to Customer:' : 'Net Due Today:'}
                      </span>
                      <span
                        className={`font-mono ${
                          prorationResult.isCredit
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-purple-600 dark:text-purple-400'
                        }`}
                      >
                        ₹{Number(prorationResult.netAdjustment).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 rounded-lg text-xs text-purple-800 dark:text-purple-300">
                    💡 This adjustment can be appended to the next subscription billing run or invoiced immediately as a milestone item.
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500">
                  Enter contract parameters and click &quot;Compute Proration Breakdown&quot; to inspect adjustment amounts.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleRecordPayment}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                Record Customer Payment
              </h3>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Invoice:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">
                  {selectedInvoice.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Remaining Balance:</span>
                <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                  ₹{(Number(selectedInvoice.totalAmount) - Number(selectedInvoice.paidAmount || 0)).toLocaleString('en-IN')}
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
                max={Number(selectedInvoice.totalAmount) - Number(selectedInvoice.paidAmount || 0)}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white"
                required
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
                  Transaction Ref / UTR
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UTR-829103"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingPayment}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm"
              >
                {submittingPayment && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm Payment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
