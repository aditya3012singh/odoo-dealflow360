import { useState, useEffect } from 'react';
import {
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  MapPin,
  CreditCard,
  UserCheck,
  Edit3,
  Check,
  X,
  Clock,
  Sparkles,
  ExternalLink,
  DollarSign,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { ProfileSkeleton } from '../../components/ui/Skeleton';
import { portalService } from '../../services/portal.service';

function formatINR(val: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function PortalProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    companyName: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);
      const data = await portalService.getProfile();
      setProfile(data);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        companyName: data.companyName || '',
      });
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(err?.response?.data?.message || 'Could not fetch profile details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await portalService.updateProfile(formData);
      setSaveSuccess('Profile contact details updated successfully.');
      setIsEditing(false);
      await loadProfile();
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-4 shadow-sm">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{error || 'Unable to display profile'}</p>
        <button
          onClick={loadProfile}
          className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-black rounded-lg text-xs font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  const initials = profile.companyName
    ? profile.companyName
        .split(' ')
        .map((w: string) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'DF';

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
          <button onClick={() => setSaveSuccess(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Profile Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-colors shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 dark:from-zinc-100 dark:to-zinc-300 flex items-center justify-center text-white dark:text-black font-bold text-xl tracking-wider shadow-md shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {profile.companyName}
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-black">
                {profile.tier?.name || 'Gold'} Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2">
              <span>Client Account ID: <strong className="font-mono text-slate-700 dark:text-zinc-300">{profile.id.slice(0, 8)}</strong></span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Verified Enterprise Partner ✓</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition cursor-pointer self-start sm:self-auto"
        >
          {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
          <span>{isEditing ? 'Cancel Editing' : 'Edit Contact Info'}</span>
        </button>
      </div>

      {/* KPI Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 transition-colors shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Enterprise Direct Spend</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {formatINR(profile.stats?.totalSpent || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Across all confirmed commercial purchases</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 transition-colors shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Active Commercial Deals</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {profile.stats?.activeQuotations || 0} Deals
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Under margin review or ready to confirm</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 transition-colors shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Orders & Deliveries</span>
            <FileText className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {profile.stats?.totalOrders || 0} Orders
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Processed through automated logistics</p>
        </div>
      </div>

      {/* Edit Form Modal Drawer if active */}
      {isEditing && (
        <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Update Company & Contact Information
            </h3>
            <span className="text-xs text-slate-400">Changes apply to future invoices and quotes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Company Legal Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Primary Contact Person
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Direct Contact Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-black rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? 'Saving changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Enterprise Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Details */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              Corporate Account Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 space-y-1">
                <span className="text-slate-400 font-medium">Corporate Entity</span>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                  {profile.companyName}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 space-y-1">
                <span className="text-slate-400 font-medium">Authorized Contact Person</span>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                  {profile.name}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 space-y-1">
                <span className="text-slate-400 font-medium">Official Email Address</span>
                <p className="font-semibold text-slate-900 dark:text-white text-sm font-mono">
                  {profile.email}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 space-y-1">
                <span className="text-slate-400 font-medium">Direct Telephone / Mobile</span>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                  {profile.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery & Fulfilment Warehouses */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Verified Delivery & Receiving Warehouses
              </h3>
              <span className="text-xs text-slate-400">2 Active Locations</span>
            </div>

            <div className="space-y-3">
              {profile.shippingAddresses?.map((addr: any) => (
                <div
                  key={addr.id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white text-xs">
                        {addr.type}
                      </p>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white dark:bg-white dark:text-black">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-400">
                      {addr.line1}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-500">
                      {addr.city}, {addr.state} - {addr.pincode}, {addr.country}
                    </p>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold shrink-0 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Commercial Terms & Credit Facility */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              Commercial Terms & Credit Agreement
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 space-y-1">
                <span className="text-slate-400 font-medium">Enterprise Tier Allowance</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                  {profile.tier?.defaultDiscount}% Off
                </p>
                <p className="text-[11px] text-slate-400">Pre-negotiated baseline discount</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 space-y-1">
                <span className="text-slate-400 font-medium">Payment Credit Term</span>
                <p className="font-bold text-slate-900 dark:text-white text-base">
                  {profile.creditTerm}
                </p>
                <p className="text-[11px] text-slate-400">Invoiced post-dispatch</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 space-y-1">
                <span className="text-slate-400 font-medium">Revolving Credit Limit</span>
                <p className="font-bold text-slate-900 dark:text-white text-base font-mono">
                  {formatINR(profile.creditLimit)}
                </p>
                <p className="text-[11px] text-slate-400">Pre-approved line of credit</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Account Executive & Tax Compliance */}
        <div className="space-y-6">
          {/* Dedicated Account Executive */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-600" />
              Dedicated Account Executive
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-base shrink-0">
                {profile.accountExecutive?.name
                  ?.split(' ')
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join('') || 'AS'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                  {profile.accountExecutive?.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                  {profile.accountExecutive?.title}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-300">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <a href={`mailto:${profile.accountExecutive?.email}`} className="hover:underline font-mono text-xs">
                  {profile.accountExecutive?.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-300">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{profile.accountExecutive?.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-300">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Response SLA: <strong>{profile.accountExecutive?.responseSla}</strong></span>
              </div>
            </div>

            <a
              href={`mailto:${profile.accountExecutive?.email}?subject=Enterprise%20Inquiry%20-%20${encodeURIComponent(profile.companyName)}`}
              className="block w-full py-2 text-center text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl transition"
            >
              Contact Deal Manager
            </a>
          </div>

          {/* Tax & Legal Compliance */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Tax & Legal Compliance
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800">
                <span className="text-slate-400 font-medium">GSTIN</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {profile.gstin}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800">
                <span className="text-slate-400 font-medium">Permanent Account No (PAN)</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {profile.pan}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800">
                <span className="text-slate-400 font-medium">Tax Invoicing Email</span>
                <span className="font-mono text-slate-700 dark:text-zinc-300 truncate max-w-[150px]">
                  {profile.billingAddress?.taxEmail}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
