import { useState, useEffect, useCallback } from 'react';
import {
  Package, Truck, Warehouse as WarehouseIcon, RefreshCw, AlertTriangle,
  MapPin, Zap, GitBranch, CheckCircle2, XCircle, Clock, ChevronRight,
  BarChart3, BoxSelect, Settings2, ArrowRight, Send, ShieldCheck,
  PackageX, Layers, Scale, Plus, X, Loader2,
} from 'lucide-react';
import {
  fulfillmentService,
  type Warehouse, type Order, type Fulfillment, type Backorder,
  type AllocationPlan, type ManualSplitInput, type OrderItem,
} from '../../services/fulfillment.service';
import { Badge } from '../../components/ui/Badge';

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────

function fmtINR(n: number) {
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function statusBadge(status: string) {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
    ALLOCATED: 'info',
    PICKED: 'warning',
    SHIPPED: 'warning',
    DELIVERED: 'success',
    CANCELLED: 'danger',
    PENDING_FULFILLMENT: 'warning',
    PARTIALLY_FULFILLED: 'warning',
    FULFILLED: 'success',
    OPEN: 'danger',
    PARTIALLY_FULFILLED_BO: 'warning',
    FULFILLED_BO: 'success',
  };
  const v = map[status] ?? 'default';
  const label = status.replace(/_/g, ' ');
  return <Badge variant={v}>{label}</Badge>;
}

// ──────────────────────────────────────────────────────────────
// KPI BANNER
// ──────────────────────────────────────────────────────────────

interface KPIProps { label: string; value: string | number; sub?: string; icon: React.ReactNode; accent: string; }
function KPICard({ label, value, sub, icon, accent }: KPIProps) {
  return (
    <div className={`relative overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm`}>
      <div className={`absolute inset-0 opacity-5 dark:opacity-10 ${accent}`} />
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">{value}</p>
          {sub && <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white ${accent.replace('bg-', 'bg-').split(' ')[0]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// ALLOCATION PLAN RESULT CARD
// ──────────────────────────────────────────────────────────────

interface AllocationPreviewProps {
  plan: AllocationPlan;
  onCommit: () => void;
  committing: boolean;
  already: boolean;
}
function AllocationPreview({ plan, onCommit, committing, already }: AllocationPreviewProps) {
  const statusColor = plan.status === 'FULLY_ALLOCATED'
    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400'
    : plan.status === 'PARTIALLY_ALLOCATED'
    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400'
    : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400';

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${statusColor}`}>
        {plan.status === 'FULLY_ALLOCATED' ? <CheckCircle2 className="w-4 h-4" /> :
         plan.status === 'PARTIALLY_ALLOCATED' ? <AlertTriangle className="w-4 h-4" /> :
         <XCircle className="w-4 h-4" />}
        {plan.status.replace(/_/g, ' ')}
        {plan.backorderedQty > 0 && (
          <span className="ml-auto text-xs font-normal">{plan.backorderedQty} units backordered</span>
        )}
      </div>

      {/* Split grid */}
      {plan.splits.length > 0 ? (
        <div className="grid gap-2">
          {plan.splits.map((s, i) => (
            <div key={s.warehouseId} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800">
              <div className="flex-shrink-0 w-7 h-7 rounded-md bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{s.warehouseName}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{s.location} · {s.shippingWeight}x freight
                </p>
              </div>
              <div className="text-right text-xs">
                <p className="font-semibold text-slate-900 dark:text-white font-mono">{s.allocatedQty} units</p>
                <p className="text-slate-500 dark:text-zinc-400">{fmtINR(s.estimatedCost)} freight</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
          No warehouses have sufficient stock for this order.
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800 pt-3">
        <span>{plan.totalShipments} shipment{plan.totalShipments !== 1 ? 's' : ''}</span>
        <span className="font-mono font-semibold text-slate-900 dark:text-white">
          {fmtINR(plan.totalEstimatedFreight)} total freight
        </span>
      </div>

      {/* Commit button */}
      {!already && plan.splits.length > 0 && (
        <button
          onClick={onCommit}
          disabled={committing}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold rounded-lg hover:bg-slate-700 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
        >
          {committing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {committing ? 'Committing...' : 'Commit Auto-Split & Reserve Stock'}
        </button>
      )}
      {already && (
        <p className="text-center text-xs text-slate-400 dark:text-zinc-500">
          This order already has fulfillment allocations.
        </p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MANUAL OVERRIDE MODAL
// ──────────────────────────────────────────────────────────────

interface ManualOverrideModalProps {
  order: Order;
  warehouses: Warehouse[];
  onClose: () => void;
  onCommit: (splits: ManualSplitInput[]) => Promise<void>;
}
function ManualOverrideModal({ order, warehouses, onClose, onCommit }: ManualOverrideModalProps) {
  const physicalItems = order.items.filter((i: OrderItem) => i.product);
  const [splits, setSplits] = useState<ManualSplitInput[]>(
    physicalItems.map((item: OrderItem) => ({ productId: item.productId, warehouseId: '', quantity: 0 }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (idx: number, field: 'warehouseId' | 'quantity', val: string) => {
    setSplits(prev => prev.map((s, i) => i === idx ? { ...s, [field]: field === 'quantity' ? Number(val) : val } : s));
  };

  const handleSubmit = async () => {
    const valid = splits.filter(s => s.warehouseId && s.quantity > 0);
    if (valid.length === 0) { setError('Add at least one valid split.'); return; }
    setLoading(true); setError(null);
    try { await onCommit(valid); onClose(); }
    catch (e: any) { setError(e.response?.data?.message || e.message || 'Failed to commit'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Manual Warehouse Override</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{order.orderNumber}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {physicalItems.map((item: OrderItem, idx: number) => {
            const split = splits[idx];
            const selWh = warehouses.find(w => w.id === split?.warehouseId);
            const inv = selWh?.inventory.find(i => i.productId === item.productId);
            const avail = inv ? Math.max(0, Number(inv.availableQty) - Number(inv.reservedQty)) : null;
            return (
              <div key={item.id} className="rounded-xl border border-slate-200 dark:border-zinc-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.product?.name}</span>
                  <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">
                    Required: {Number(item.quantity)} {item.product?.unit}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-zinc-400 mb-1 block">Warehouse</label>
                    <select
                      value={split?.warehouseId || ''}
                      onChange={e => handleChange(idx, 'warehouseId', e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">Select warehouse...</option>
                      {warehouses.map(wh => (
                        <option key={wh.id} value={wh.id}>{wh.name} ({wh.location})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-zinc-400 mb-1 block">
                      Quantity {avail !== null && <span className="text-emerald-600 dark:text-emerald-400">(avail: {avail})</span>}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={avail ?? 9999}
                      value={split?.quantity || ''}
                      onChange={e => handleChange(idx, 'quantity', e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="0"
                    />
                    {avail !== null && split?.quantity > avail && (
                      <p className="text-[10px] text-red-500 mt-0.5">Exceeds available stock!</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 dark:border-zinc-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold rounded-lg hover:bg-slate-700 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
            {loading ? 'Committing...' : 'Commit Manual Split'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SHIP MODAL
// ──────────────────────────────────────────────────────────────

interface ShipModalProps {
  fulfillment: Fulfillment;
  onClose: () => void;
  onShip: (trackingNumber: string) => Promise<void>;
}
function ShipModal({ fulfillment, onClose, onShip }: ShipModalProps) {
  const [tracking, setTracking] = useState(fulfillment.shipmentNumber || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true); setError(null);
    try { await onShip(tracking); onClose(); }
    catch (e: any) { setError(e.response?.data?.message || e.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-500" />Dispatch Shipment
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"><X className="w-4 h-4 text-slate-500 dark:text-zinc-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-500 dark:text-zinc-400">Warehouse: <span className="font-semibold text-slate-800 dark:text-zinc-200">{fulfillment.warehouse?.name}</span></p>
          <div>
            <label className="text-xs text-slate-500 dark:text-zinc-400 mb-1 block">Tracking / Shipment Number (optional)</label>
            <input
              type="text"
              value={tracking}
              onChange={e => setTracking(e.target.value)}
              placeholder="e.g. SHIP-ABC1-1 or carrier tracking..."
              className="w-full text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 dark:border-zinc-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
            {loading ? 'Dispatching...' : 'Mark as Shipped'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// RESTOCK MODAL
// ──────────────────────────────────────────────────────────────

interface RestockModalProps {
  warehouse: Warehouse;
  onClose: () => void;
  onRestock: (productId: string, qty: number) => Promise<void>;
}
function RestockModal({ warehouse, onClose, onRestock }: RestockModalProps) {
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const n = Number(qty);
    if (!productId || isNaN(n) || n <= 0) { setError('Select a product and enter a positive quantity.'); return; }
    setLoading(true); setError(null);
    try { await onRestock(productId, n); onClose(); }
    catch (e: any) { setError(e.response?.data?.message || e.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-500" />Restock Inventory
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"><X className="w-4 h-4 text-slate-500 dark:text-zinc-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-500 dark:text-zinc-400">Warehouse: <span className="font-semibold text-slate-800 dark:text-zinc-200">{warehouse.name} · {warehouse.location}</span></p>
          <div>
            <label className="text-xs text-slate-500 dark:text-zinc-400 mb-1 block">Product</label>
            <select
              value={productId}
              onChange={e => setProductId(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="">Select product...</option>
              {warehouse.inventory.map(inv => (
                <option key={inv.productId} value={inv.productId}>
                  {inv.product.name} ({inv.product.sku}) — {Number(inv.availableQty)} in stock
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-zinc-400 mb-1 block">Quantity to Add</label>
            <input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 100"
              className="w-full text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400" />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500">Restocking will automatically trigger FIFO backorder resolution for this product.</p>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 dark:border-zinc-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? 'Restocking...' : 'Restock & Resolve Backorders'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// TAB 1: ORDER ROUTING & SPLIT ENGINE
// ──────────────────────────────────────────────────────────────

interface RoutingTabProps {
  orders: Order[];
  warehouses: Warehouse[];
  onRefresh: () => void;
}
function RoutingTab({ orders, warehouses, onRefresh }: RoutingTabProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(orders[0] ?? null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [plan, setPlan] = useState<AllocationPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const filtered = statusFilter === 'ALL' ? orders : orders.filter(o => o.status === statusFilter);

  const fetchPlan = useCallback(async (order: Order) => {
    setPlan(null); setPlanError(null); setPlanLoading(true);
    try {
      const p = await fulfillmentService.getAutoAllocationPlan(order.id);
      setPlan(p);
    } catch (e: any) {
      setPlanError(e.response?.data?.message || 'Failed to generate plan');
    } finally {
      setPlanLoading(false);
    }
  }, []);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setPlan(null); setPlanError(null);
    if (order.fulfillments?.length === 0) fetchPlan(order);
  };

  const handleCommitAuto = async () => {
    if (!selectedOrder) return;
    setCommitting(true);
    try {
      await fulfillmentService.commitAutoAllocation(selectedOrder.id);
      setActionMsg('✅ Auto-split committed! Inventory reserved.');
      onRefresh();
    } catch (e: any) {
      setPlanError(e.response?.data?.message || 'Failed to commit');
    } finally { setCommitting(false); }
  };

  const handleCommitManual = async (splits: ManualSplitInput[]) => {
    if (!selectedOrder) return;
    await fulfillmentService.commitManualAllocation(selectedOrder.id, splits);
    setActionMsg('✅ Manual allocation committed!');
    onRefresh();
  };

  const statusOptions = ['ALL', 'PENDING_FULFILLMENT', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED'];

  const alreadyAllocated = (selectedOrder?.fulfillments?.length ?? 0) > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Orders list */}
      <div className="lg:col-span-4 space-y-3">
        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {statusOptions.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${statusFilter === s ? 'bg-slate-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'}`}>
              {s === 'ALL' ? 'All' : s.replace(/_/g, ' ').replace('FULFILLMENT', '').trim()}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm space-y-2 max-h-[600px] overflow-y-auto">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 pb-1">
            <Package className="w-3.5 h-3.5" />Orders ({filtered.length})
          </h3>
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">No orders found.</div>
          ) : filtered.map(ord => (
            <div key={ord.id} onClick={() => handleSelectOrder(ord)}
              className={`p-3 rounded-lg border cursor-pointer transition-all text-xs ${selectedOrder?.id === ord.id ? 'border-slate-900 dark:border-zinc-400 bg-slate-50 dark:bg-zinc-800/60' : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-slate-900 dark:text-white">{ord.orderNumber}</span>
                {statusBadge(ord.status)}
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
                <span className="truncate">{ord.customer?.companyName}</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200 ml-2">{fmtINR(ord.totalAmount)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">{ord.items?.length ?? 0} items · {ord.fulfillments?.length ?? 0} shipments</span>
                {(ord.backorders?.length ?? 0) > 0 && <span className="text-[10px] text-amber-600 dark:text-amber-400">⚠ backorder</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Detail + Plan */}
      <div className="lg:col-span-8 space-y-4">
        {!selectedOrder ? (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-16 text-center text-xs text-slate-400 dark:text-zinc-500 shadow-sm">
            Select an order to view its routing plan.
          </div>
        ) : (
          <>
            {/* Order header card */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold font-mono text-slate-900 dark:text-white">{selectedOrder.orderNumber}</h3>
                    {statusBadge(selectedOrder.status)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{selectedOrder.customer?.companyName} · {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex gap-2">
                  {!alreadyAllocated && (
                    <>
                      <button onClick={() => fetchPlan(selectedOrder)} disabled={planLoading}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                        {planLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <BarChart3 className="w-3 h-3" />}Preview Plan
                      </button>
                      <button onClick={() => setShowManual(true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
                        <Settings2 className="w-3 h-3" />Manual Override
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Order items */}
              {selectedOrder.items?.length > 0 && (
                <div className="mt-4 border-t border-slate-100 dark:border-zinc-800 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">Order Snapshot</p>
                  <div className="space-y-1.5">
                    {selectedOrder.items.map((item: OrderItem) => (
                      <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-zinc-800/50 last:border-0">
                        <div className="flex items-center gap-2">
                          <BoxSelect className="w-3 h-3 text-slate-400 dark:text-zinc-500 flex-shrink-0" />
                          <span className="text-slate-800 dark:text-zinc-200 font-medium">{item.product?.name}</span>
                          <span className="text-slate-400 dark:text-zinc-500 font-mono text-[10px]">{item.product?.sku}</span>
                        </div>
                        <div className="flex items-center gap-4 font-mono">
                          <span className="text-slate-600 dark:text-zinc-300">{Number(item.quantity)} {item.product?.unit}</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{fmtINR(Number(item.lineTotal))}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action feedback */}
            {actionMsg && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{actionMsg}
              </div>
            )}

            {/* Auto-allocation plan card */}
            {!alreadyAllocated && (plan || planLoading || planError) && (
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 mb-4">
                  <Zap className="w-4 h-4 text-amber-500" />Automated Routing Plan
                </h4>
                {planLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-6 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />Calculating optimal splits...
                  </div>
                )}
                {planError && (
                  <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />{planError}
                  </div>
                )}
                {plan && !planLoading && (
                  <AllocationPreview plan={plan} onCommit={handleCommitAuto} committing={committing} already={alreadyAllocated} />
                )}
              </div>
            )}

            {/* Existing fulfillments */}
            {alreadyAllocated && (
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-500" />Active Fulfillment Splits
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {selectedOrder.fulfillments.map(f => (
                    <div key={f.id} className="p-3 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs space-y-1.5 bg-slate-50/50 dark:bg-zinc-950/40">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-900 dark:text-white">{f.warehouse?.name}</span>
                        {statusBadge(f.status)}
                      </div>
                      <p className="text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{f.warehouse?.location}
                      </p>
                      {f.shipmentNumber && <p className="font-mono text-slate-600 dark:text-zinc-400 text-[10px]">#{f.shipmentNumber}</p>}
                      <div className="flex justify-between border-t border-slate-100 dark:border-zinc-800 pt-1.5">
                        <span className="text-slate-500 dark:text-zinc-400">{f.items?.length ?? 0} items</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">{fmtINR(Number(f.estimatedCost))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Backorder alert */}
            {(selectedOrder.backorders?.length ?? 0) > 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" />Backorders Queued
                </div>
                {selectedOrder.backorders.map((bo: Backorder) => (
                  <div key={bo.id} className="flex items-center justify-between text-amber-700 dark:text-amber-300">
                    <span>{bo.product?.name}</span>
                    <span className="font-mono">{Number(bo.quantity) - Number(bo.fulfilledQty)} units pending</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showManual && selectedOrder && (
        <ManualOverrideModal
          order={selectedOrder}
          warehouses={warehouses}
          onClose={() => setShowManual(false)}
          onCommit={handleCommitManual}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// TAB 2: SHIPMENT DISPATCH HUB
// ──────────────────────────────────────────────────────────────

interface DispatchTabProps {
  orders: Order[];
  onRefresh: () => void;
}
function DispatchTab({ orders, onRefresh }: DispatchTabProps) {
  const [filter, setFilter] = useState<string>('ALL');
  const [shipTarget, setShipTarget] = useState<Fulfillment | null>(null);
  const [delivering, setDelivering] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const allFulfillments: (Fulfillment & { orderNumber: string; customerName: string })[] = orders.flatMap(o =>
    (o.fulfillments ?? []).map(f => ({
      ...f,
      orderNumber: o.orderNumber,
      customerName: o.customer?.companyName ?? '',
    }))
  );

  const filtered = filter === 'ALL' ? allFulfillments : allFulfillments.filter(f => f.status === filter);
  const statusFilters = ['ALL', 'ALLOCATED', 'PICKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleShip = async (trackingNumber: string) => {
    if (!shipTarget) return;
    await fulfillmentService.shipFulfillment(shipTarget.id, trackingNumber || undefined);
    showToast('✅ Shipment dispatched successfully');
    onRefresh();
  };

  const handleDeliver = async (f: Fulfillment) => {
    setDelivering(f.id);
    try {
      await fulfillmentService.deliverFulfillment(f.id);
      showToast('✅ Delivery confirmed. Reserved stock released.');
      onRefresh();
    } catch (e: any) { showToast('❌ ' + (e.response?.data?.message || 'Failed')); }
    finally { setDelivering(null); }
  };

  const handleCancel = async (f: Fulfillment) => {
    if (!confirm(`Cancel shipment ${f.shipmentNumber ?? f.id.slice(0, 8)}? Stock will be released back to available.`)) return;
    setCancelling(f.id);
    try {
      await fulfillmentService.cancelFulfillment(f.id);
      showToast('Shipment cancelled. Inventory restored.');
      onRefresh();
    } catch (e: any) { showToast('❌ ' + (e.response?.data?.message || 'Failed')); }
    finally { setCancelling(null); }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm px-4 py-2.5 rounded-xl shadow-xl animate-in slide-in-from-top-2 duration-300">
          {toast}
        </div>
      )}

      {/* Filter row */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-slate-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'}`}>
            {s === 'ALL' ? `All (${allFulfillments.length})` : s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-16 text-center text-xs text-slate-400 dark:text-zinc-500 shadow-sm">
          No shipments found with this status.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((f) => (
            <div key={f.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono font-bold text-sm text-slate-900 dark:text-white">{(f as any).orderNumber}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{(f as any).customerName}</p>
                </div>
                {statusBadge(f.status)}
              </div>
              {/* Warehouse */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-300">
                <WarehouseIcon className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                <span className="font-semibold">{f.warehouse?.name}</span>
                <span className="text-slate-400 dark:text-zinc-500">· {f.warehouse?.location}</span>
              </div>
              {/* Tracking */}
              {f.shipmentNumber && (
                <div className="font-mono text-[11px] text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-950/50 px-2 py-1 rounded-md">
                  #{f.shipmentNumber}
                </div>
              )}
              {/* Timestamps */}
              <div className="text-[10px] text-slate-400 dark:text-zinc-500 space-y-0.5">
                {f.shippedAt && <p>Shipped: {new Date(f.shippedAt).toLocaleString('en-IN')}</p>}
                {f.deliveredAt && <p className="text-emerald-600 dark:text-emerald-400">Delivered: {new Date(f.deliveredAt).toLocaleString('en-IN')}</p>}
              </div>
              {/* Freight */}
              <div className="flex items-center justify-between text-xs border-t border-slate-100 dark:border-zinc-800 pt-2">
                <span className="text-slate-500 dark:text-zinc-400">{f.items?.length ?? 0} items</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">{fmtINR(Number(f.estimatedCost))}</span>
              </div>
              {/* Actions */}
              <div className="flex gap-2">
                {f.status === 'ALLOCATED' && (
                  <>
                    <button onClick={() => setShipTarget(f as Fulfillment)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors">
                      <Send className="w-3 h-3" />Dispatch
                    </button>
                    <button onClick={() => handleCancel(f as Fulfillment)} disabled={cancelling === f.id}
                      className="px-2.5 py-1.5 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                      {cancelling === f.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                    </button>
                  </>
                )}
                {f.status === 'SHIPPED' && (
                  <button onClick={() => handleDeliver(f as Fulfillment)} disabled={delivering === f.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors">
                    {delivering === f.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                    {delivering === f.id ? 'Confirming...' : 'Confirm Delivery'}
                  </button>
                )}
                {(f.status === 'DELIVERED' || f.status === 'CANCELLED') && (
                  <div className="flex-1 text-center text-[11px] text-slate-400 dark:text-zinc-500 py-2">
                    {f.status === 'DELIVERED' ? '✓ Completed' : '✗ Cancelled'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {shipTarget && (
        <ShipModal fulfillment={shipTarget} onClose={() => setShipTarget(null)} onShip={handleShip} />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// TAB 3: BACKORDER QUEUE
// ──────────────────────────────────────────────────────────────

interface BackorderTabProps {
  backorders: Backorder[];
  onRefresh: () => void;
}
function BackorderTab({ backorders, onRefresh }: BackorderTabProps) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const openBackorders = backorders.filter(b => b.status === 'OPEN' || b.status === 'PARTIALLY_FULFILLED');
  const resolvedBackorders = backorders.filter(b => b.status === 'FULFILLED' || b.status === 'CANCELLED');

  const handleProcess = async (bo: Backorder) => {
    setProcessing(bo.id);
    try {
      await fulfillmentService.processBackorders(bo.productId);
      showToast('✅ FIFO backorder resolution triggered.');
      onRefresh();
    } catch (e: any) { showToast('❌ ' + (e.response?.data?.message || 'Failed')); }
    finally { setProcessing(null); }
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm px-4 py-2.5 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Summary banners */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">{openBackorders.length}</p>
          <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">Open Backorders</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
            {openBackorders.reduce((s, b) => s + (Number(b.quantity) - Number(b.fulfilledQty)), 0)}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Units Pending</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{resolvedBackorders.length}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Resolved</p>
        </div>
      </div>

      {/* Open Backorders */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
          <PackageX className="w-3.5 h-3.5 text-red-400" />FIFO Queue — Open Backorders
        </h3>
        {openBackorders.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-10 text-center text-xs text-slate-400 dark:text-zinc-500 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />No open backorders — all orders fully stocked!
          </div>
        ) : openBackorders.map((bo, idx) => {
          const remaining = Number(bo.quantity) - Number(bo.fulfilledQty);
          const pct = Math.round((Number(bo.fulfilledQty) / Number(bo.quantity)) * 100);
          return (
            <div key={bo.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{bo.product?.name}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Order: <span className="font-mono font-semibold">{bo.order?.orderNumber}</span> · {bo.order?.customer?.companyName}
                    </p>
                    <p className="text-xs font-mono text-slate-400 dark:text-zinc-500">{bo.product?.sku}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(bo.status)}
                  <button onClick={() => handleProcess(bo)} disabled={!!processing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                    {processing === bo.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                    Resolve
                  </button>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                  <span>{Number(bo.fulfilledQty)} fulfilled of {Number(bo.quantity)} units</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">{remaining} units needed</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-2">
                Queued: {new Date(bo.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
          );
        })}
      </div>

      {/* Resolved */}
      {resolvedBackorders.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Resolved Backorders
          </h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {resolvedBackorders.map(bo => (
              <div key={bo.id} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-zinc-200 truncate">{bo.product?.name}</p>
                  <p className="text-slate-500 dark:text-zinc-400">{bo.order?.orderNumber} · {Number(bo.quantity)} units</p>
                </div>
                {statusBadge(bo.status)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// TAB 4: WAREHOUSE STOCK MATRIX
// ──────────────────────────────────────────────────────────────

interface StockTabProps {
  warehouses: Warehouse[];
  onRefresh: () => void;
}
function StockTab({ warehouses, onRefresh }: StockTabProps) {
  const [restockTarget, setRestockTarget] = useState<Warehouse | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleRestock = async (productId: string, qty: number) => {
    if (!restockTarget) return;
    await fulfillmentService.restockInventory(restockTarget.id, productId, qty);
    showToast('✅ Stock restocked and backorders auto-resolved!');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm px-4 py-2.5 rounded-xl shadow-xl">
          {toast}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {warehouses.map(wh => {
          const totalAvail = wh.inventory.reduce((s, i) => s + Number(i.availableQty), 0);
          const totalReserved = wh.inventory.reduce((s, i) => s + Number(i.reservedQty), 0);
          return (
            <div key={wh.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
              {/* Warehouse header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <WarehouseIcon className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{wh.name}</h3>
                    {wh.isActive
                      ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold">ACTIVE</span>
                      : <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 font-semibold">INACTIVE</span>
                    }
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    <MapPin className="w-3 h-3" />{wh.location}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
                    <Scale className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
                    <span className="font-mono font-semibold text-slate-700 dark:text-zinc-300">{Number(wh.shippingWeight)}x</span>
                    <span className="text-slate-500 dark:text-zinc-400">freight</span>
                  </div>
                  <button onClick={() => setRestockTarget(wh)}
                    className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg font-semibold transition-colors">
                    <Plus className="w-3 h-3" />Restock
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 dark:bg-zinc-950/40 rounded-lg p-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">{wh.inventory.length}</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500">Products</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">{Math.round(totalAvail)}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-500">Available</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 font-mono">{Math.round(totalReserved)}</p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-500">Reserved</p>
                </div>
              </div>

              {/* Inventory table */}
              <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-1.5 max-h-60 overflow-y-auto">
                {wh.inventory.length === 0 ? (
                  <p className="text-xs text-center text-slate-400 dark:text-zinc-500 py-4">No inventory records</p>
                ) : wh.inventory.map(inv => {
                  const avail = Math.max(0, Number(inv.availableQty) - Number(inv.reservedQty));
                  const total = Number(inv.availableQty);
                  const utilPct = total > 0 ? Math.min(100, Math.round((Number(inv.reservedQty) / total) * 100)) : 0;
                  const low = avail <= Number(inv.reorderLevel);
                  return (
                    <div key={inv.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Layers className="w-3 h-3 text-slate-400 dark:text-zinc-500 flex-shrink-0" />
                          <span className="text-slate-800 dark:text-zinc-200 font-medium truncate">{inv.product?.name}</span>
                          {low && <span className="flex-shrink-0 text-[9px] px-1 rounded bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">LOW</span>}
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px] flex-shrink-0 ml-2">
                          <span className="text-emerald-600 dark:text-emerald-400">{Math.round(avail)} avail</span>
                          {Number(inv.reservedQty) > 0 && <span className="text-amber-600 dark:text-amber-400">{Math.round(Number(inv.reservedQty))} rsv</span>}
                        </div>
                      </div>
                      <div className="w-full h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${utilPct > 80 ? 'bg-red-500' : utilPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${utilPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {restockTarget && (
        <RestockModal warehouse={restockTarget} onClose={() => setRestockTarget(null)} onRestock={handleRestock} />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'routing', label: 'Order Routing', icon: <GitBranch className="w-3.5 h-3.5" /> },
  { id: 'dispatch', label: 'Shipment Dispatch', icon: <Truck className="w-3.5 h-3.5" /> },
  { id: 'backorders', label: 'Backorder Queue', icon: <PackageX className="w-3.5 h-3.5" /> },
  { id: 'stock', label: 'Stock Matrix', icon: <WarehouseIcon className="w-3.5 h-3.5" /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function FulfillmentPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [backorders, setBackorders] = useState<Backorder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('routing');

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [wh, ord, bos] = await Promise.all([
        fulfillmentService.listWarehouses(),
        fulfillmentService.listOrders(),
        fulfillmentService.listBackorders(),
      ]);
      setWarehouses(wh);
      setOrders(ord);
      setBackorders(bos);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load fulfillment data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // KPI calculations
  const pendingOrders = orders.filter(o => o.status === 'PENDING_FULFILLMENT').length;
  const activeShipments = orders.flatMap(o => o.fulfillments).filter(f => f.status === 'ALLOCATED' || f.status === 'SHIPPED').length;
  const openBackorderUnits = backorders.filter(b => b.status === 'OPEN' || b.status === 'PARTIALLY_FULFILLED')
    .reduce((s, b) => s + (Number(b.quantity) - Number(b.fulfilledQty)), 0);
  const allFulfillments = orders.flatMap(o => o.fulfillments);
  const deliveredCount = allFulfillments.filter(f => f.status === 'DELIVERED').length;
  const totalFulfillments = allFulfillments.length;
  const fulfillRate = totalFulfillments > 0 ? Math.round((deliveredCount / totalFulfillments) * 100) : 0;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-500" />
            Operations & Fulfillment
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Multi-warehouse split routing, shipment dispatching, and backorder resolution.
          </p>
        </div>
        <button onClick={fetchAll} disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
        </div>
      )}

      {/* KPI Banner */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard label="Pending Orders" value={pendingOrders} sub="Awaiting split allocation" icon={<Clock className="w-4 h-4" />} accent="bg-amber-500" />
          <KPICard label="Active Shipments" value={activeShipments} sub="Allocated & in-transit" icon={<Truck className="w-4 h-4" />} accent="bg-blue-500" />
          <KPICard label="Backorder Units" value={openBackorderUnits} sub="Queued for restock" icon={<PackageX className="w-4 h-4" />} accent="bg-red-500" />
          <KPICard label="Fulfillment Rate" value={`${fulfillRate}%`} sub={`${deliveredCount} of ${totalFulfillments} shipments delivered`} icon={<CheckCircle2 className="w-4 h-4" />} accent="bg-emerald-500" />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-zinc-800">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
            }`}
          >
            {tab.icon}{tab.label}
            {tab.id === 'backorders' && backorders.filter(b => b.status === 'OPEN' || b.status === 'PARTIALLY_FULFILLED').length > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                {backorders.filter(b => b.status === 'OPEN' || b.status === 'PARTIALLY_FULFILLED').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400 dark:text-zinc-500 gap-2 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />Loading fulfillment data...
        </div>
      ) : (
        <>
          {activeTab === 'routing' && <RoutingTab orders={orders} warehouses={warehouses} onRefresh={fetchAll} />}
          {activeTab === 'dispatch' && <DispatchTab orders={orders} onRefresh={fetchAll} />}
          {activeTab === 'backorders' && <BackorderTab backorders={backorders} onRefresh={fetchAll} />}
          {activeTab === 'stock' && <StockTab warehouses={warehouses} onRefresh={fetchAll} />}
        </>
      )}
    </div>
  );
}
