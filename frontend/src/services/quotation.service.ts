import api from './api';
import type { Customer, Product, Quotation, QuotationStatus, Recommendation } from '../types';

export interface QuotationFilters {
  status?: QuotationStatus;
  search?: string;
  customerId?: string;
  salesRepId?: string;
}

export interface AddItemPayload {
  productId: string;
  quantity: number;
  discountPercentage?: number;
  unitPrice?: number;
  variantId?: string;
}

export interface UpdateItemPayload {
  quantity?: number;
  discountPercentage?: number;
  unitPrice?: number;
}

export const quotationService = {
  async getCustomers(): Promise<Customer[]> {
    const res = await api.get('/quotations/meta/customers');
    return res.data.data;
  },

  async getProducts(): Promise<Product[]> {
    const res = await api.get('/quotations/meta/products');
    return res.data.data;
  },

  async getQuotations(filters?: QuotationFilters): Promise<Quotation[]> {
    const res = await api.get('/quotations', { params: filters });
    return res.data.data;
  },

  async getQuotation(id: string): Promise<Quotation> {
    const res = await api.get(`/quotations/${id}`);
    return res.data.data;
  },

  async createQuotation(customerId: string, currency: string = 'INR'): Promise<Quotation> {
    const res = await api.post('/quotations', { customerId, currency });
    return res.data.data;
  },

  async deleteQuotation(id: string): Promise<{ id: string; quotationNumber: string }> {
    const res = await api.delete(`/quotations/${id}`);
    return res.data.data;
  },

  async addItem(quotationId: string, item: AddItemPayload): Promise<Quotation> {
    const res = await api.post(`/quotations/${quotationId}/items`, item);
    return res.data.data;
  },

  async updateItem(quotationId: string, itemId: string, item: UpdateItemPayload): Promise<Quotation> {
    const res = await api.put(`/quotations/${quotationId}/items/${itemId}`, item);
    return res.data.data;
  },

  async removeItem(quotationId: string, itemId: string): Promise<Quotation> {
    const res = await api.delete(`/quotations/${quotationId}/items/${itemId}`);
    return res.data.data;
  },

  async getRecommendations(quotationId: string): Promise<Recommendation[]> {
    const res = await api.get(`/quotations/${quotationId}/recommendations`);
    return res.data.data;
  },

  async submitQuotation(quotationId: string): Promise<{
    quotation: Quotation;
    approvalLevel: number;
    riskScore: number;
    status: QuotationStatus;
  }> {
    const res = await api.post(`/quotations/${quotationId}/submit`);
    return res.data.data;
  },

  async getComments(quotationId: string): Promise<any[]> {
    const res = await api.get(`/quotations/${quotationId}/comments`);
    return res.data.data;
  },

  async addComment(quotationId: string, comment: string): Promise<any> {
    const res = await api.post(`/quotations/${quotationId}/comments`, { comment });
    return res.data.data;
  },
};
