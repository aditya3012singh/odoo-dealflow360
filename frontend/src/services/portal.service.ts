import axios from 'axios';
import { sanitizeErrorMessage } from './api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const portalApi = axios.create({
  baseURL: `${BASE_URL}/portal`,
  headers: {
    'Content-Type': 'application/json',
  },
});

portalApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('portalToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

portalApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('portalToken');
      localStorage.removeItem('portalCustomer');
      if (!window.location.pathname.includes('/portal/login') && !window.location.pathname.includes('/login')) {
        window.location.href = '/portal/login';
      }
    }

    if (err.response?.data) {
      if (typeof err.response.data === 'object') {
        if (err.response.data.message) {
          err.response.data.message = sanitizeErrorMessage(err.response.data.message);
        }
        if (err.response.data.error) {
          err.response.data.error = sanitizeErrorMessage(err.response.data.error);
        }
      } else if (typeof err.response.data === 'string') {
        err.response.data = {
          success: false,
          message: sanitizeErrorMessage(err.response.data),
        };
      }
    }

    if (err.message) {
      err.message = sanitizeErrorMessage(err.message);
    }

    return Promise.reject(err);
  }
);

export interface PortalDashboardData {
  customer: {
    id: string;
    name: string;
    companyName: string;
    email: string;
    tier: string;
  };
  kpis: {
    activeQuotations: number;
    awaitingConfirmation: number;
    ordersPlaced: number;
    unreadMessages: number;
  };
  quotations: Array<{
    id: string;
    quotationNumber: string;
    currency: string;
    totalAmount: number;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    status: string;
    customerStatus: string;
    salesRep: string;
    itemCount: number;
    items: Array<{
      id: string;
      product: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      discountPercentage: number;
      lineTotal: number;
    }>;
    validUntil: string | null;
    updatedAt: string;
  }>;
  recentActivity: Array<{
    icon: string;
    text: string;
    time: string;
    quotationId?: string;
  }>;
}

export interface PortalQuoteDetail {
  id: string;
  quotationNumber: string;
  status: string;
  currency: string;
  subtotal: number | string;
  discountAmount: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  expiresAt?: string | null;
  customer: {
    id: string;
    name: string;
    companyName: string;
    email: string;
  };
  items: Array<{
    id: string;
    productId: string;
    product: {
      name: string;
      sku: string;
      unit?: string;
      description?: string;
      isRecurring?: boolean;
      imageUrl?: string | null;
    };
    quantity: number;
    unitPrice: number | string;
    discountPercentage: number | string;
    discountAmount: number | string;
    taxRate: number | string;
    lineTotal: number | string;
  }>;
  orderId?: string | null;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    fulfillments?: Array<{
      id: string;
      shipmentNumber: string;
      status: string;
      shippedAt?: string | null;
      deliveredAt?: string | null;
    }>;
  } | null;
  createdAt?: string;
  updatedAt?: string;
  negotiations?: Array<{
    id: string;
    originalDiscount: number;
    proposedDiscount: number;
    status: string;
    customerNote?: string | null;
    createdAt: string;
  }>;
}

export const portalService = {
  async getDashboard(): Promise<PortalDashboardData> {
    const res = await portalApi.get('/dashboard');
    return res.data.data;
  },

  async listQuotations(): Promise<any[]> {
    const res = await portalApi.get('/quotations');
    return res.data.data;
  },

  async getQuotation(id: string): Promise<PortalQuoteDetail> {
    const res = await portalApi.get(`/quotations/${id}`);
    return res.data.data;
  },

  async submitCounterOffer(
    id: string,
    requestedDiscount: number,
    message?: string
  ): Promise<any> {
    const res = await portalApi.post(`/quotations/${id}/counter-offer`, {
      requestedDiscount,
      message,
    });
    return res.data.data;
  },

  async confirmAndConvert(id: string): Promise<any> {
    const res = await portalApi.post(`/quotations/${id}/confirm`);
    return res.data.data;
  },

  async declineQuotation(id: string, reason?: string): Promise<any> {
    const res = await portalApi.post(`/quotations/${id}/decline`, { reason });
    return res.data.data;
  },

  async getComments(id: string): Promise<any[]> {
    const res = await portalApi.get(`/quotations/${id}/comments`);
    return res.data.data;
  },

  async addComment(id: string, message: string): Promise<any> {
    const res = await portalApi.post(`/quotations/${id}/comments`, { comment: message, message });
    return res.data.data;
  },

  async listStorefrontProducts(): Promise<any[]> {
    const res = await portalApi.get('/products');
    return res.data.data;
  },

  async requestBulkQuotation(payload: {
    items: Array<{ productId: string; quantity: number }>;
    requestedDiscount?: number;
    notes?: string;
  }): Promise<any> {
    const res = await portalApi.post('/quotations/request', payload);
    return res.data.data;
  },

  async listOrders(): Promise<any[]> {
    const res = await portalApi.get('/orders');
    return res.data.data;
  },

  async getBilling(): Promise<{ subscriptions: any[]; invoices: any[] }> {
    const res = await portalApi.get('/billing');
    return res.data.data;
  },

  async getProfile(): Promise<any> {
    const res = await portalApi.get('/profile');
    return res.data.data;
  },

  async updateProfile(payload: { name?: string; phone?: string; companyName?: string }): Promise<any> {
    const res = await portalApi.put('/profile', payload);
    return res.data.data;
  },
};
