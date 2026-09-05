import api from './api';
import type { Customer, CustomerTier } from '../types';

export interface CreateCustomerPayload {
  name: string;
  email: string;
  phone?: string;
  companyName: string;
  customerTierId: string;
  portalEnabled?: boolean;
}

export interface UpdateCustomerPayload {
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  customerTierId?: string;
  portalEnabled?: boolean;
}

export interface Customer360Data {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    companyName: string;
    customerTier: CustomerTier;
    portalEnabled: boolean;
    hasPortalToken: boolean;
    createdAt: string;
    updatedAt: string;
  };
  metrics: {
    lifetimeSpend: number;
    totalQuotations: number;
    totalOrders: number;
    activeSubscriptions: number;
    pendingNegotiations: number;
  };
  quotations: Array<{
    id: string;
    quotationNumber: string;
    status: string;
    currency: string;
    totalAmount: number;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    createdAt: string;
    updatedAt: string;
    salesRep?: { id: string; username: string; email: string };
    items: Array<{
      id: string;
      quantity: number;
      unitPrice: number;
      discountPercentage: number;
      lineTotal: number;
      product: { name: string; sku: string };
    }>;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    currency: string;
    totalAmount: number;
    createdAt: string;
    items: Array<{
      id: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      product: { name: string; sku: string };
    }>;
    fulfillments: Array<{
      id: string;
      fulfillmentNumber: string;
      status: string;
    }>;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    currency: string;
    totalAmount: number;
    paidAmount: number;
    dueDate: string;
    issuedAt: string;
  }>;
  subscriptions: Array<{
    id: string;
    status: string;
    currentPeriodEnd: string;
    createdAt: string;
  }>;
  negotiations: Array<{
    id: string;
    originalDiscount: number;
    proposedDiscount: number;
    status: string;
    customerNote?: string | null;
    createdAt: string;
    quotation?: { quotationNumber: string };
  }>;
}

export const customerService = {
  async listCustomers(filters?: { search?: string; tier?: string }): Promise<Customer[]> {
    const res = await api.get('/customers', { params: filters });
    return res.data.data;
  },

  async getCustomerTiers(): Promise<CustomerTier[]> {
    const res = await api.get('/customers/tiers');
    return res.data.data;
  },

  async createCustomer(payload: CreateCustomerPayload): Promise<Customer & { rawPortalToken?: string | null }> {
    const res = await api.post('/customers', payload);
    return res.data.data;
  },

  async updateCustomer(id: string, payload: UpdateCustomerPayload): Promise<Customer> {
    const res = await api.put(`/customers/${id}`, payload);
    return res.data.data;
  },

  async getCustomer360(id: string): Promise<Customer360Data> {
    const res = await api.get(`/customers/${id}/360`);
    return res.data.data;
  },

  async issuePortalToken(id: string): Promise<{ portalToken: string; warning: string }> {
    const res = await api.post(`/customers/${id}/portal-token`);
    return res.data.data;
  },

  async revokePortalToken(id: string): Promise<{ message: string }> {
    const res = await api.delete(`/customers/${id}/portal-token`);
    return res.data.data;
  },
};
