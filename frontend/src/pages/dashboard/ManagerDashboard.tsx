import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  Users,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { StatCardSkeleton, TableRowSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { useAppSelector } from '../../store/hooks';
import { approvalService } from '../../services/approval.service';
import { quotationService } from '../../services/quotation.service';
import { intelligenceService, type DealAlert } from '../../services/intelligence.service';
import type { Approval, Quotation } from '../../types';

export function ManagerDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();

  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [alerts, setAlerts] = useState<DealAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Decision Modal State
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [decisionAction, setDecisionAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [appData, qData, alertData] = await Promise.all([
        approvalService.getPendingApprovals(),
        quotationService.getQuotations(),
        intelligenceService.listAlerts().catch(() => []),
      ]);
      setPendingApprovals(appData);
      setQuotations(qData);
      setAlerts(alertData);
    } catch (err) {
      console.error('Failed to load manager dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleDecisionSubmit = async () => {
    if (!selectedApproval || !decisionAction) return;
    try {
      setSubmitting(true);
      setErrorMsg(null);
      await approvalService.processDecision(selectedApproval.id, {
        action: decisionAction,
        reason: reason || `Manager decision recorded as ${decisionAction}`,
      });
      setSelectedApproval(null);
      setDecisionAction(null);
      setReason('');
      await loadDashboardData();
    } catch (err: any) {
      console.error('Failed to record decision:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to process decision');
    } finally {
      setSubmitting(false);
    }
  };

  // Live metrics
  const totalTeamQuotations = quotations.length;
  const totalPendingCount = pendingApprovals.length;

  const totalTeamRevenue = quotations
    .filter((q) => q.status === 'APPROVED' || q.status === 'CONVERTED_TO_ORDER')
    .reduce((acc, q) => acc + Number(q.totalAmount || 0), 0);

  const formattedRevenue =
    totalTeamRevenue >= 100000
      ? `₹${(totalTeamRevenue / 100000).toFixed(1)}L`
      : `₹${totalTeamRevenue.toLocaleString('en-IN')}`;

  const avgTeamMargin =
    quotations.length > 0
      ? (
          quotations.reduce(
            (acc, q) => acc + Number(q.blendedMarginPercentage || 0),
            0
          ) / quotations.length
        ).toFixed(1)
      : '0.0';

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Manager Governance Console 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Discount override requests, BRS compliance, and team deal health
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors"
            title="Refresh console"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/approvals')}
            className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-zinc-200 text-white dark:text-black px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Open Approval Queue ({pendingApprovals.length})
          </button>
        </div>
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
              title="Pending Approvals"
              value={totalPendingCount.toString()}
              subtitle="Level 1 & 2 override requests"
              icon={<CheckSquare className="w-4 h-4" />}
            />
            <StatCard
              title="Team Quotations"
              value={totalTeamQuotations.toString()}
              subtitle="Total proposals created"
              icon={<Clock className="w-4 h-4" />}
            />
            <StatCard
              title="Avg Team Margin"
              value={`${avgTeamMargin}%`}
              subtitle="Blended margin health"
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <StatCard
              title="Approved Pipeline"
              value={formattedRevenue}
              subtitle="Ready for fulfillment"
              icon={<Users className="w-4 h-4" />}
            />
          </>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals Queue */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
                Pending Approval Requests
              </h2>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                Quotes requiring manager sign-off due to category discount ceilings
              </p>
            </div>
            <button
              onClick={() => navigate('/approvals')}
              className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-medium transition"
            >
              Manage Queue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
            {loading ? (
              <div className="p-5 space-y-3">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                🎉 All approval queues are clear! No pending requests.
              </div>
            ) : (
              pendingApprovals.map((a) => {
                const quote = a.quotation;
                const riskScore = Number(quote?.riskScore || 0);
                return (
                  <div
                    key={a.id}
                    className="p-5 hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                            {quote?.quotationNumber}
                          </span>
                          <span className="text-slate-300 dark:text-zinc-700">•</span>
                          <span className="text-xs text-slate-500 dark:text-zinc-400">
                            Rep: {quote?.salesRep?.username || 'Sales Rep'}
                          </span>
                          <Badge variant={a.level === 1 ? 'warning' : 'purple'}>
                            Level {a.level} Approval
                          </Badge>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                          {quote?.customer?.companyName || 'Standard Account'}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-zinc-400 font-mono">
                          <span>
                            Total: <b className="text-slate-900 dark:text-white">₹{Number(quote?.totalAmount || 0).toLocaleString('en-IN')}</b>
                          </span>
                          <span>
                            BRS Risk:{' '}
                            <b className={riskScore > 20 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}>
                              {riskScore.toFixed(1)}%
                            </b>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        <button
                          onClick={() => {
                            setSelectedApproval(a);
                            setDecisionAction('APPROVE');
                            setReason('');
                          }}
                          className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedApproval(a);
                            setDecisionAction('REJECT');
                            setReason('');
                          }}
                          className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Deal Alerts & Health */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm transition-colors p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
                Deal Anomalies
              </h2>
            </div>
            <button
              onClick={() => navigate('/deal-health')}
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 font-medium transition"
            >
              Scan Details <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Real-time margin erosion, stalled deals, and discount variance alerts.
          </p>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 dark:text-zinc-500">
              No critical deal anomalies detected across active proposals.
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 3).map((alt) => (
                <div
                  key={alt.id}
                  className={`p-3.5 rounded-lg border text-xs space-y-1.5 transition ${
                    alt.severity === 'CRITICAL'
                      ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/30'
                      : 'border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={alt.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                      {alt.alertType.replace('_', ' ')}
                    </Badge>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                      {alt.quotation?.quotationNumber || 'Deal Alert'}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {alt.quotation?.customer?.companyName || 'B2B Client'}
                  </p>
                  <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">
                    {alt.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Approval Decision Modal */}
      {selectedApproval && decisionAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-full ${
                  decisionAction === 'APPROVE'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                }`}
              >
                {decisionAction === 'APPROVE' ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {decisionAction === 'APPROVE' ? 'Approve Quotation' : 'Reject Quotation'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                  {selectedApproval.quotation?.quotationNumber} •{' '}
                  {selectedApproval.quotation?.customer?.companyName}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Decision Rationale / Comment
              </label>
              <textarea
                rows={3}
                placeholder={
                  decisionAction === 'APPROVE'
                    ? 'Enter approval sign-off rationale or margin waiver note...'
                    : 'Enter rejection reason for the sales representative...'
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => {
                  setSelectedApproval(null);
                  setDecisionAction(null);
                }}
                disabled={submitting}
                className="px-4 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDecisionSubmit}
                disabled={submitting}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white shadow-sm transition-colors ${
                  decisionAction === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Confirm Decision'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
