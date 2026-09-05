import api from './api';
import type { Role, Product, Category, CustomerTier } from '../types';

export interface AdminOverview {
  totalUsers: number;
  totalQuotations: number;
  totalOrders: number;
  totalProducts: number;
  totalWarehouses: number;
  platformRevenue: number;
  collectedRevenue: number;
  pendingApprovals: number;
  activeAlerts: number;
  systemHealth: {
    apiServer: string;
    database: string;
    cacheHitRate: string;
    eventBus: string;
  };
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface DiscountPolicy {
  id: string;
  customerTierId: string;
  customerTier: CustomerTier;
  categoryId?: string;
  category?: Category;
  maxDiscount: number;
  minMargin?: number;
  priority: number;
  isActive: boolean;
}

export interface ApprovalRule {
  id: string;
  minRiskScore: number;
  maxRiskScore: number;
  approvalLevel: number;
  requiredRole: Role;
  isActive: boolean;
}

export interface AdminPolicies {
  tiers: CustomerTier[];
  policies: DiscountPolicy[];
  rules: ApprovalRule[];
  categories: Category[];
}

export interface NewProductPayload {
  sku: string;
  name: string;
  categoryId: string;
  basePrice: number;
  costPrice: number;
  unit?: string;
  taxRate?: number;
  isRecurring?: boolean;
  description?: string;
}

export const adminService = {
  async getOverview(): Promise<AdminOverview> {
    const res = await api.get('/admin/overview');
    return res.data.data;
  },

  async listUsers(): Promise<AdminUser[]> {
    const res = await api.get('/admin/users');
    return res.data.data;
  },

  async createUser(payload: {
    username: string;
    email: string;
    password: string;
    role: Role;
  }): Promise<AdminUser> {
    const res = await api.post('/admin/users', payload);
    return res.data.data;
  },

  async updateUser(
    id: string,
    payload: { role?: Role; isActive?: boolean }
  ): Promise<AdminUser> {
    const res = await api.patch(`/admin/users/${id}`, payload);
    return res.data.data;
  },

  async listPolicies(): Promise<AdminPolicies> {
    const res = await api.get('/admin/policies');
    return res.data.data;
  },

  async createProduct(payload: NewProductPayload): Promise<Product> {
    const res = await api.post('/admin/products', payload);
    return res.data.data;
  },

  async listWarehouses(): Promise<any[]> {
    const res = await api.get('/admin/warehouses');
    return res.data.data;
  },
};
