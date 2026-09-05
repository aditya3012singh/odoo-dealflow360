import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Percent,
  RefreshCw,
  X,
  Copy,
  Check,
  Plus,
  Edit2,
  FileText,
  ShoppingBag,
  CreditCard,
  Repeat,
  DollarSign,
  Lock,
  Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  customerService,
  type Customer360Data,
  type CreateCustomerPayload,
  type UpdateCustomerPayload,
} from '../../services/customer.service';
import type { Customer, CustomerTier } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { StatCardSkeleton, TableRowSkeleton } from '../../components/ui/Skeleton';
import { DealLifecycleStepper } from '../../components/common/DealLifecycleStepper';

const tierBadgeVariant: Record<string, 'purple' | 'success' | 'warning' | 'info' | 'default'> = {
  PLATINUM: 'purple',
  ENTERPRISE: 'purple',
  GOLD: 'warning',
  SILVER: 'info',
  BRONZE: 'success',
  STANDARD: 'default',
};

function formatINR(val: number | string | undefined | null) {
  const num = Number(val || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function CustomerListPage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tiers, setTiers] = useState<CustomerTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');

  // Customer 360 Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [customer360, setCustomer360] = useState<Customer360Data | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'orders' | 'invoices' | 'portal'>('overview');

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateCustomerPayload>({
    companyName: '',
    name: '',
    email: '',
    phone: '',
    customerTierId: '',
    portalEnabled: true,
  });

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState<UpdateCustomerPayload>({
    companyName: '',
    name: '',
    email: '',
    phone: '',
    customerTierId: '',
    portalEnabled: true,
  });

  const [copiedToken, setCopiedToken] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  async function fetchData() {
    try {
      setLoading(true);
      const [custList, tierList] = await Promise.all([
        customerService.listCustomers(),
        customerService.getCustomerTiers(),
      ]);
      setCustomers(custList);
      setTiers(tierList);
      if (tierList.length > 0 && !createForm.customerTierId) {
        setCreateForm((prev) => ({ ...prev, customerTierId: tierList[0].id }));
      }
    } catch (err) {
      console.error('Failed to load customers or tiers:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function openCustomer360(id: string) {
    try {
      setDrawerOpen(true);
      setDrawerLoading(true);
      setActiveTab('overview');
      const data = await customerService.getCustomer360(id);
      setCustomer360(data);
    } catch (err) {
      console.error('Failed to load customer 360 profile:', err);
    } finally {
      setDrawerLoading(false);
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.companyName || !createForm.name || !createForm.email || !createForm.customerTierId) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      setCreating(true);
      const res = await customerService.createCustomer(createForm);
      if (res.rawPortalToken) {
        setCreatedToken(res.rawPortalToken);
      } else {
        setShowCreateModal(false);
      }
      await fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create customer.');
    } finally {
      setCreating(false);
    }
  }

  function openEditModal(customer: Customer) {
    setEditingCustomer(customer);
    setEditForm({
      companyName: customer.companyName,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      customerTierId: customer.customerTierId,
      portalEnabled: customer.portalEnabled ?? true,
    });
    setShowEditModal(true);
  }

  async function handleUpdateCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      setUpdating(true);
      await customerService.updateCustomer(editingCustomer.id, editForm);
      setShowEditModal(false);
      setEditingCustomer(null);
      await fetchData();
      if (drawerOpen && customer360?.customer.id === editingCustomer.id) {
        openCustomer360(editingCustomer.id);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update customer.');
    } finally {
      setUpdating(false);
    }
  }

  async function handleRotatePortalToken(id: string) {
    try {
      const res = await customerService.issuePortalToken(id);
      setActionMessage(`New portal token: ${res.portalToken}`);
      await openCustomer360(id);
      await fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to rotate token.');
    }
  }

  async function handleRevokePortalToken(id: string) {
    if (!confirm('Are you sure you want to revoke portal access for this customer?')) return;
    try {
      await customerService.revokePortalToken(id);
      setActionMessage('Portal access revoked.');
      await openCustomer360(id);
      await fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to revoke token.');
    }
  }

  // Filter customers by search & tier
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());

    const tierName = (c.customerTier?.name || 'STANDARD').toUpperCase();
    const matchesTier = selectedTier === 'ALL' || tierName === selectedTier;

    return matchesSearch && matchesTier;
  });

  // KPI Calculations
  const totalCustomers = customers.length;
  const premiumCustomers = customers.filter((c) => {
    const t = (c.customerTier?.name || '').toUpperCase();
    return t === 'GOLD' || t === 'PLATINUM' || t === 'ENTERPRISE';
  }).length;
  const portalActiveCount = customers.filter((c) => c.portalEnabled).length;
  const avgDiscount =
    customers.length > 0
      ? (
          customers.reduce(
            (acc, c) => acc + Number(c.customerTier?.defaultDiscount || 0),
            0
          ) / customers.length
        ).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Customer Directory & CRM 360
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Manage enterprise accounts, discount policy tiers, lifetime revenue, and secure customer portal tokens.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors"
            title="Refresh customer catalog"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setCreatedToken(null);
              setCreateForm({
                companyName: '',
                name: '',
                email: '',
                phone: '',
                customerTierId: tiers[0]?.id || '',
                portalEnabled: true,
              });
              setShowCreateModal(true);
            }}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Customer</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
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
              title="Total Accounts"
              value={totalCustomers.toString()}
              subtitle="Registered B2B clients"
              icon={<Building2 className="w-4 h-4" />}
            />
            <StatCard
              title="Premium Tiers"
              value={premiumCustomers.toString()}
              subtitle="Gold & Enterprise accounts"
              icon={<ShieldCheck className="w-4 h-4" />}
            />
            <StatCard
              title="Portal Enabled"
              value={portalActiveCount.toString()}
              subtitle="Self-service negotiation active"
              icon={<ExternalLink className="w-4 h-4" />}
            />
            <StatCard
              title="Avg Tier Discount"
              value={`${avgDiscount}%`}
              subtitle="Governance benchmark allowance"
              icon={<Percent className="w-4 h-4" />}
            />
          </>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search by company, contact person, or business email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        {/* Tier filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'GOLD', 'SILVER', 'BRONZE', 'STANDARD'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTier(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedTier === t
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              {t === 'ALL' ? 'All Tiers' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 dark:bg-zinc-950/50 text-[11px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3 text-left">Company & Account</th>
                <th className="px-5 py-3 text-left">Primary Contact</th>
                <th className="px-5 py-3 text-left">Tier Allowance</th>
                <th className="px-5 py-3 text-left">Deal Portfolio</th>
                <th className="px-5 py-3 text-left">Portal Security</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {loading ? (
                <>
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                </>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                    No customer accounts match your search or tier filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const tierUpper = (c.customerTier?.name || 'STANDARD').toUpperCase();
                  const variant = tierBadgeVariant[tierUpper] || 'default';
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition"
                    >
                      {/* Company Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300 font-bold text-xs shrink-0">
                            {c.companyName.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-900 dark:text-white">
                              {c.companyName}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                              ID: {c.id.substring(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Primary Contact */}
                      <td className="px-5 py-3.5">
                        <div className="text-xs text-slate-800 dark:text-zinc-200 font-medium">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[170px]">{c.email}</span>
                        </div>
                        {c.phone && (
                          <div className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Tier Allowance */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Badge variant={variant}>
                            {c.customerTier?.name || 'Standard'}
                          </Badge>
                          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            {c.customerTier?.defaultDiscount ? `${Number(c.customerTier.defaultDiscount)}% Max` : '0%'}
                          </span>
                        </div>
                      </td>

                      {/* Deal Portfolio */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono text-[11px]">
                            {c._count?.quotations ?? 0} Quotes
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono text-[11px]">
                            {c._count?.orders ?? 0} Orders
                          </span>
                        </div>
                      </td>

                      {/* Portal Status */}
                      <td className="px-5 py-3.5">
                        {c.portalEnabled ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500">
                            <ShieldAlert className="w-4 h-4 text-slate-300 dark:text-zinc-600" />
                            <span>Disabled</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openCustomer360(c.id)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Customer 360</span>
                          </button>
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                            title="Edit customer account"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CUSTOMER 360 DRAWER / MODAL */}
      {/* ========================================================================= */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {drawerLoading || !customer360 ? (
              <div className="p-16 text-center space-y-3">
                <RefreshCw className="w-7 h-7 animate-spin mx-auto text-slate-400 dark:text-zinc-500" />
                <p className="text-xs text-slate-500 dark:text-zinc-400">Loading Customer 360 ledger...</p>
              </div>
            ) : (
              <>
                {/* Drawer Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-start justify-between bg-slate-50/50 dark:bg-zinc-950/40">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black font-bold text-base flex items-center justify-center shrink-0">
                      {customer360.customer.companyName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                          {customer360.customer.companyName}
                        </h2>
                        <Badge
                          variant={
                            tierBadgeVariant[(customer360.customer.customerTier?.name || '').toUpperCase()] || 'default'
                          }
                        >
                          {customer360.customer.customerTier?.name || 'Standard'} Tier
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-zinc-400 mt-1">
                        <span>{customer360.customer.name}</span>
                        <span>·</span>
                        <span>{customer360.customer.email}</span>
                        {customer360.customer.phone && (
                          <>
                            <span>·</span>
                            <span>{customer360.customer.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      setCustomer360(null);
                      setActionMessage(null);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {actionMessage && (
                  <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <span className="font-mono">{actionMessage}</span>
                    <button
                      onClick={() => setActionMessage(null)}
                      className="text-emerald-600 hover:text-emerald-900"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* KPI Micro Strip */}
                <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/60">
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">Lifetime Revenue</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {formatINR(customer360.metrics.lifetimeSpend)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/60">
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">Converted Orders</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {customer360.metrics.totalOrders}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/60">
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">Quotations Issued</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {customer360.metrics.totalQuotations}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/60">
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">Active Subscriptions</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {customer360.metrics.activeSubscriptions}
                    </p>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="px-6 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto bg-white dark:bg-zinc-900 text-xs font-semibold">
                  {[
                    { id: 'overview', label: '360 Overview', icon: <Building2 className="w-3.5 h-3.5" /> },
                    { id: 'quotes', label: `Quotations (${customer360.quotations.length})`, icon: <FileText className="w-3.5 h-3.5" /> },
                    { id: 'orders', label: `Orders (${customer360.orders.length})`, icon: <ShoppingBag className="w-3.5 h-3.5" /> },
                    { id: 'invoices', label: `Billing & Invoices (${customer360.invoices.length})`, icon: <CreditCard className="w-3.5 h-3.5" /> },
                    { id: 'portal', label: 'Portal Security', icon: <Lock className="w-3.5 h-3.5" /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                        activeTab === tab.id
                          ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                          : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* TAB 1: OVERVIEW */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Commercial Governance
                          </h4>
                          <div className="text-xs space-y-1 text-slate-600 dark:text-zinc-400">
                            <p>
                              Tier Classification:{' '}
                              <strong className="text-slate-900 dark:text-white">
                                {customer360.customer.customerTier?.name} Tier
                              </strong>
                            </p>
                            <p>
                              Baseline Discount Allowance:{' '}
                              <strong className="text-emerald-600 dark:text-emerald-400">
                                {customer360.customer.customerTier?.defaultDiscount}%
                              </strong>
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                              {customer360.customer.customerTier?.description || 'Standard discount policy'}
                            </p>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Customer Portal Access
                          </h4>
                          <div className="text-xs space-y-1 text-slate-600 dark:text-zinc-400">
                            <p className="flex items-center gap-1.5">
                              Status:{' '}
                              {customer360.customer.portalEnabled ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Enabled
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-zinc-500">Disabled</span>
                              )}
                            </p>
                            <p>
                              Account Registered:{' '}
                              {new Date(customer360.customer.createdAt).toLocaleDateString()}
                            </p>
                            <button
                              onClick={() => setActiveTab('portal')}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline pt-1 block"
                            >
                              Manage Portal Token & Login Credentials →
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Active Deal Milestone Journey for Latest Quotation */}
                      {customer360.quotations?.[0] && (
                        <DealLifecycleStepper
                          status={customer360.quotations[0].status}
                          quotationNumber={customer360.quotations[0].quotationNumber}
                          createdAt={customer360.quotations[0].createdAt}
                          updatedAt={customer360.quotations[0].updatedAt}
                        />
                      )}

                      {/* Recent Quotes Snapshot */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Recent Quotations
                          </h4>
                          <button
                            onClick={() => setActiveTab('quotes')}
                            className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          >
                            View All ({customer360.quotations.length}) →
                          </button>
                        </div>
                        {!customer360.quotations.length ? (
                          <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                            No quotations have been generated for this client yet.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100 dark:divide-zinc-800/60 border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                            {customer360.quotations.slice(0, 3).map((q) => (
                              <div
                                key={q.id}
                                className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                      {q.quotationNumber}
                                    </span>
                                    <Badge variant="default">{q.status}</Badge>
                                  </div>
                                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                                    {q.items.length} items · Rep:{' '}
                                    {q.salesRep?.username || 'Sarah Jenkins'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                                    {formatINR(q.totalAmount)}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {new Date(q.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: QUOTATIONS */}
                  {activeTab === 'quotes' && (
                    <div className="space-y-4">
                      {!customer360.quotations.length ? (
                        <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                          No quotations found for this customer.
                        </div>
                      ) : (
                        <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 dark:bg-zinc-950/60 text-slate-400 uppercase tracking-wider text-[10px]">
                              <tr>
                                <th className="px-4 py-2.5 text-left">Quote #</th>
                                <th className="px-4 py-2.5 text-left">Status</th>
                                <th className="px-4 py-2.5 text-right">Items</th>
                                <th className="px-4 py-2.5 text-right">Subtotal</th>
                                <th className="px-4 py-2.5 text-right">Discount</th>
                                <th className="px-4 py-2.5 text-right">Total</th>
                                <th className="px-4 py-2.5 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                              {customer360.quotations.map((q) => (
                                <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30">
                                  <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">
                                    {q.quotationNumber}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant="default">{q.status}</Badge>
                                  </td>
                                  <td className="px-4 py-3 text-right">{q.items.length}</td>
                                  <td className="px-4 py-3 text-right">{formatINR(q.subtotal)}</td>
                                  <td className="px-4 py-3 text-right text-amber-600 font-medium">
                                    - {formatINR(q.discountAmount)}
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                                    {formatINR(q.totalAmount)}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      onClick={() => navigate(`/workspace/quotations`)}
                                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                                    >
                                      View
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: ORDERS */}
                  {activeTab === 'orders' && (
                    <div className="space-y-4">
                      {!customer360.orders.length ? (
                        <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                          No orders converted for this customer yet.
                        </div>
                      ) : (
                        <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 dark:bg-zinc-950/60 text-slate-400 uppercase tracking-wider text-[10px]">
                              <tr>
                                <th className="px-4 py-2.5 text-left">Order #</th>
                                <th className="px-4 py-2.5 text-left">Status</th>
                                <th className="px-4 py-2.5 text-right">Items</th>
                                <th className="px-4 py-2.5 text-right">Shipments</th>
                                <th className="px-4 py-2.5 text-right">Total</th>
                                <th className="px-4 py-2.5 text-right">Created</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                              {customer360.orders.map((o) => (
                                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30">
                                  <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">
                                    {o.orderNumber}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant="info">{o.status}</Badge>
                                  </td>
                                  <td className="px-4 py-3 text-right">{o.items.length}</td>
                                  <td className="px-4 py-3 text-right">{o.fulfillments?.length || 0}</td>
                                  <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                                    {formatINR(o.totalAmount)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-slate-400">
                                    {new Date(o.createdAt).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: INVOICES & BILLING */}
                  {activeTab === 'invoices' && (
                    <div className="space-y-4">
                      {!customer360.invoices.length ? (
                        <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                          No invoices issued for this customer yet.
                        </div>
                      ) : (
                        <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 dark:bg-zinc-950/60 text-slate-400 uppercase tracking-wider text-[10px]">
                              <tr>
                                <th className="px-4 py-2.5 text-left">Invoice #</th>
                                <th className="px-4 py-2.5 text-left">Status</th>
                                <th className="px-4 py-2.5 text-right">Total Amount</th>
                                <th className="px-4 py-2.5 text-right">Paid Amount</th>
                                <th className="px-4 py-2.5 text-right">Due Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                              {customer360.invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30">
                                  <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">
                                    {inv.invoiceNumber}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant={inv.status === 'PAID' ? 'success' : 'warning'}>
                                      {inv.status}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                                    {formatINR(inv.totalAmount)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                                    {formatINR(inv.paidAmount)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-slate-400">
                                    {new Date(inv.dueDate).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 5: PORTAL SECURITY */}
                  {activeTab === 'portal' && (
                    <div className="space-y-5">
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              Customer Self-Service Portal Access
                            </h4>
                          </div>
                          <Badge variant={customer360.customer.portalEnabled ? 'success' : 'default'}>
                            {customer360.customer.portalEnabled ? 'Portal Active' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          Customers authenticate with a dedicated hashed portal token or magic email credentials to view, propose counter-offers, and confirm quotations directly.
                        </p>

                        <div className="pt-2 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleRotatePortalToken(customer360.customer.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 transition cursor-pointer"
                          >
                            Generate New Token
                          </button>
                          <button
                            onClick={() => handleRevokePortalToken(customer360.customer.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-rose-200 dark:border-rose-900/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                          >
                            Revoke Portal Access
                          </button>
                          <a
                            href="/portal/login"
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open Customer Portal</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          Customer Login Email
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={customer360.customer.email}
                            className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-200"
                          />
                          <button
                            onClick={() => handleCopy(customer360.customer.email)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 transition shrink-0 flex items-center gap-1"
                          >
                            {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE CUSTOMER MODAL */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add New Customer Account
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createdToken ? (
              <div className="space-y-4 py-2">
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                    <Check className="w-4 h-4" /> Customer Account Created Successfully!
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    A secure Customer Portal Token has been generated. Share this token or let the customer sign in via their email.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      readOnly
                      value={createdToken}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-800 rounded-lg text-slate-800 dark:text-zinc-200"
                    />
                    <button
                      onClick={() => handleCopy(createdToken)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shrink-0"
                    >
                      {copiedToken ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-black"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateCustomer} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.companyName}
                    onChange={(e) => setCreateForm({ ...createForm, companyName: e.target.value })}
                    placeholder="e.g. Apex Global Solutions"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Primary Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Samantha Wright"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                      Business Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="procurement@apex.com"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={createForm.phone || ''}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      placeholder="+91 98765 00000"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Customer Governance Tier *
                  </label>
                  <select
                    value={createForm.customerTierId}
                    onChange={(e) => setCreateForm({ ...createForm, customerTierId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                  >
                    {tiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} Tier ({Number(t.defaultDiscount)}% Base Discount)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="enablePortal"
                    checked={createForm.portalEnabled}
                    onChange={(e) => setCreateForm({ ...createForm, portalEnabled: e.target.checked })}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <label htmlFor="enablePortal" className="text-xs text-slate-700 dark:text-zinc-300">
                    Enable Customer Self-Service Negotiation Portal
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 disabled:opacity-50"
                  >
                    {creating ? 'Creating Account...' : 'Create Customer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT CUSTOMER MODAL */}
      {/* ========================================================================= */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Customer Account
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.companyName}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Primary Contact Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Customer Tier
                </label>
                <select
                  value={editForm.customerTierId}
                  onChange={(e) => setEditForm({ ...editForm, customerTierId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100"
                >
                  {tiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} Tier ({Number(t.defaultDiscount)}% Base Discount)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editEnablePortal"
                  checked={editForm.portalEnabled}
                  onChange={(e) => setEditForm({ ...editForm, portalEnabled: e.target.checked })}
                  className="rounded border-slate-300 text-slate-900 focus:ring-0"
                />
                <label htmlFor="editEnablePortal" className="text-xs text-slate-700 dark:text-zinc-300">
                  Enable Customer Self-Service Negotiation Portal
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
