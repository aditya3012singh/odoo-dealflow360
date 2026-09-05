import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Shield,
  Database,
  Users,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  MapPin,
  TrendingDown,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { StatCardSkeleton, TableRowSkeleton, CardSkeleton } from '../../components/ui/Skeleton';
import {
  adminService,
  type AdminUser,
  type AdminPolicies,
  type NewProductPayload,
} from '../../services/admin.service';
import { quotationService } from '../../services/quotation.service';
import { ROLE_COLORS, type Role, type Product, type Category } from '../../types';

export function AdminConfigPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'products' | 'policies' | 'warehouses' | 'users') || 'products';

  const [activeTab, setActiveTab] = useState<'products' | 'policies' | 'warehouses' | 'users'>(initialTab);

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['products', 'policies', 'warehouses', 'users'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'products' | 'policies' | 'warehouses' | 'users') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [policies, setPolicies] = useState<AdminPolicies | null>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search queries
  const [productSearch, setProductSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Modals
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState<NewProductPayload>({
    sku: '',
    name: '',
    categoryId: '',
    basePrice: 0,
    costPrice: 0,
    unit: 'unit',
    taxRate: 18,
    isRecurring: false,
    description: '',
  });
  const [submittingProduct, setSubmittingProduct] = useState(false);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'SALES_REP' as Role,
  });
  const [submittingUser, setSubmittingUser] = useState(false);

  const fetchConfigData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prodData, polData, whData, usersData] = await Promise.all([
        quotationService.getProducts().catch(() => []),
        adminService.listPolicies().catch(() => null),
        adminService.listWarehouses().catch(() => []),
        adminService.listUsers().catch(() => []),
      ]);
      setProducts(prodData);
      setPolicies(polData);
      if (polData?.categories) {
        setCategories(polData.categories);
      }
      setWarehouses(whData);
      setUsers(usersData);
    } catch (err: any) {
      console.error('Failed to load admin config data:', err);
      setError(err.response?.data?.message || 'Failed to fetch configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigData();
  }, []);

  // Handle Product Creation
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingProduct(true);
      setError(null);
      await adminService.createProduct(newProduct);
      setSuccessMsg(`Product ${newProduct.name} (SKU: ${newProduct.sku}) added to catalog!`);
      setShowAddProductModal(false);
      setNewProduct({
        sku: '',
        name: '',
        categoryId: categories[0]?.id || '',
        basePrice: 0,
        costPrice: 0,
        unit: 'unit',
        taxRate: 18,
        isRecurring: false,
        description: '',
      });
      await fetchConfigData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Handle User Creation
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingUser(true);
      setError(null);
      await adminService.createUser(newUser);
      setSuccessMsg(`User ${newUser.username} registered with role ${newUser.role}!`);
      setShowAddUserModal(false);
      setNewUser({ username: '', email: '', password: '', role: 'SALES_REP' });
      await fetchConfigData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmittingUser(false);
    }
  };

  // Handle User Role / Status Update
  const handleUpdateUserRole = async (id: string, role: Role) => {
    try {
      await adminService.updateUser(id, { role });
      setSuccessMsg('User role updated.');
      await fetchConfigData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleToggleUserActive = async (id: string, currentStatus: boolean) => {
    try {
      await adminService.updateUser(id, { isActive: !currentStatus });
      setSuccessMsg(`User account ${!currentStatus ? 'activated' : 'disabled'}.`);
      await fetchConfigData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle user status');
    }
  };

  // Filtered lists
  const filteredProducts = useMemo(() => {
    const s = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.sku.toLowerCase().includes(s) ||
        p.category?.name.toLowerCase().includes(s)
    );
  }, [products, productSearch]);

  const filteredUsers = useMemo(() => {
    const s = userSearch.toLowerCase();
    return users.filter(
      (u) => u.username.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
    );
  }, [users, userSearch]);

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Admin Configuration Suite
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            System configuration for Product Catalogs, Multi-tier Discount Governance, Warehouses, and Access Control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchConfigData}
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

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-zinc-800 flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => handleTabChange('products')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'products'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <Package className="w-4 h-4" />
          Product Catalog ({products.length})
        </button>

        <button
          onClick={() => handleTabChange('policies')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'policies'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          Discount & Governance Policies
        </button>

        <button
          onClick={() => handleTabChange('warehouses')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'warehouses'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <Database className="w-4 h-4" />
          Warehouses & Stock ({warehouses.length})
        </button>

        <button
          onClick={() => handleTabChange('users')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <Users className="w-4 h-4" />
          User & Role Administration ({users.length})
        </button>
      </div>

      {/* TAB 1: PRODUCT CATALOG */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by SKU or name..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                if (categories.length > 0) {
                  setNewProduct((p) => ({ ...p, categoryId: categories[0].id }));
                }
                setShowAddProductModal(true);
              }}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/75 dark:bg-zinc-950/60 border-b border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-medium uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">SKU / Code</th>
                    <th className="px-5 py-3">Product Name</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Base Price</th>
                    <th className="px-5 py-3">Cost Price</th>
                    <th className="px-5 py-3">Gross Margin</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-slate-700 dark:text-zinc-300">
                  {loading ? (
                    <>
                      <TableRowSkeleton columns={8} />
                      <TableRowSkeleton columns={8} />
                      <TableRowSkeleton columns={8} />
                    </>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-slate-400 dark:text-zinc-500">
                        No products found matching &quot;{productSearch}&quot;.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const base = Number(p.basePrice || 0);
                      const cost = Number(p.costPrice || 0);
                      const marginPct = base > 0 ? (((base - cost) / base) * 100).toFixed(1) : '0';

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition">
                          <td className="px-5 py-3 font-mono font-medium text-slate-900 dark:text-white">
                            {p.sku}
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-zinc-200">
                            {p.name}
                          </td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                              {p.category?.name || 'General'}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-mono font-semibold text-slate-900 dark:text-white">
                            ₹{base.toLocaleString('en-IN')}
                          </td>
                          <td className="px-5 py-3 font-mono text-slate-500 dark:text-zinc-400">
                            ₹{cost.toLocaleString('en-IN')}
                          </td>
                          <td className="px-5 py-3 font-mono">
                            <span
                              className={`font-semibold ${
                                Number(marginPct) < 20
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {marginPct}%
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant={p.isRecurring ? 'purple' : 'default'}>
                              {p.isRecurring ? 'Recurring SaaS' : 'One-Time'}
                            </Badge>
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant={p.isActive ? 'success' : 'danger'}>
                              {p.isActive ? 'Active' : 'Inactive'}
                            </Badge>
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
      )}

      {/* TAB 2: DISCOUNT & GOVERNANCE POLICIES */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          {/* Customer Tiers */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                Customer Account Tiers & Base Discounts
              </h2>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                Default discount privileges granted automatically when building quotes for accounts in these tiers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {policies?.tiers.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      {t.name}
                    </span>
                    <Badge variant={t.name === 'Platinum' ? 'purple' : t.name === 'Gold' ? 'warning' : 'default'}>
                      {t.defaultDiscount}% Off
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                    {t.description || `${t.name} tier account policy`}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Governance Approval Rules */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" />
                Automated Approval Engine Routing Rules
              </h2>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                Quotes are evaluated against the Blended Risk Score (BRS) calculated from tier excess, margin erosion, and volume.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-950/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-amber-900 dark:text-amber-300">
                    Level 1: Sales Manager Sign-off
                  </span>
                  <Badge variant="warning">BRS 15.0 - 25.0</Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Triggered when a sales representative requests discounts exceeding customer tier thresholds or standard category caps.
                </p>
                <div className="text-[11px] text-slate-500 font-mono pt-1">
                  Required Role: <b>SALES_MANAGER</b>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-950/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-purple-900 dark:text-purple-300">
                    Level 2: Finance Confirmation
                  </span>
                  <Badge variant="purple">BRS &gt; 25.0</Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Mandatory financial audit sign-off triggered when deal margin drops below 15% or discount excess is severe.
                </p>
                <div className="text-[11px] text-slate-500 font-mono pt-1">
                  Required Role: <b>FINANCE</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MULTI-WAREHOUSE LOGISTICS */}
      {activeTab === 'warehouses' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-500" />
                Fulfillment Facilities & Multi-Warehouse Allocation
              </h2>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                The auto-split fulfillment engine routes stock from lowest shipping cost weight first.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {warehouses.map((wh) => (
                <div
                  key={wh.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {wh.name} ({wh.code})
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500">{wh.location}</p>
                    </div>
                    <Badge variant={Number(wh.shippingWeight) <= 1 ? 'success' : 'warning'}>
                      Weight: {wh.shippingWeight}x Cost
                    </Badge>
                  </div>

                  <div className="text-xs space-y-1 pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <span className="text-slate-500 dark:text-zinc-400 font-medium block">
                      Inventory Breakdown:
                    </span>
                    {wh.inventory && wh.inventory.length > 0 ? (
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {wh.inventory.map((inv: any) => (
                          <div
                            key={inv.id}
                            className="flex justify-between text-[11px] text-slate-600 dark:text-zinc-400"
                          >
                            <span>{inv.product?.name || inv.productId}</span>
                            <span className="font-mono font-semibold text-slate-900 dark:text-zinc-200">
                              {inv.quantityOnHand} in stock
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400">No stock allocated.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: USER & ROLE ADMINISTRATION */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by username or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              Register User
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/75 dark:bg-zinc-950/60 border-b border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-medium uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Assigned Role</th>
                    <th className="px-5 py-3">Account Status</th>
                    <th className="px-5 py-3">Joined Date</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-slate-700 dark:text-zinc-300">
                  {loading ? (
                    <>
                      <TableRowSkeleton columns={6} />
                      <TableRowSkeleton columns={6} />
                      <TableRowSkeleton columns={6} />
                    </>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400 dark:text-zinc-500">
                        No users matching search query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition">
                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-900 dark:bg-white text-white dark:text-zinc-900 rounded-full flex items-center justify-center text-[10px] font-bold">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <span>{u.username}</span>
                        </td>
                        <td className="px-5 py-3 font-mono text-slate-500 dark:text-zinc-400">
                          {u.email}
                        </td>
                        <td className="px-5 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value as Role)}
                            className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-2 py-1 text-xs text-slate-900 dark:text-white font-medium"
                          >
                            <option value="SALES_REP">Sales Rep</option>
                            <option value="SALES_MANAGER">Sales Manager</option>
                            <option value="FINANCE">Finance</option>
                            <option value="OPERATIONS">Operations</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={u.isActive ? 'success' : 'danger'}>
                            {u.isActive ? 'Active' : 'Disabled'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleToggleUserActive(u.id, u.isActive)}
                            className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium"
                          >
                            {u.isActive ? 'Disable' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Product */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateProduct}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                Add Catalog Product
              </h3>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2 sm:col-span-1">
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  SKU / Product Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SRV-ENTERPRISE-01"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={newProduct.categoryId}
                  onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Cloud Compute Cluster"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Base Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newProduct.basePrice}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, basePrice: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Cost Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newProduct.costPrice}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, costPrice: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  value={newProduct.taxRate}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, taxRate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={newProduct.isRecurring}
                  onChange={(e) => setNewProduct({ ...newProduct, isRecurring: e.target.checked })}
                  className="rounded border-slate-300 dark:border-zinc-700"
                />
                <label htmlFor="isRecurring" className="font-medium text-slate-700 dark:text-zinc-300 cursor-pointer">
                  Recurring Subscription (SaaS)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingProduct}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
              >
                {submittingProduct && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Add to Catalog
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add User */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateUser}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                Register Staff User
              </h3>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. asmith"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="asmith@dealflow360.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Role Assignment *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-white"
                >
                  <option value="SALES_REP">Sales Rep</option>
                  <option value="SALES_MANAGER">Sales Manager</option>
                  <option value="FINANCE">Finance</option>
                  <option value="OPERATIONS">Operations</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingUser}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
              >
                {submittingUser && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Create User
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
