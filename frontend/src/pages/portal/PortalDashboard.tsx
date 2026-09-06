import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Clock,
  CheckCircle,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Building2,
  ShoppingBag,
  Plus,
  Minus,
  Sparkles,
  Layers,
  Search,
  Check,
  Send,
  Trash2,
  Tag,
  ShieldCheck,
  X,
  Truck,
  Package,
  CreditCard,
  Repeat,
  Calendar,
  ExternalLink,
  Printer,
  Download,
  MapPin,
  Box,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import {
  StatCardSkeleton,
  CardSkeleton,
  StorefrontProductSkeleton,
  OrderCardSkeleton,
  BillingSkeleton,
} from '../../components/ui/Skeleton';
import { DealLifecycleStepper } from '../../components/common/DealLifecycleStepper';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  portalService,
  type PortalDashboardData,
} from '../../services/portal.service';

const statusConfig: Record<
  string,
  { label: string; variant: 'purple' | 'success' | 'warning' | 'info' | 'default'; action: string }
> = {
  APPROVED:           { label: 'Approved ✓',      variant: 'success', action: 'Confirm Order'  },
  UNDER_NEGOTIATION:  { label: 'Under Review',    variant: 'warning', action: 'View Details'   },
  PENDING_MANAGER:    { label: 'Pending Review',  variant: 'warning', action: 'View Details'   },
  PENDING_FINANCE:    { label: 'Pending Finance', variant: 'purple',  action: 'View Details'   },
  CONVERTED_TO_ORDER: { label: 'Order Placed ✓',  variant: 'info',    action: 'Track Order'    },
  CONFIRMED:          { label: 'Confirmed ✓',     variant: 'info',    action: 'View Order'     },
  REJECTED:           { label: 'Declined',        variant: 'default', action: 'View Details'   },
  DRAFT:              { label: 'Draft',            variant: 'default', action: 'View'           },
};

function formatINR(val: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

interface CartItem {
  product: any;
  quantity: number;
}

export function PortalDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation state synced with URL: 'storefront' | 'quotations' | 'orders' | 'billing'
  const rawTab = searchParams.get('tab') || 'storefront';
  const activeTab: 'storefront' | 'quotations' | 'orders' | 'billing' =
    rawTab === 'quotations' || rawTab === 'orders' || rawTab === 'billing' ? rawTab : 'storefront';

  const setActiveTab = (t: 'storefront' | 'quotations' | 'orders' | 'billing') => {
    setSearchParams({ tab: t });
  };

  const [data, setData] = useState<PortalDashboardData | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [billing, setBilling] = useState<{ subscriptions: any[]; invoices: any[] }>({
    subscriptions: [],
    invoices: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Storefront search & category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk Cart state
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [requestedDiscount, setRequestedDiscount] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState<string | null>(null);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [dashData, prods, ords, bData] = await Promise.all([
        portalService.getDashboard(),
        portalService.listStorefrontProducts().catch(() => []),
        portalService.listOrders().catch(() => []),
        portalService.getBilling().catch(() => ({ subscriptions: [], invoices: [] })),
      ]);
      setData(dashData);
      setProducts(prods);
      setOrders(ords);
      setBilling(bData);
    } catch (err: any) {
      console.error('Failed to load portal data:', err);
      setError(err?.response?.data?.message || 'Failed to load portal data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Compute category list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) set.add(p.category.name);
    });
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === 'ALL' ||
        (p.category?.name && p.category.name.toLowerCase() === selectedCategory.toLowerCase());
      const matchQuery =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (product: any, qty = 1) => {
    setCart((prev) => {
      const current = prev[product.id]?.quantity || 0;
      return {
        ...prev,
        [product.id]: {
          product,
          quantity: current + qty,
        },
      };
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) => {
      if (!prev[productId]) return prev;
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          quantity,
        },
      };
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const cartList = Object.values(cart);
  const cartTotalUnits = cartList.reduce((sum, it) => sum + it.quantity, 0);

  // Cart Pricing Calculations
  const cartGrossTotal = cartList.reduce((sum, it) => {
    const p = Number(it.product.basePrice);
    return sum + p * it.quantity;
  }, 0);

  const tierDiscount = useMemo(() => {
    const tier = data?.customer.tier;
    if (tier === 'PLATINUM' || tier === 'ENTERPRISE') return 25;
    if (tier === 'GOLD') return 15;
    if (tier === 'SILVER') return 10;
    if (tier === 'BRONZE') return 5;
    return 0;
  }, [data?.customer.tier]);

  const activeDiscountRate = requestedDiscount !== '' ? Number(requestedDiscount) : tierDiscount;
  const estimatedDiscountAmount = (cartGrossTotal * activeDiscountRate) / 100;
  const estimatedPayable = Math.max(0, cartGrossTotal - estimatedDiscountAmount);

  async function handleRequestBulkQuote() {
    if (cartList.length === 0) return;
    try {
      setSubmittingQuote(true);
      setError(null);
      const items = cartList.map((it) => ({
        productId: it.product.id,
        quantity: it.quantity,
      }));

      const res = await portalService.requestBulkQuotation({
        items,
        requestedDiscount: requestedDiscount !== '' ? Number(requestedDiscount) : undefined,
        notes: orderNotes.trim() || undefined,
      });

      setQuoteSuccessMsg(
        `Quotation ${res.quotationNumber} initiated successfully! Our sales operations engine has routed it for review.`
      );
      setCart({});
      setShowCartDrawer(false);
      setRequestedDiscount('');
      setOrderNotes('');

      // Reload dashboard and switch to quotations tab
      await loadData();
      setActiveTab('quotations');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to submit quote request.');
    } finally {
      setSubmittingQuote(false);
    }
  }

  const readyQuote = data?.quotations.find((q) => q.status === 'APPROVED');

  return (
    <div className="space-y-6 pb-20">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-colors shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Welcome, {data?.customer.companyName || 'Enterprise Partner'} 👋
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-black">
              {data?.customer.tier || 'Gold'} Account
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Pre-negotiated baseline allowance:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">{tierDiscount}% Off</strong>. Browse hardware & cloud subscriptions below, track active shipments, or inspect commercial invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition cursor-pointer"
            title="Refresh portal"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {quoteSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{quoteSuccessMsg}</span>
          </div>
          <button
            onClick={() => setQuoteSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-950 dark:hover:text-emerald-200 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: ENTERPRISE STOREFRONT (FLIPKART / B2B ECOMMERCE STYLE CATALOG) */}
      {/* ========================================================================= */}
      {activeTab === 'storefront' && (
        <div className="space-y-6">
          {/* Clean Storefront Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200 dark:border-zinc-800/80">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Enterprise Product Catalog
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Pre-negotiated <strong className="text-emerald-600 dark:text-emerald-400">{tierDiscount}% {data?.customer.tier} discount</strong> applied automatically. Add items and request volume commercial quotes.
              </p>
            </div>
          </div>

          {/* Search & Category Filter bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by model, SKU, or specs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {cat === 'ALL' ? 'All Products' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid (Flipkart/Storefront style cards) */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <StorefrontProductSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">No products found</p>
              <p className="text-xs text-slate-400">Try adjusting your search query or category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((prod) => {
                const basePrice = Number(prod.basePrice);
                const tierPrice = basePrice - (basePrice * tierDiscount) / 100;
                const cartItem = cart[prod.id];
                const inCartQty = cartItem ? cartItem.quantity : 0;

                return (
                  <div
                    key={prod.id}
                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition flex flex-col justify-between group"
                  >
                    {/* Card Image Area */}
                    <div className="relative h-48 bg-slate-100 dark:bg-zinc-800/80 overflow-hidden flex items-center justify-center">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-zinc-600" />
                      )}

                      {/* Floating Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-sm">
                          {prod.category?.name || 'Hardware'}
                        </span>
                        {prod.isRecurring && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-sm">
                            Monthly Subscription
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">
                          {tierDiscount}% Off
                        </span>
                      </div>
                    </div>

                    {/* Card Info Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {prod.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">
                          SKU: {prod.sku}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                          {prod.description || 'Enterprise-grade equipment with comprehensive commercial warranty.'}
                        </p>
                      </div>

                      {/* Pricing */}
                      <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-baseline justify-between">
                        <div>
                          <div className="text-[11px] text-slate-400 line-through">
                            MRP: {formatINR(basePrice)}
                          </div>
                          <div className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                            {formatINR(tierPrice)}
                            <span className="text-xs font-normal text-slate-400"> / {prod.unit || 'unit'}</span>
                          </div>
                        </div>

                        {/* Add/Quantity Stepper */}
                        {inCartQty === 0 ? (
                          <button
                            onClick={() => addToCart(prod, 1)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 transition flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 border border-slate-200 dark:border-zinc-700 rounded-lg p-1 bg-slate-50 dark:bg-zinc-800">
                            <button
                              onClick={() => updateQuantity(prod.id, inCartQty - 1)}
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-slate-900 dark:text-white px-1">
                              {inCartQty}
                            </span>
                            <button
                              onClick={() => updateQuantity(prod.id, inCartQty + 1)}
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sticky Bottom Cart Floating Bar */}
          {cartTotalUnits > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-4xl w-[92%] bg-slate-900/95 dark:bg-white/95 text-white dark:text-black backdrop-blur-md p-4 rounded-2xl shadow-2xl z-40 flex items-center justify-between border border-slate-700 dark:border-zinc-300 transition-all animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-black/20 flex items-center justify-center font-bold text-sm">
                  {cartTotalUnits}
                </div>
                <div>
                  <p className="text-xs font-semibold">
                    {cartList.length} Product{cartList.length !== 1 ? 's' : ''} in Bulk Cart
                  </p>
                  <p className="text-sm font-bold tracking-tight">
                    Estimated: {formatINR(estimatedPayable)}{' '}
                    <span className="text-[11px] font-normal opacity-80">
                      ({activeDiscountRate}% Tier Discount)
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCartDrawer(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black dark:bg-black dark:text-white hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Request Volume Quote</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Bulk Quote Request Modal Drawer */}
          {showCartDrawer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Request Commercial Volume Quotation
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowCartDrawer(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Submitting this request will instantly create a live DealFlow360 quotation, compute blended discount risk, and alert your account executive.
                </p>

                {/* Cart items list */}
                <div className="divide-y divide-slate-100 dark:divide-zinc-800/60 max-h-44 overflow-y-auto border border-slate-100 dark:border-zinc-800 rounded-xl p-2 bg-slate-50/50 dark:bg-zinc-950/40">
                  {cartList.map((item) => (
                    <div key={item.product.id} className="py-2.5 px-2 flex items-center justify-between text-xs">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {item.product.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {formatINR(Number(item.product.basePrice))} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.product.id, Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className="w-16 px-2 py-1 text-center font-bold border border-slate-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-xs"
                        />
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom volume discount request input */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Target Volume Discount % (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="80"
                        placeholder={`Pre-negotiated: ${tierDiscount}%`}
                        value={requestedDiscount}
                        onChange={(e) => setRequestedDiscount(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                      Discounts beyond {tierDiscount}% will route for sales operations approval.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Delivery & Fulfillment Requirements
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="e.g. Split delivery across Bangalore and Mumbai branches; required by month end."
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Total Summary */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Catalog Subtotal:</span>
                    <span className="font-mono">{formatINR(cartGrossTotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Target Discount ({activeDiscountRate}%):</span>
                    <span className="font-mono">- {formatINR(estimatedDiscountAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 dark:text-white font-bold pt-1 border-t border-slate-200 dark:border-zinc-800 text-sm">
                    <span>Target Commercial Total:</span>
                    <span>{formatINR(estimatedPayable)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    onClick={() => setShowCartDrawer(false)}
                    className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    Back to Catalog
                  </button>
                  <button
                    onClick={handleRequestBulkQuote}
                    disabled={submittingQuote}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submittingQuote ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Volume Quote Request</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ACTIVE QUOTATIONS & NEGOTIATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'quotations' && (
        <div className="space-y-6">
          {/* KPI Stats */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Active Quotations',
                  value: data?.kpis.activeQuotations ?? 0,
                  icon: <FileText className="w-4 h-4" />,
                },
                {
                  label: 'Awaiting Confirmation',
                  value: data?.kpis.awaitingConfirmation ?? 0,
                  icon: <Clock className="w-4 h-4" />,
                },
                {
                  label: 'Orders Placed',
                  value: data?.kpis.ordersPlaced ?? 0,
                  icon: <CheckCircle className="w-4 h-4" />,
                },
                {
                  label: 'Unread Messages',
                  value: data?.kpis.unreadMessages ?? 0,
                  icon: <MessageSquare className="w-4 h-4" />,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-4 flex items-center gap-4 transition-colors shadow-sm"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-400 shrink-0">
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{s.value}</p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Deal Milestone Journey */}
          {!loading && (readyQuote || data?.quotations?.[0]) && (() => {
            const activeQ = readyQuote || data?.quotations?.[0];
            const matchingOrder = activeQ ? (orders.find((o: any) => o.quotationId === activeQ.id) || (activeQ as any).order) : null;
            let stepperStatus = activeQ?.status || 'DRAFT';
            if (matchingOrder) {
              if (matchingOrder.status === 'FULFILLED') stepperStatus = 'DELIVERED';
              else if (matchingOrder.status === 'PARTIALLY_FULFILLED') stepperStatus = 'PARTIALLY_FULFILLED';
              else if (matchingOrder.status === 'PENDING_FULFILLMENT') stepperStatus = 'CONVERTED_TO_ORDER';
            }
            return (
              <DealLifecycleStepper
                status={stepperStatus}
                quotationNumber={activeQ!.quotationNumber}
                orderNumber={matchingOrder?.orderNumber}
                updatedAt={activeQ!.updatedAt}
              />
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Quotation cards */}
            <div className="lg:col-span-2 xl:col-span-3 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
                  My Commercial Deals
                </h2>
                <span className="text-xs text-slate-400 dark:text-zinc-500">
                  {data?.quotations.length || 0} Total
                </span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : !data?.quotations.length ? (
                <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
                  <Building2 className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">No quotations found</p>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                    Switch to the Storefront tab above to initiate your first commercial bulk quote.
                  </p>
                </div>
              ) : (
                data.quotations.map((q) => {
                  const matchingOrder = orders.find((o: any) => o.quotationId === q.id) || (q as any).order;
                  let cfg = statusConfig[q.status] ?? {
                    label: q.status,
                    variant: 'default',
                    action: 'View',
                  };
                  if (matchingOrder) {
                    if (matchingOrder.status === 'FULFILLED') {
                      cfg = { label: 'Order Delivered ✓', variant: 'success', action: 'Track Order' };
                    } else if (matchingOrder.status === 'PARTIALLY_FULFILLED') {
                      cfg = { label: 'Partially Fulfilled', variant: 'warning', action: 'Track Order' };
                    }
                  }
                  return (
                    <div
                      key={q.id}
                      className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors cursor-pointer shadow-sm"
                      onClick={() => navigate(`/portal/quotations/${q.id}`)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-mono text-slate-700 dark:text-zinc-300 font-semibold text-xs">
                              {q.quotationNumber}
                            </span>
                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                            {matchingOrder && (
                              <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-medium">
                                #{matchingOrder.orderNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">
                            {formatINR(q.totalAmount)}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 dark:text-zinc-500">
                            <span>{q.itemCount} item{q.itemCount !== 1 ? 's' : ''}</span>
                            <span>Account Exec: {q.salesRep}</span>
                            <span>Updated {q.updatedAt}</span>
                            {q.validUntil && <span>Valid until {q.validUntil}</span>}
                          </div>
                        </div>

                        <button
                          className={`self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
                            cfg.variant === 'success'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : q.status === 'APPROVED'
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200'
                              : 'border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (matchingOrder) {
                              setActiveTab('orders');
                            } else {
                              navigate(`/portal/quotations/${q.id}`);
                            }
                          }}
                        >
                          {cfg.action} <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Activity feed */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors h-fit shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">Live Deal Activity</h2>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500">Audit</span>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-zinc-800/60">
                {loading ? (
                  <div className="p-6 text-center text-xs text-slate-400">Loading activity...</div>
                ) : !data?.recentActivity.length ? (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-zinc-500">
                    No recent activity records.
                  </div>
                ) : (
                  data.recentActivity.map((a, i) => (
                    <div
                      key={i}
                      className="px-5 py-3 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition cursor-pointer"
                      onClick={() => a.quotationId && navigate(`/portal/quotations/${a.quotationId}`)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-base shrink-0">{a.icon}</span>
                        <div>
                          <p className="text-xs text-slate-700 dark:text-zinc-300 leading-snug">{a.text}</p>
                          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">{a.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Direct confirmation CTA if approved quote exists */}
          {readyQuote && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  {readyQuote.quotationNumber} is approved and ready to confirm!
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                  Confirm now ({formatINR(readyQuote.totalAmount)}) to lock in discounts and initiate split fulfillment.
                </p>
              </div>
              <button
                onClick={() => navigate(`/portal/quotations/${readyQuote.id}`)}
                className="bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 px-5 py-2.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                Review & Confirm Order <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: ORDERS & MULTI-WAREHOUSE SHIPMENTS TRACKING */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Orders & Multi-Warehouse Fulfillment Tracking
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Live dispatches, warehouse splits, and carrier delivery milestones.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
              {orders.length} Confirmed Orders
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <OrderCardSkeleton key={i} />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
              <Truck className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-200">No Orders Placed Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Once an approved quotation is confirmed, it converts to a Sales Order and triggers automated warehouse fulfillment.
              </p>
              <button
                onClick={() => setActiveTab('quotations')}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-black hover:opacity-90 transition"
              >
                Inspect Quotations
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 transition-colors"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold font-mono text-slate-900 dark:text-white">
                          {order.orderNumber}
                        </h3>
                        <Badge
                          variant={
                            order.status === 'FULFILLED'
                              ? 'success'
                              : order.status === 'PARTIALLY_FULFILLED'
                              ? 'warning'
                              : 'info'
                          }
                        >
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">
                        Confirmed on {new Date(order.confirmedAt || order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Order Value</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {formatINR(Number(order.totalAmount))}
                      </p>
                    </div>
                  </div>

                  {/* Order Journey Stepper */}
                  <DealLifecycleStepper
                    status={order.status === 'FULFILLED' ? 'DELIVERED' : 'CONFIRMED'}
                    orderNumber={order.orderNumber}
                    createdAt={order.createdAt}
                    updatedAt={order.updatedAt}
                  />

                  {/* Multi-Warehouse Split Section */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Multi-Warehouse Dispatch Routes</span>
                    </h4>

                    {order.fulfillments && order.fulfillments.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {order.fulfillments.map((f: any, idx: number) => (
                          <div
                            key={f.id || idx}
                            className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center">
                                  {idx + 1}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                                    {f.warehouse?.name || 'Central Logistics Hub'}
                                  </p>
                                  <p className="text-[11px] text-slate-400">{f.warehouse?.location || 'Direct Dispatch'}</p>
                                </div>
                              </div>
                              <Badge variant={f.status === 'DELIVERED' ? 'success' : 'warning'}>
                                {f.status}
                              </Badge>
                            </div>

                            <div className="text-xs space-y-1 text-slate-600 dark:text-zinc-400 pt-1 border-t border-slate-200 dark:border-zinc-800/60">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Carrier Shipment:</span>
                                <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">
                                  {f.shipmentNumber || `EXP-${f.id.slice(0, 8).toUpperCase()}`}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Allocated Units:</span>
                                <span className="font-semibold">
                                  {f.items?.reduce((s: number, i: any) => s + Number(i.quantity), 0) || 1} units
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-800 text-xs text-slate-500">
                        Allocating regional fulfillment hubs based on real-time stock levels...
                      </div>
                    )}
                  </div>

                  {/* Order Items snapshot */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Commercial Line Items
                    </h4>
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800 border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                      {order.items?.map((it: any) => (
                        <div key={it.id} className="p-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            {it.product?.imageUrl ? (
                              <img
                                src={it.product.imageUrl}
                                alt={it.product.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <Box className="w-8 h-8 text-slate-400" />
                            )}
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{it.product?.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">SKU: {it.product?.sku}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {formatINR(Number(it.lineTotal))}
                            </p>
                            <p className="text-[11px] text-slate-400">Qty: {it.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: ACTIVE SUBSCRIPTIONS & COMMERCIAL INVOICES */}
      {/* ========================================================================= */}
      {activeTab === 'billing' && (
        loading ? (
          <BillingSkeleton />
        ) : (
          <div className="space-y-8">
          {/* Subscriptions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Hybrid Recurring Subscriptions & SLAs</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Continuous cloud licenses, 24/7 SLAs, and managed infrastructure lines.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                {billing.subscriptions.length} Active Subscriptions
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : billing.subscriptions.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                <Repeat className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">No Active Subscriptions</p>
                <p className="text-xs text-slate-400">
                  Subscription lines attached to quotations will appear here upon order conversion.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {billing.subscriptions.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                          <Repeat className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {sub.product?.name || 'Enterprise Cloud SLA'}
                          </h4>
                          <p className="text-xs text-slate-400 font-mono">
                            Plan: {sub.plan?.name || 'Monthly Enterprise Support'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 text-xs space-y-2 text-slate-600 dark:text-zinc-400">
                      <div className="flex justify-between">
                        <span>Recurring Price:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatINR(Number(sub.plan?.price || 15000))} / {sub.plan?.billingInterval?.toLowerCase() || 'month'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next Auto-Renewal:</span>
                        <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">
                          {new Date(sub.nextBillingDate || Date.now() + 30 * 86400000).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoices Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Commercial Invoices & Tax Receipts</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Official GST-compliant tax invoices issued for confirmed sales orders.
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Ledger</span>
              </button>
            </div>

            {loading ? (
              <CardSkeleton />
            ) : billing.invoices.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                <FileText className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">No Invoices Issued</p>
                <p className="text-xs text-slate-400">
                  Commercial tax invoices are automatically generated upon order confirmation.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {billing.invoices.map((inv: any) => (
                    <div
                      key={inv.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2.5 mb-1">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {inv.invoiceNumber}
                          </span>
                          <Badge variant={inv.status === 'PAID' ? 'success' : 'warning'}>
                            {inv.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400">
                          Issued on {new Date(inv.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}{' '}
                          · Due on{' '}
                          {new Date(inv.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[11px] text-slate-400 uppercase">Amount Due</p>
                          <p className="text-base font-bold text-slate-900 dark:text-white">
                            {formatINR(Number(inv.totalAmount))}
                          </p>
                        </div>

                        <button
                          onClick={() => window.print()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        )
      )}
    </div>
  );
}
