import api from './api';
import type { Customer } from '../types';

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

export interface WarehouseInventory {
  id: string;
  warehouseId: string;
  productId: string;
  availableQty: number;
  reservedQty: number;
  reorderLevel: number;
  product: {
    id: string;
    name: string;
    sku: string;
    basePrice: number;
    unit: string;
  };
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  shippingWeight: number;
  isActive: boolean;
  inventory: WarehouseInventory[];
}

export interface FulfillmentItem {
  id: string;
  fulfillmentId: string;
  orderItemId: string;
  productId: string;
  quantity: number;
  orderItem?: {
    product?: { id: string; name: string; sku: string };
    unitPrice?: number;
  };
}

export interface Fulfillment {
  id: string;
  orderId: string;
  warehouseId: string;
  status: 'ALLOCATED' | 'PICKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shipmentNumber: string | null;
  estimatedCost: number;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  warehouse: Warehouse;
  items: FulfillmentItem[];
  order?: { orderNumber: string; customer?: Customer };
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: { id: string; name: string; sku: string; unit: string };
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: Customer;
  quotationId: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  items: OrderItem[];
  fulfillments: Fulfillment[];
  backorders: Backorder[];
  invoices?: any[];
  subscriptions?: any[];
  createdAt: string;
}

export interface Backorder {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  fulfilledQty: number;
  status: 'OPEN' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED';
  createdAt: string;
  fulfilledAt: string | null;
  product: { id: string; name: string; sku: string };
  order: { id: string; orderNumber: string; customer?: Customer };
}

export interface SplitPlanItem {
  warehouseId: string;
  warehouseName: string;
  location: string;
  shippingWeight: number;
  allocatedQty: number;
  estimatedCost: number;
}

export interface AllocationPlan {
  orderId: string;
  splits: SplitPlanItem[];
  backorderedQty: number;
  totalShipments: number;
  totalEstimatedFreight: number;
  status: 'FULLY_ALLOCATED' | 'PARTIALLY_ALLOCATED' | 'BACKORDER_REQUIRED';
}

export interface ManualSplitInput {
  productId: string;
  warehouseId: string;
  quantity: number;
}

// ────────────────────────────────────────────────────────────────────────────
// SERVICE
// ────────────────────────────────────────────────────────────────────────────

export const fulfillmentService = {
  // Warehouses
  async listWarehouses(): Promise<Warehouse[]> {
    const res = await api.get('/fulfillment/warehouses');
    return res.data.data;
  },

  async restockInventory(warehouseId: string, productId: string, quantity: number): Promise<WarehouseInventory> {
    const res = await api.post(`/fulfillment/warehouses/${warehouseId}/restock`, { productId, quantity });
    return res.data.data;
  },

  // Orders
  async listOrders(): Promise<Order[]> {
    const res = await api.get('/fulfillment/orders');
    return res.data.data;
  },

  async getOrderFulfillment(orderId: string): Promise<Order> {
    const res = await api.get(`/fulfillment/orders/${orderId}`);
    return res.data.data;
  },

  // Allocation — preview
  async getAutoAllocationPlan(orderId: string): Promise<AllocationPlan> {
    const res = await api.get(`/fulfillment/orders/${orderId}/allocation-plan`);
    return res.data.data;
  },

  // Allocation — commit
  async commitAutoAllocation(orderId: string): Promise<{ order: Order; plan: AllocationPlan }> {
    const res = await api.post(`/fulfillment/orders/${orderId}/auto-allocate`);
    return res.data.data;
  },

  async commitManualAllocation(orderId: string, splits: ManualSplitInput[]): Promise<{ order: Order; plan: AllocationPlan }> {
    const res = await api.post(`/fulfillment/orders/${orderId}/manual-allocation`, { splits });
    return res.data.data;
  },

  // Shipment lifecycle
  async shipFulfillment(fulfillmentId: string, trackingNumber?: string): Promise<Fulfillment> {
    const res = await api.post(`/fulfillment/fulfillments/${fulfillmentId}/ship`, { trackingNumber });
    return res.data.data;
  },

  async deliverFulfillment(fulfillmentId: string): Promise<Fulfillment> {
    const res = await api.post(`/fulfillment/fulfillments/${fulfillmentId}/deliver`);
    return res.data.data;
  },

  async cancelFulfillment(fulfillmentId: string): Promise<{ id: string; status: string }> {
    const res = await api.post(`/fulfillment/fulfillments/${fulfillmentId}/cancel`);
    return res.data.data;
  },

  // Backorders
  async listBackorders(): Promise<Backorder[]> {
    const res = await api.get('/fulfillment/backorders');
    return res.data.data;
  },

  async processBackorders(productId: string): Promise<Backorder[]> {
    const res = await api.post(`/fulfillment/backorders/process/${productId}`);
    return res.data.data;
  },
};
