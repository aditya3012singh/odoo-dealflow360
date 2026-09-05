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
  Edit3,
  Trash2,
  FolderPlus,
  Sliders,
  Check,
  X,
  Tag,
  ShieldCheck,
  KeyRound,
  Download,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { StatCardSkeleton, TableRowSkeleton, CardSkeleton } from '../../components/ui/Skeleton';
import { ImageUploadDropzone } from '../../components/common/ImageUploadDropzone';
import {
  adminService,
  type AdminUser,
  type AdminPolicies,
  type NewProductPayload,
} from '../../services/admin.service';
import { quotationService } from '../../services/quotation.service';
import { ROLE_COLORS, type Role, type Product, type Category, type CustomerTier } from '../../types';

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

  // Search queries & filters
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [userSearch, setUserSearch] = useState('');

  // Password reset target state
  const [resetPasswordTarget, setResetPasswordTarget] = useState<AdminUser | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);

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
    imageUrl: '',
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

  // Phase 1: Product Edit & Delete States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  // Phase 1: Category Management States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Phase 2: Governance Tiers & Approval Rules States
  const [editingTier, setEditingTier] = useState<CustomerTier | null>(null);
  const [tierDiscountInput, setTierDiscountInput] = useState<number>(0);
  const [submittingTier, setSubmittingTier] = useState(false);

  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [submittingRule, setSubmittingRule] = useState(false);

  // Phase 3: Warehouse Logistics & Stock Adjustment States
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({ name: '', location: '', shippingWeight: 1 });
  const [submittingWarehouse, setSubmittingWarehouse] = useState(false);

  const [adjustStockTarget, setAdjustStockTarget] = useState<{
    warehouseId: string;
    productId: string;
    currentQty: number;
    name: string;
  } | null>(null);
  const [stockQtyInput, setStockQtyInput] = useState<number>(0);
  const [submittingStock, setSubmittingStock] = useState(false);

  const fetchConfigData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
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
      if (!silent) setLoading(false);
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
        imageUrl: '',
      });
      await fetchConfigData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Phase 1: Handle Product Update
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      setSubmittingProduct(true);
      setError(null);
      await adminService.updateProduct(editingProduct.id, {
        sku: editingProduct.sku,
        name: editingProduct.name,
        categoryId: editingProduct.categoryId,
        basePrice: Number(editingProduct.basePrice),
        costPrice: Number(editingProduct.costPrice),
        unit: editingProduct.unit,
        taxRate: Number(editingProduct.taxRate),
        isRecurring: Boolean(editingProduct.isRecurring),
        description: editingProduct.description || '',
        imageUrl: editingProduct.imageUrl || '',
        isActive: editingProduct.isActive,
      });
      setSuccessMsg(`Product ${editingProduct.name} updated successfully!`);
      setEditingProduct(null);
      await fetchConfigData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update product');
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Phase 1: Handle Product Delete / Archive
  const handleConfirmDeleteProduct = async () => {
    if (!deleteProductTarget) return;
    try {
      setDeletingProduct(true);
      setError(null);
      const res = await adminService.deleteProduct(deleteProductTarget.id);
      setSuccessMsg(res.message || `Product ${deleteProductTarget.name} removed/archived.`);
      setDeleteProductTarget(null);
      await fetchConfigData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeletingProduct(false);
    }
  };

  // Phase 1: Handle Category Creation
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    try {
      setSubmittingCategory(true);
      setError(null);
      const cat = await adminService.createCategory(newCategory);
      setSuccessMsg(`Category "${cat.name}" added to catalog!`);
      setNewCategory({ name: '', description: '' });
      await fetchConfigData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create category');
    } finally {
      setSubmittingCategory(false);
    }
  };

  // Phase 2: Handle Tier Discount Update (Optimistic)
  const handleUpdateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier) return;
    const targetId = editingTier.id;
    const newDiscount = tierDiscountInput;
    const tierName = editingTier.name;

    // Optimistically update local policies state immediately (0ms UI latency)
    setPolicies((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tiers: prev.tiers.map((t) =>
          t.id === targetId ? { ...t, defaultDiscount: newDiscount } : t
        ),
      };
    });

    setSuccessMsg(`${tierName} tier discount updated to ${newDiscount}%!`);
    setEditingTier(null);

    try {
      setSubmittingTier(true);
      await adminService.updateCustomerTier(targetId, {
        defaultDiscount: newDiscount,
        description: editingTier.description || undefined,
      });
      fetchConfigData(true); // Silent background sync
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update tier discount');
      fetchConfigData(true);
    } finally {
      setSubmittingTier(false);
    }
  };

  // Phase 2: Handle Governance Rule Update (Optimistic)
  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    const targetId = editingRule.id;
    const newMin = Number(editingRule.minRiskScore);
    const newMax = Number(editingRule.maxRiskScore);
    const newRole = editingRule.requiredRole;
    const level = editingRule.approvalLevel;

    // Optimistically update local rules state immediately
    setPolicies((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rules: prev.rules.map((r) =>
          r.id === targetId
            ? { ...r, minRiskScore: newMin, maxRiskScore: newMax, requiredRole: newRole }
            : r
        ),
      };
    });

    setSuccessMsg(`Governance Level ${level} rule updated!`);
    setEditingRule(null);

    try {
      setSubmittingRule(true);
      await adminService.updateApprovalRule(targetId, {
        minRiskScore: newMin,
        maxRiskScore: newMax,
        requiredRole: newRole,
      });
      fetchConfigData(true); // Silent background sync
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update approval rule');
      fetchConfigData(true);
    } finally {
      setSubmittingRule(false);
    }
  };

  // Phase 3: Handle Warehouse Creation
  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouse.name.trim() || !newWarehouse.location.trim()) return;
    try {
      setSubmittingWarehouse(true);
      setError(null);
      await adminService.createWarehouse(newWarehouse);
      setSuccessMsg(`Warehouse ${newWarehouse.name} created!`);
      setShowAddWarehouseModal(false);
      setNewWarehouse({ name: '', location: '', shippingWeight: 1 });
      await fetchConfigData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create warehouse');
    } finally {
      setSubmittingWarehouse(false);
    }
  };

  // Phase 3: Handle Stock Adjustment (Optimistic + Write-Behind)
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustStockTarget) return;
    const targetWhId = adjustStockTarget.warehouseId;
    const targetProdId = adjustStockTarget.productId;
    const newQty = stockQtyInput;
    const prodName = adjustStockTarget.name;

    // 1. Optimistically update local React state immediately (0ms UI latency!)
    setWarehouses((prev) =>
      prev.map((wh) => {
        if (wh.id !== targetWhId) return wh;
        const existingInv = wh.inventory || [];
        const found = existingInv.some((inv: any) => inv.productId === targetProdId);
        let updatedInv;
        if (found) {
          updatedInv = existingInv.map((inv: any) =>
            inv.productId === targetProdId
              ? { ...inv, availableQty: newQty, quantityOnHand: newQty }
              : inv
          );
        } else {
          updatedInv = [
            ...existingInv,
            {
              id: `temp-${Date.now()}`,
              warehouseId: targetWhId,
              productId: targetProdId,
              availableQty: newQty,
              quantityOnHand: newQty,
              product: { id: targetProdId, name: prodName },
            },
          ];
        }
        return { ...wh, inventory: updatedInv };
      })
    );

    setSuccessMsg(`Stock adjusted to ${newQty} units for ${prodName}!`);
    setAdjustStockTarget(null);

    // 2. Dispatch to backend write-behind cache (returns in ~5ms)
    try {
      setSubmittingStock(true);
      await adminService.adjustStock({
        warehouseId: targetWhId,
        productId: targetProdId,
        availableQty: newQty,
      });
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchConfigData(true); // Silent background refresh
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to adjust stock');
      fetchConfigData(true); // Revert on failure
    } finally {
      setSubmittingStock(false);
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
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(s) ||
        p.sku.toLowerCase().includes(s) ||
        p.category?.name.toLowerCase().includes(s);
      const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, productSearch, selectedCategory]);

  const filteredUsers = useMemo(() => {
    const s = userSearch.toLowerCase();
    return users.filter(
      (u) => u.username.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
    );
  }, [users, userSearch]);

  // Export Catalog CSV
  const handleExportCSV = () => {
    if (filteredProducts.length === 0) return;
    const headers = [
      'SKU',
      'Product Name',
      'Category',
      'Base Price (INR)',
      'Cost Price (INR)',
      'Gross Margin %',
      'Tax Rate %',
      'Recurring Subscription',
      'Status',
    ];
    const rows = filteredProducts.map((p) => {
      const base = Number(p.basePrice || 0);
      const cost = Number(p.costPrice || 0);
      const margin = base > 0 ? (((base - cost) / base) * 100).toFixed(1) : '0';
      return [
        `"${p.sku}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category?.name || 'General'}"`,
        base,
        cost,
        margin,
        Number(p.taxRate || 0),
        p.isRecurring ? 'Yes' : 'No',
        p.isActive ? 'Active' : 'Archived',
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dealflow360_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Staff Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordTarget || !newResetPassword) return;
    try {
      setSubmittingReset(true);
      setError(null);
      const res = await adminService.resetUserPassword(resetPasswordTarget.id, newResetPassword);
      setSuccessMsg(res.message || `Password for ${resetPasswordTarget.username} has been reset!`);
      setResetPasswordTarget(null);
      setNewResetPassword('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset user password');
    } finally {
      setSubmittingReset(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
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
            onClick={() => fetchConfigData()}
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
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search SKU or name..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-zinc-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Categories ({products.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Cloudinary CDN Indicator */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Cloudinary CDN: <b>dhndy2wl7</b>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleExportCSV}
                className="border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Export Catalog to CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Export CSV
              </button>

              <button
                onClick={() => setShowCategoryModal(true)}
                className="border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
              >
                <FolderPlus className="w-3.5 h-3.5 text-blue-500" />
                Categories ({categories.length})
              </button>

              <button
                onClick={() => {
                  if (categories.length > 0) {
                    setNewProduct((p) => ({ ...p, categoryId: categories[0].id }));
                  }
                  setShowAddProductModal(true);
                }}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Product
              </button>
            </div>
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
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-slate-700 dark:text-zinc-300">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRowSkeleton key={i} columns={9} />
                    ))
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-10 text-center text-slate-400 dark:text-zinc-500">
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
                            <div className="flex items-center gap-2.5">
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-400 shrink-0">
                                  <Package className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-white block">{p.name}</span>
                                {p.description && (
                                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate max-w-[220px] block">
                                    {p.description}
                                  </span>
                                )}
                              </div>
                            </div>
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
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingProduct({ ...p })}
                                className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                                title="Edit Product"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteProductTarget(p)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                                title="Delete / Archive Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
                Default discount privileges granted automatically when building quotes for accounts in these tiers. Click edit icon to modify.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {policies?.tiers.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-2 hover:border-slate-300 dark:hover:border-zinc-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      {t.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={t.name === 'Platinum' ? 'purple' : t.name === 'Gold' ? 'warning' : 'default'}>
                        {t.defaultDiscount}% Off
                      </Badge>
                      <button
                        onClick={() => {
                          setEditingTier(t);
                          setTierDiscountInput(Number(t.defaultDiscount));
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition cursor-pointer"
                        title={`Edit ${t.name} Tier Discount`}
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
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
                Quotes are evaluated against the Blended Risk Score (BRS) calculated from tier excess, margin erosion, and volume. Click edit icon to tune thresholds.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-950/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-amber-900 dark:text-amber-300">
                    Level 1: Sales Manager Sign-off
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="warning">
                      BRS {policies?.rules[0] ? `${Number(policies.rules[0].minRiskScore)} - ${Number(policies.rules[0].maxRiskScore)}` : '15.0 - 25.0'}
                    </Badge>
                    {policies?.rules[0] && (
                      <button
                        onClick={() => setEditingRule({ ...policies.rules[0] })}
                        className="p-1 text-amber-700 hover:text-amber-950 dark:hover:text-white transition cursor-pointer"
                        title="Edit Level 1 Rule"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Triggered when a sales representative requests discounts exceeding customer tier thresholds or standard category caps.
                </p>
                <div className="text-[11px] text-slate-500 font-mono pt-1">
                  Required Role: <b>{policies?.rules[0]?.requiredRole || 'SALES_MANAGER'}</b>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-950/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-purple-900 dark:text-purple-300">
                    Level 2: Finance Confirmation
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="purple">
                      BRS {policies?.rules[1] ? `> ${Number(policies.rules[1].minRiskScore)}` : '> 25.0'}
                    </Badge>
                    {policies?.rules[1] && (
                      <button
                        onClick={() => setEditingRule({ ...policies.rules[1] })}
                        className="p-1 text-purple-700 hover:text-purple-950 dark:hover:text-white transition cursor-pointer"
                        title="Edit Level 2 Rule"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Mandatory financial audit sign-off triggered when deal margin drops below margin tolerance or discount excess is severe.
                </p>
                <div className="text-[11px] text-slate-500 font-mono pt-1">
                  Required Role: <b>{policies?.rules[1]?.requiredRole || 'FINANCE'}</b>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-500" />
                  Fulfillment Facilities & Multi-Warehouse Allocation
                </h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                  The auto-split fulfillment engine routes stock from lowest shipping cost weight first.
                </p>
              </div>

              <button
                onClick={() => setShowAddWarehouseModal(true)}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Warehouse
              </button>
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
                        {wh.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500">{wh.location}</p>
                    </div>
                    <Badge variant={Number(wh.shippingWeight) <= 1 ? 'success' : 'warning'}>
                      Weight: {wh.shippingWeight}x Cost
                    </Badge>
                  </div>

                  <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 font-medium">
                      <span>Inventory Breakdown:</span>
                      {products.length > 0 && (
                        <button
                          onClick={() => {
                            setAdjustStockTarget({
                              warehouseId: wh.id,
                              productId: products[0].id,
                              currentQty: 0,
                              name: products[0].name,
                            });
                            setStockQtyInput(100);
                          }}
                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" /> Allocate Product
                        </button>
                      )}
                    </div>
                    {wh.inventory && wh.inventory.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-zinc-800/60">
                        {wh.inventory.map((inv: any) => {
                          const qty = Number(inv.availableQty ?? inv.quantityOnHand ?? 0);
                          return (
                            <div
                              key={inv.id}
                              className="pt-1.5 first:pt-0 flex items-center justify-between text-[11px] text-slate-600 dark:text-zinc-400"
                            >
                              <span className="truncate max-w-[200px]">{inv.product?.name || inv.productId}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono font-semibold text-slate-900 dark:text-zinc-200">
                                  {qty} units
                                </span>
                                <button
                                  onClick={() => {
                                    setAdjustStockTarget({
                                      warehouseId: wh.id,
                                      productId: inv.productId,
                                      currentQty: qty,
                                      name: inv.product?.name || 'Product',
                                    });
                                    setStockQtyInput(qty);
                                  }}
                                  className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition cursor-pointer"
                                  title="Adjust Stock Level"
                                >
                                  <Sliders className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400">No stock allocated yet.</p>
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
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRowSkeleton key={i} columns={6} />
                    ))
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
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => {
                                setResetPasswordTarget(u);
                                setNewResetPassword('');
                              }}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium cursor-pointer"
                              title="Reset Password"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Reset</span>
                            </button>
                            <button
                              onClick={() => handleToggleUserActive(u.id, u.isActive)}
                              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
                            >
                              {u.isActive ? 'Disable' : 'Activate'}
                            </button>
                          </div>
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

              <div className="col-span-2">
                <ImageUploadDropzone
                  value={newProduct.imageUrl || ''}
                  onChange={(url) => setNewProduct({ ...newProduct, imageUrl: url })}
                  label="Product Media (Cloudinary Hosted)"
                  helperText="Upload an image directly to Cloudinary CDN or switch to external link mode."
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
      {/* Modal: Edit Product */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateProduct}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-500" />
                Edit Catalog Product
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-sm cursor-pointer"
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
                  value={editingProduct.sku}
                  onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={editingProduct.categoryId}
                  onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
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
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="col-span-2">
                <ImageUploadDropzone
                  value={editingProduct.imageUrl || ''}
                  onChange={(url) => setEditingProduct({ ...editingProduct, imageUrl: url })}
                  label="Product Media (Cloudinary Hosted)"
                  helperText="Upload an image directly to Cloudinary CDN or switch to external link mode."
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
                  value={editingProduct.basePrice}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, basePrice: parseFloat(e.target.value) || 0 })
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
                  value={editingProduct.costPrice}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) || 0 })
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
                  value={editingProduct.taxRate}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, taxRate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-4 pt-6">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={editingProduct.isRecurring}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isRecurring: e.target.checked })}
                    className="rounded border-slate-300 dark:border-zinc-700"
                  />
                  Recurring
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={editingProduct.isActive}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isActive: e.target.checked })}
                    className="rounded border-slate-300 dark:border-zinc-700"
                  />
                  Active in Catalog
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingProduct}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {submittingProduct && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Delete Product Target Confirmation */}
      {deleteProductTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Remove or Archive Product?
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {deleteProductTarget.name} ({deleteProductTarget.sku})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              If this product is associated with existing quotations or finalized orders, it will be automatically <b>soft-archived</b> (hidden from new quotes) to preserve financial audits. If no dependencies exist, it will be permanently deleted.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteProductTarget(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                disabled={deletingProduct}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {deletingProduct && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Category Management */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-500" />
                Product Categories
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* List existing categories */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <div className="text-xs font-medium text-slate-500 dark:text-zinc-400">Current Categories:</div>
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-zinc-200">{c.name}</span>
                    {c.description && (
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500">{c.description}</p>
                    )}
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              ))}
            </div>

            {/* Add new category form */}
            <form onSubmit={handleCreateCategory} className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-3">
              <div className="text-xs font-semibold text-slate-900 dark:text-white">Create New Category</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Storage & Networking"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Optional details"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {submittingCategory && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Customer Tier Discount */}
      {editingTier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateTier}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-500" />
                Configure {editingTier.name} Tier
              </h3>
              <button
                type="button"
                onClick={() => setEditingTier(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Default Discount Percentage (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    required
                    value={tierDiscountInput}
                    onChange={(e) => setTierDiscountInput(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-mono text-slate-900 dark:text-white text-sm"
                  />
                  <span className="font-mono text-sm text-slate-400">%</span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                  This rate is auto-applied to line items when quoting customers in the {editingTier.name} tier.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTier(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingTier}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {submittingTier && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Update Discount
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Edit Approval Rule Threshold */}
      {editingRule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateRule}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                Level {editingRule.approvalLevel} Governance Rule
              </h3>
              <button
                type="button"
                onClick={() => setEditingRule(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Minimum Risk Score Threshold (BRS) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={editingRule.minRiskScore}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, minRiskScore: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-mono text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                  Quotations scoring above this threshold will automatically route to the required role for review.
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Required Approver Role *
                </label>
                <select
                  value={editingRule.requiredRole}
                  onChange={(e) => setEditingRule({ ...editingRule, requiredRole: e.target.value as Role })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                >
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
                onClick={() => setEditingRule(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingRule}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {submittingRule && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Save Threshold
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Warehouse */}
      {showAddWarehouseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateWarehouse}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-500" />
                Add Fulfillment Facility
              </h3>
              <button
                type="button"
                onClick={() => setShowAddWarehouseModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Warehouse Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune Regional Distribution Hub"
                  value={newWarehouse.name}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Location / City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hinjawadi Phase 2, Pune"
                  value={newWarehouse.location}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, location: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Shipping Cost Weight Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  required
                  value={newWarehouse.shippingWeight}
                  onChange={(e) =>
                    setNewWarehouse({ ...newWarehouse, shippingWeight: parseFloat(e.target.value) || 1 })
                  }
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-mono text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                  Lower weight (e.g. 1.0) is prioritized before higher weight facilities (e.g. 1.5) during fulfillment auto-split.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddWarehouseModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingWarehouse}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {submittingWarehouse && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Create Warehouse
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Adjust Stock Target */}
      {adjustStockTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAdjustStock}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-500" />
                Adjust Stock Quantity
              </h3>
              <button
                type="button"
                onClick={() => setAdjustStockTarget(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                <div className="text-slate-500 dark:text-zinc-400 text-[11px]">Product:</div>
                <div className="font-semibold text-slate-900 dark:text-white">{adjustStockTarget.name}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Current Available: <b>{adjustStockTarget.currentQty} units</b>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  New Available Quantity (Units) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockQtyInput}
                  onChange={(e) => setStockQtyInput(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-mono text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustStockTarget(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingStock}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {submittingStock && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Save Quantity
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Reset Staff Password */}
      {resetPasswordTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleResetPassword}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-500" />
                Reset Staff Password
              </h3>
              <button
                type="button"
                onClick={() => setResetPasswordTarget(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                <div className="text-slate-400 text-[11px]">User Account:</div>
                <div className="font-semibold text-slate-900 dark:text-white">{resetPasswordTarget.username}</div>
                <div className="text-slate-500 dark:text-zinc-400 text-[11px]">{resetPasswordTarget.email}</div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetPasswordTarget(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReset}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {submittingReset && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Reset Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
