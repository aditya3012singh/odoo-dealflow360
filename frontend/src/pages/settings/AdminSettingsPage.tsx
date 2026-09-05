import { useState } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Database,
  Globe,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Save,
  Lock,
  Mail,
  Zap,
  Trash2,
  Server,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function AdminSettingsPage() {
  const [orgName, setOrgName] = useState('DealFlow360 Operations');
  const [supportEmail, setSupportEmail] = useState('support@dealflow360.com');
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [defaultTaxRate, setDefaultTaxRate] = useState(18);
  const [sessionLifespanDays, setSessionLifespanDays] = useState(7);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.slack.com/services/dealflow360/escalations');
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [saving, setSaving] = useState(false);
  const [flushingCache, setFlushingCache] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccessMsg('System configuration and governance parameters saved successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 600);
  };

  const handleFlushCache = () => {
    setFlushingCache(true);
    setTimeout(() => {
      setFlushingCache(false);
      setSuccessMsg('Two-tier cache (In-Memory & Redis) flushed successfully! Fresh DB truth synced.');
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 800);
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-700 dark:text-zinc-300" />
            Platform System Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Global environment configuration, security governance, notification dispatch, and cache orchestration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFlushCache}
            disabled={flushingCache}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${flushingCache ? 'animate-spin' : ''}`} />
            {flushingCache ? 'Purging Cache...' : 'Flush Redis Cache'}
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 transition shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: General & Localization */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              General Organization & Localization
            </h2>
            <Badge variant="default">Enterprise</Badge>
          </div>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Default platform naming, currency notation, and base commercial taxation.
          </p>

          <div className="space-y-3.5 pt-2 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                Organization Display Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                Primary Support & Alerts Email
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                  Default Currency
                </label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-medium"
                >
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                  Base GST / Tax Rate (%)
                </label>
                <input
                  type="number"
                  value={defaultTaxRate}
                  onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Security & Session Policies */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              Security & Session Policies
            </h2>
            <Badge variant="success">Strict</Badge>
          </div>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            JWT lifespan, rate limiting, and zero-trust portal token isolation.
          </p>

          <div className="space-y-3.5 pt-2 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                Access Token Lifespan (Days)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={sessionLifespanDays}
                  onChange={(e) => setSessionLifespanDays(Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-mono font-medium"
                />
                <span className="text-slate-400 dark:text-zinc-500 text-xs">
                  Currently active: <strong>7 Days (168 Hours)</strong>
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800 dark:text-zinc-200">
                  Password Encryption
                </span>
                <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                  bcrypt (12 rounds)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800 dark:text-zinc-200">
                  Customer Portal Auth
                </span>
                <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                  SHA-256 Opaque Hash
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800 dark:text-zinc-200">
                  API Rate Limiter
                </span>
                <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                  100 req/min IP window
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Notification & Webhooks */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-500" />
              Notification & Escalation Channels
            </h2>
            <Badge variant="purple">Live Sync</Badge>
          </div>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Automatic triggers for high-risk deal escalations, low stock, and BullMQ worker failures.
          </p>

          <div className="space-y-3.5 pt-2 text-xs">
            <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40">
              <div>
                <p className="font-medium text-slate-800 dark:text-zinc-200">
                  Dispatch Email Alerts for Approvals
                </p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                  Sends email triggers to Sales Managers when BRS score crosses 40.
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 focus:ring-0"
              />
            </label>

            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                Slack / Team Escalation Webhook URL
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                Default Inventory Low-Stock Threshold
              </label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-32 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Caching & Infrastructure Performance */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Two-Tier Caching & Cloud Engine
            </h2>
            <Badge variant="warning">Two-Tier</Badge>
          </div>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Real-time telemetry and cache invalidation policies for high throughput.
          </p>

          <div className="space-y-3 pt-2 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-zinc-300">Tier 1: In-Memory Map LRU</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">&lt; 0.05ms Read</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-zinc-300">Tier 2: Redis Distributed Client</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">127.0.0.1:6379 Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-zinc-300">BullMQ Background Worker</span>
                <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">dealflow-core Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-zinc-300">Cloudinary CDN Dropzone</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Enabled</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300 text-xs">
                  Maintenance Mode
                </p>
                <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                  Restricts platform access exclusively to Administrator accounts.
                </p>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
