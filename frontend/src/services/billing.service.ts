import api from './api';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  transactionRef?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  items: InvoiceItem[];
  payments: Payment[];
  order?: {
    orderNumber: string;
    customer?: {
      companyName: string;
    };
  };
  createdAt: string;
}

export interface SubscriptionSchedule {
  id: string;
  periodNumber: number;
  billingDate: string;
  amount: number;
  status: string;
}

export interface Subscription {
  id: string;
  orderId: string;
  customerId?: string;
  customer?: {
    name: string;
    companyName: string;
    email: string;
  };
  order?: {
    orderNumber: string;
  };
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED' | string;
  startDate?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  nextBillingDate?: string;
  createdAt?: string;
  plan?: {
    id: string;
    name: string;
    price: number;
    billingInterval: string;
  };
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  billingSchedules: SubscriptionSchedule[];
}

export interface OrderBillingResponse {
  invoices: Invoice[];
  subscriptions: Subscription[];
}

export interface ProrationResult {
  currentMonthlyRate: number;
  newMonthlyRate: number;
  daysRemaining: number;
  daysInMonth: number;
  unusedCurrentCredit: number;
  proratedNewCharge: number;
  netAdjustment: number;
  isCredit: boolean;
}

export const billingService = {
  async listInvoices(): Promise<Invoice[]> {
    const res = await api.get('/billing/invoices');
    return res.data.data;
  },

  async listSubscriptions(): Promise<Subscription[]> {
    const res = await api.get('/billing/subscriptions');
    return res.data.data;
  },

  async updateSubscriptionStatus(id: string, status: string): Promise<Subscription> {
    const res = await api.patch(`/billing/subscriptions/${id}/status`, { status });
    return res.data.data;
  },

  async cancelSubscription(id: string, reason?: string): Promise<{
    subscription: Subscription;
    creditNote: any | null;
    daysRemaining: number;
    creditAmount: number;
  }> {
    const res = await api.post(`/billing/subscriptions/${id}/cancel`, { reason });
    return res.data.data;
  },

  async getOrderBilling(orderId: string): Promise<OrderBillingResponse> {
    const res = await api.get(`/billing/orders/${orderId}`);
    return res.data.data;
  },

  async recordPayment(
    invoiceId: string,
    payload: { amount: number; paymentMethod: string; transactionRef?: string }
  ): Promise<{ success: boolean; data: Invoice }> {
    const res = await api.post(`/billing/invoices/${invoiceId}/pay`, payload);
    return res.data;
  },

  async calculateProration(payload: {
    currentPrice: number;
    newPrice: number;
    daysRemaining: number;
    daysInMonth?: number;
  }): Promise<ProrationResult> {
    const res = await api.post('/billing/proration/calculate', payload);
    return res.data.data;
  },
};
