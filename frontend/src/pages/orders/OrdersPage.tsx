import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  Filter,
  RefreshCw,
  Package,
  CreditCard,
  Building2,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  X,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  fulfillmentService,
  type Order,
  type OrderItem,
  type Fulfillment,
} from '../../services/fulfillment.service';
import { Badge } from '../../components/ui/Badge';
import { OrdersSkeleton } from '../../components/ui/Skeleton';

export function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fulfillmentService.listOrders();
      setOrders(data || []);
      if (selectedOrder) {
        const refreshed = data.find((o) => o.id === selectedOrder.id);
        if (refreshed) setSelectedOrder(refreshed);
      }
    } catch (err: any) {
      console.error('Failed to load orders:', err);
      setError(err?.response?.data?.message || 'Failed to fetch sales orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filtered orders based on search and status
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const s = search.toLowerCase().trim();
      const matchesSearch =
        !s ||
        o.orderNumber.toLowerCase().includes(s) ||
        o.customer?.companyName?.toLowerCase().includes(s) ||
        o.customer?.name?.toLowerCase().includes(s) ||
        o.customer?.email?.toLowerCase().includes(s) ||
        o.quotation?.quotationNumber?.toLowerCase().includes(s);

      const matchesStatus =
        statusFilter === 'ALL' || o.status.toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // Overall KPI Metrics
  const metrics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const confirmedCount = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PROCESSING').length;
    const fulfilledCount = orders.filter((o) => o.status === 'FULFILLED').length;
    const pendingFulfillment = orders.filter((o) => (o.fulfillments?.length || 0) === 0).length;

    return { totalRevenue, confirmedCount, fulfilledCount, pendingFulfillment };
  }, [orders]);

  const getOrderStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return <Badge variant="info">Confirmed</Badge>;
      case 'PROCESSING':
        return <Badge variant="warning">Processing</Badge>;
      case 'PARTIALLY_FULFILLED':
        return <Badge variant="warning">Partially Fulfilled</Badge>;
      case 'FULFILLED':
        return <Badge variant="success">Fulfilled</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status.replace(/_/g, ' ')}</Badge>;
    }
  };

  if (loading) {
    return <OrdersSkeleton />;
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
                Sales Orders Hub
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Track confirmed client orders, commercial values, connected warehouse shipments, and billing status.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors"
            title="Reload Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/fulfillment')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 transition-colors cursor-pointer"
          >
            <Package className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            <span>Fulfillment Split Engine</span>
          </button>
          <button
            onClick={() => navigate('/billing')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-sm transition-colors cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Invoices & Billing</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Total Orders Value</div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              ₹{metrics.totalRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Across {orders.length} orders</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Confirmed / Processing</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics.confirmedCount}
            </div>
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">Ready for warehouse split</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Unallocated Orders</div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {metrics.pendingFulfillment}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">Needs stock allocation</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Fully Fulfilled</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {metrics.fulfilledCount}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Completed deliveries</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search order #, customer company, quotation #, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 dark:text-zinc-500 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="PARTIALLY_FULFILLED">Partially Fulfilled</option>
            <option value="FULFILLED">Fulfilled</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Orders Pipeline ({filteredOrders.length})
            </h3>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-zinc-500 space-y-2">
            <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-600" />
            <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">No sales orders found.</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm mx-auto">
              Once an approved quotation is confirmed in the Customer Portal or by sales, it converts into a sales order here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Order & Customer</th>
                  <th className="py-3 px-3">Orig. Quote</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Order Status</th>
                  <th className="py-3 px-3">Fulfillment Status</th>
                  <th className="py-3 px-3">Invoicing</th>
                  <th className="py-3 px-3">Total Deal Value</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-800 dark:text-zinc-200">
                {filteredOrders.map((order) => {
                  const fulfillmentsCount = order.fulfillments?.length || 0;
                  const backordersCount = order.backorders?.length || 0;
                  const invoicesCount = order.invoices?.length || 0;
                  const isAllocated = fulfillmentsCount > 0;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <ShoppingCart className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {order.orderNumber}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3" />
                              <span>{order.customer?.companyName || 'Enterprise Account'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono text-slate-600 dark:text-zinc-400">
                        {order.quotation?.quotationNumber ? (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/quotations/${order.quotationId}`);
                            }}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            {order.quotation.quotationNumber}
                          </span>
                        ) : (
                          'Direct'
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {getOrderStatusBadge(order.status)}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isAllocated ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{fulfillmentsCount} Shipment{fulfillmentsCount > 1 ? 's' : ''}</span>
                          </span>
                        ) : backordersCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{backordersCount} Backorder{backordersCount > 1 ? 's' : ''}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Unallocated</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {invoicesCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Invoiced ({invoicesCount})</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Uninvoiced</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                          title="View order details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedOrder.orderNumber}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Placed: {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Quotation Context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs">
              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
                  Customer Account
                </span>
                <span className="font-semibold text-slate-900 dark:text-white text-sm">
                  {selectedOrder.customer?.companyName || 'Enterprise Client'}
                </span>
                <p className="text-slate-500 dark:text-zinc-400 mt-0.5">
                  {selectedOrder.customer?.name} • {selectedOrder.customer?.email}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
                  Originating Deal
                </span>
                <span className="font-semibold text-slate-900 dark:text-white text-sm font-mono">
                  {selectedOrder.quotation?.quotationNumber || 'Direct Order'}
                </span>
                <p className="text-slate-500 dark:text-zinc-400 mt-0.5">
                  Total Value: ₹{Number(selectedOrder.totalAmount).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Line items list */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
                Order Line Items ({selectedOrder.items?.length || 0})
              </h4>
              <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800">
                {selectedOrder.items?.map((item: OrderItem) => {
                  const isRec = item.product?.isRecurring;
                  return (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {item.product?.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          SKU: {item.product?.sku} • {item.quantity} units @ ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                          {isRec && (
                            <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                              (Recurring Monthly)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        ₹{(Number(item.quantity) * Number(item.unitPrice)).toLocaleString('en-IN')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warehouse Fulfillments & Shipments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Warehouse Split Shipments ({selectedOrder.fulfillments?.length || 0})
                </h4>
                <button
                  onClick={() => navigate('/fulfillment')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Split Engine</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {!selectedOrder.fulfillments || selectedOrder.fulfillments.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-center text-xs text-slate-400">
                  No warehouse fulfillments allocated yet. Click "Open Split Engine" to run auto-allocation across warehouses.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedOrder.fulfillments.map((f: Fulfillment) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Package className="w-4 h-4 text-slate-400" />
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {f.warehouse?.name || 'Warehouse Depot'}
                          </span>
                          <span className="text-slate-400 text-[11px] block">
                            Shipment #{f.shipmentNumber || 'Pending Dispatch'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                          {f.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => navigate('/fulfillment')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition cursor-pointer"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Manage Warehouse Split</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
