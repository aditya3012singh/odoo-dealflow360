import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Clock,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Play,
  Check,
} from 'lucide-react';
import { intelligenceService, type DealAlert } from '../../services/intelligence.service';
import { CardSkeleton } from '../../components/ui/Skeleton';

export function DealHealthPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<DealAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await intelligenceService.listAlerts();
      setAlerts(data);
    } catch (err: any) {
      console.error('Failed to load deal alerts:', err);
      setError(err.response?.data?.message || 'Failed to fetch deal health alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleRunScan = async () => {
    try {
      setScanning(true);
      setError(null);
      const result = await intelligenceService.runHealthScan();
      setScanResult(
        `AI Scan finished: Found ${result.stalled} stalled deals, ${result.anomalies} discount anomalies, and ${result.slippage} delivery slippages.`
      );
      fetchAlerts();
      setTimeout(() => setScanResult(null), 5000);
    } catch (err: any) {
      console.error('Scan failed:', err);
      setError(err.response?.data?.message || 'Failed to run deal health scanner');
    } finally {
      setScanning(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await intelligenceService.acknowledgeAlert(id);
      fetchAlerts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to acknowledge alert');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await intelligenceService.resolveAlert(id);
      fetchAlerts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resolve alert');
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400">CRITICAL</span>;
      case 'WARNING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">WARNING</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400">INFO</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Deal Health & Anomaly Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Automated detection of stalled pipelines, excessive discount anomalies, and fulfillment slippage.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleRunScan}
            disabled={scanning}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-sm transition-colors"
          >
            {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run AI Health Scan
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {scanResult && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{scanResult}</span>
        </div>
      )}

      {/* Alerts Listing */}
      {loading ? (
        <div className="py-24 text-center text-slate-400 dark:text-zinc-500 flex flex-col items-center gap-3">
          <RefreshCw className="w-7 h-7 animate-spin" />
          <span className="text-sm">Scanning deal health indicators...</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Pipeline Health is Optimal</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
            No stalled quotations or discount anomalies detected. Run an AI scan at any time to re-evaluate active deals.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  {getSeverityBadge(alert.severity)}
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                    {alert.alertType.replace(/_/g, ' ')}
                  </span>
                  {alert.quotation && (
                    <span className="text-xs font-mono font-medium text-slate-900 dark:text-white">
                      Quote: {alert.quotation.quotationNumber}
                    </span>
                  )}
                </div>

                <span className="text-xs text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(alert.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-800 dark:text-zinc-200 font-medium">
                    {alert.message}
                  </p>
                  {alert.quotation?.customer && (
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                      Customer: {alert.quotation.customer.companyName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {alert.quotationId && (
                    <button
                      onClick={() => navigate(`/quotations/${alert.quotationId}`)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center gap-1"
                    >
                      <span>Open Deal</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {alert.status === 'OPEN' && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300"
                    >
                      Acknowledge
                    </button>
                  )}

                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Resolve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
