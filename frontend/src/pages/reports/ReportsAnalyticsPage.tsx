import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Clock,
  Download,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { StatCardSkeleton, TableRowSkeleton } from '../../components/ui/Skeleton';
import { quotationService } from '../../services/quotation.service';
import { approvalService } from '../../services/approval.service';
import type { Quotation, Approval } from '../../types';

export function ReportsAnalyticsPage() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'all' | '30d' | '7d'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [quotesData, appData] = await Promise.all([
        quotationService.getQuotations(),
        approvalService.getPendingApprovals().catch(() => []),
      ]);
      setQuotations(quotesData);
      setApprovals(appData);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter quotations by time range
  const timeFilteredQuotes = useMemo(() => {
    if (timeRange === 'all') return quotations;
    const now = new Date().getTime();
    const days = timeRange === '30d' ? 30 : 7;
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return quotations.filter((q) => new Date(q.createdAt).getTime() >= cutoff);
  }, [quotations, timeRange]);

  // Derived Analytics Metrics
  const totalVolume = useMemo(() => {
    return timeFilteredQuotes.reduce((sum, q) => sum + Number(q.totalAmount || 0), 0);
  }, [timeFilteredQuotes]);

  const convertedQuotes = useMemo(() => {
    return timeFilteredQuotes.filter((q) => q.status === 'CONVERTED_TO_ORDER');
  }, [timeFilteredQuotes]);

  const convertedVolume = useMemo(() => {
    return convertedQuotes.reduce((sum, q) => sum + Number(q.totalAmount || 0), 0);
  }, [convertedQuotes]);

  const avgMargin = useMemo(() => {
    if (timeFilteredQuotes.length === 0) return 0;
    const sumMargin = timeFilteredQuotes.reduce(
      (sum, q) => sum + Number(q.marginPercentage || 0),
      0
    );
    return (sumMargin / timeFilteredQuotes.length).toFixed(1);
  }, [timeFilteredQuotes]);

  // Compliance: Quotes with approvalLevel === 0 or no excessive discount
  const complianceRate = useMemo(() => {
    if (timeFilteredQuotes.length === 0) return 100;
    const compliantCount = timeFilteredQuotes.filter(
      (q) => (q.approvalLevel === 0 || !q.approvalLevel) && Number(q.riskScore || 0) < 15
    ).length;
    return Math.round((compliantCount / timeFilteredQuotes.length) * 100);
  }, [timeFilteredQuotes]);

  // Status Distribution
  const statusCounts = useMemo(() => {
    const counts: Record<string, { count: number; total: number }> = {
      DRAFT: { count: 0, total: 0 },
      PENDING_MANAGER: { count: 0, total: 0 },
      PENDING_FINANCE: { count: 0, total: 0 },
      APPROVED: { count: 0, total: 0 },
      CONVERTED_TO_ORDER: { count: 0, total: 0 },
      REJECTED: { count: 0, total: 0 },
    };
    timeFilteredQuotes.forEach((q) => {
      if (counts[q.status]) {
        counts[q.status].count += 1;
        counts[q.status].total += Number(q.totalAmount || 0);
      }
    });
    return counts;
  }, [timeFilteredQuotes]);

  // Risk Distribution
  const riskBreakdown = useMemo(() => {
    let low = 0;
    let moderate = 0;
    let high = 0;
    timeFilteredQuotes.forEach((q) => {
      const score = Number(q.riskScore || 0);
      if (score < 15) low++;
      else if (score <= 30) moderate++;
      else high++;
    });
    return { low, moderate, high };
  }, [timeFilteredQuotes]);

  // Filtered rows for table
  const filteredQuotations = useMemo(() => {
    return timeFilteredQuotes.filter((q) => {
      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'PENDING'
          ? q.status.startsWith('PENDING')
          : q.status === statusFilter;

      const qNum = (q.quotationNumber || '').toLowerCase();
      const cName = (q.customer?.name || '').toLowerCase();
      const repName = (q.salesRep?.username || '').toLowerCase();
      const s = searchQuery.toLowerCase();
      const matchesSearch = qNum.includes(s) || cName.includes(s) || repName.includes(s);

      return matchesStatus && matchesSearch;
    });
  }, [timeFilteredQuotes, statusFilter, searchQuery]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredQuotations.length === 0) return;
    const headers = [
      'Quotation Number',
      'Date',
      'Customer',
      'Sales Rep',
      'Status',
      'Total Amount',
      'Margin %',
      'Risk Score',
      'Approval Level',
    ];
    const rows = filteredQuotations.map((q) => [
      q.quotationNumber,
      new Date(q.createdAt).toLocaleDateString(),
      `"${q.customer?.name || ''}"`,
      `"${q.salesRep?.username || 'Unassigned'}"`,
      q.status,
      q.totalAmount,
      `${q.marginPercentage || 0}%`,
      q.riskScore || 0,
      q.approvalLevel || 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `DealFlow360_Governance_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Reports & Governance Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Real-time pipeline analysis, blended margin health, discount compliance, and approval metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-medium">
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                timeRange === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                timeRange === '30d'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                timeRange === '7d'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Last 7 Days
            </button>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg text-slate-600 dark:text-zinc-400 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

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
              title="Total Pipeline Volume"
              value={formatCurrency(totalVolume)}
              subtitle={`${timeFilteredQuotes.length} quotes generated`}
              icon={<BarChart3 className="w-4 h-4 text-blue-500" />}
            />
            <StatCard
              title="Converted Revenue"
              value={formatCurrency(convertedVolume)}
              subtitle={`${convertedQuotes.length} orders booked`}
              icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
            />
            <StatCard
              title="Average Blended Margin"
              value={`${avgMargin}%`}
              subtitle="Target policy: ≥ 25%"
              icon={<ShieldCheck className="w-4 h-4 text-violet-500" />}
            />
            <StatCard
              title="Discount Compliance Rate"
              value={`${complianceRate}%`}
              subtitle={`${approvals.length} pending reviews`}
              icon={<Clock className="w-4 h-4 text-amber-500" />}
            />
          </>
        )}
      </div>

      {/* Governance & Pipeline Visual Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Pipeline Status Distribution */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Quotation Pipeline Distribution
              </h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">
                Breakdown of active deals across approval and order conversion stages
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              {timeFilteredQuotes.length} Total Deals
            </span>
          </div>

          {/* Proportional Segment Bar */}
          {timeFilteredQuotes.length > 0 ? (
            <div className="w-full h-3 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${(statusCounts.CONVERTED_TO_ORDER.count / timeFilteredQuotes.length) * 100}%`,
                }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Converted: ${statusCounts.CONVERTED_TO_ORDER.count}`}
              />
              <div
                style={{
                  width: `${(statusCounts.APPROVED.count / timeFilteredQuotes.length) * 100}%`,
                }}
                className="bg-blue-500 transition-all duration-500"
                title={`Approved: ${statusCounts.APPROVED.count}`}
              />
              <div
                style={{
                  width: `${
                    ((statusCounts.PENDING_MANAGER.count + statusCounts.PENDING_FINANCE.count) /
                      timeFilteredQuotes.length) *
                    100
                  }%`,
                }}
                className="bg-amber-500 transition-all duration-500"
                title={`Pending Approval: ${
                  statusCounts.PENDING_MANAGER.count + statusCounts.PENDING_FINANCE.count
                }`}
              />
              <div
                style={{
                  width: `${(statusCounts.DRAFT.count / timeFilteredQuotes.length) * 100}%`,
                }}
                className="bg-slate-400 dark:bg-zinc-600 transition-all duration-500"
                title={`Draft: ${statusCounts.DRAFT.count}`}
              />
              <div
                style={{
                  width: `${(statusCounts.REJECTED.count / timeFilteredQuotes.length) * 100}%`,
                }}
                className="bg-rose-500 transition-all duration-500"
                title={`Rejected: ${statusCounts.REJECTED.count}`}
              />
            </div>
          ) : (
            <div className="w-full h-3 bg-slate-100 dark:bg-zinc-800 rounded-full" />
          )}

          {/* Status Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-lg border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Converted Orders
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {statusCounts.CONVERTED_TO_ORDER.count}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                {formatCurrency(statusCounts.CONVERTED_TO_ORDER.total)}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Approved Quotes
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {statusCounts.APPROVED.count}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                {formatCurrency(statusCounts.APPROVED.total)}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                In Approval Flow
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {statusCounts.PENDING_MANAGER.count + statusCounts.PENDING_FINANCE.count}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                {formatCurrency(
                  statusCounts.PENDING_MANAGER.total + statusCounts.PENDING_FINANCE.total
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Draft Quotes
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {statusCounts.DRAFT.count}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                {formatCurrency(statusCounts.DRAFT.total)}
              </div>
            </div>
          </div>
        </div>

        {/* Blended Risk Score (BRS) Governance Breakdown */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Risk Profile Distribution
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500">
              Deal distribution across Blended Risk Score bands
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Low Risk (&lt; 15 BRS)
                </span>
                <span className="text-slate-700 dark:text-zinc-300">
                  {riskBreakdown.low} deals
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${
                      timeFilteredQuotes.length > 0
                        ? (riskBreakdown.low / timeFilteredQuotes.length) * 100
                        : 0
                    }%`,
                  }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Moderate Risk (15 - 30 BRS)
                </span>
                <span className="text-slate-700 dark:text-zinc-300">
                  {riskBreakdown.moderate} deals
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${
                      timeFilteredQuotes.length > 0
                        ? (riskBreakdown.moderate / timeFilteredQuotes.length) * 100
                        : 0
                    }%`,
                  }}
                  className="h-full bg-amber-500 rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  High Risk (&gt; 30 BRS)
                </span>
                <span className="text-slate-700 dark:text-zinc-300">
                  {riskBreakdown.high} deals
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${
                      timeFilteredQuotes.length > 0
                        ? (riskBreakdown.high / timeFilteredQuotes.length) * 100
                        : 0
                    }%`,
                  }}
                  className="h-full bg-rose-500 rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-zinc-400">
            <span className="font-medium text-slate-900 dark:text-zinc-200">Governance Policy:</span> Deals with BRS &gt; 15 require Level 1 Sales Manager sign-off; deals with BRS &gt; 30 or margin &lt; 15% require Level 2 Finance sign-off.
          </div>
        </div>
      </div>

      {/* Quotation Detail Analytics Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {['ALL', 'PENDING', 'APPROVED', 'CONVERTED_TO_ORDER', 'DRAFT', 'REJECTED'].map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-zinc-900'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {st === 'ALL'
                    ? 'All Deals'
                    : st === 'PENDING'
                    ? 'Pending Approval'
                    : st === 'CONVERTED_TO_ORDER'
                    ? 'Converted'
                    : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              )
            )}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search quote, rep, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-600"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 dark:bg-zinc-950/60 border-b border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-medium uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Quote #</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Sales Rep</th>
                <th className="px-5 py-3">Total Amount</th>
                <th className="px-5 py-3">Margin %</th>
                <th className="px-5 py-3">BRS Score</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-slate-700 dark:text-zinc-300">
              {loading ? (
                <>
                  <TableRowSkeleton columns={8} />
                  <TableRowSkeleton columns={8} />
                  <TableRowSkeleton columns={8} />
                  <TableRowSkeleton columns={8} />
                </>
              ) : filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400 dark:text-zinc-500">
                    <SlidersHorizontal className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No quotations found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => {
                  const bRisk = Number(q.riskScore || 0);
                  const margin = Number(q.marginPercentage || 0);

                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                        {q.quotationNumber}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-800 dark:text-zinc-200">
                          {q.customer?.name || 'Unknown'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {q.customer?.companyName || ''}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-zinc-400">
                        {q.salesRep?.username || 'Unassigned'}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(Number(q.totalAmount || 0))}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`font-medium ${
                            margin < 15
                              ? 'text-rose-600 dark:text-rose-400'
                              : margin < 25
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {margin}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            bRisk > 30
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                              : bRisk > 15
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                          }`}
                        >
                          {bRisk} BRS
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={
                            q.status === 'CONVERTED_TO_ORDER' || q.status === 'APPROVED'
                              ? 'success'
                              : q.status.startsWith('PENDING')
                              ? 'warning'
                              : q.status === 'REJECTED'
                              ? 'danger'
                              : 'default'
                          }
                        >
                          {q.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => navigate(`/quotations/${q.id}`)}
                          className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
                        >
                          View
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
