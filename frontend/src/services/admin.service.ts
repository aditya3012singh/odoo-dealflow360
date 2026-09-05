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
  imageUrl?: string;
}

export interface SystemHealthData {
  status: string;
  timestamp: string;
  uptimeSeconds: number;
  database: {
    status: string;
    latencyMs: number;
    counts: {
      users: number;
      products: number;
      quotations: number;
      orders: number;
    };
  };
  memory: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
  };
  environment: string;
  nodeVersion: string;
}

export interface RecentActivity {
  id: string;
  type: 'QUOTATION' | 'ORDER' | 'USER';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  link?: string;
}

export const adminService = {
  async getOverview(): Promise<AdminOverview> {
    const res = await api.get('/admin/overview');
    return res.data.data;
  },

  async getSystemHealth(): Promise<SystemHealthData> {
    const res = await api.get('/admin/system-health');
    return res.data.data;
  },

  async getRecentActivity(): Promise<RecentActivity[]> {
    const res = await api.get('/admin/recent-activity');
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

  async resetUserPassword(
    userId: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await api.post(`/admin/users/${userId}/reset-password`, { newPassword });
    return res.data;
  },

  async listPolicies(): Promise<AdminPolicies> {
    const res = await api.get('/admin/policies');
    return res.data.data;
  },

  async createProduct(payload: NewProductPayload): Promise<Product> {
    const res = await api.post('/admin/products', payload);
    return res.data.data;
  },

  async updateProduct(
    id: string,
    payload: Partial<NewProductPayload & { isActive: boolean }>
  ): Promise<Product> {
    const res = await api.patch(`/admin/products/${id}`, payload);
    return res.data.data;
  },

  async deleteProduct(id: string): Promise<{ id?: string; message?: string }> {
    const res = await api.delete(`/admin/products/${id}`);
    return res.data.data || res.data;
  },

  async createCategory(payload: { name: string; description?: string }): Promise<Category> {
    const res = await api.post('/admin/categories', payload);
    return res.data.data;
  },

  async updateCategory(
    id: string,
    payload: { name?: string; description?: string }
  ): Promise<Category> {
    const res = await api.patch(`/admin/categories/${id}`, payload);
    return res.data.data;
  },

  async updateCustomerTier(
    id: string,
    payload: { defaultDiscount?: number; description?: string }
  ): Promise<CustomerTier> {
    const res = await api.patch(`/admin/tiers/${id}`, payload);
    return res.data.data;
  },

  async updateDiscountPolicy(
    id: string,
    payload: { maxDiscount?: number; minMargin?: number; priority?: number; isActive?: boolean }
  ): Promise<DiscountPolicy> {
    const res = await api.patch(`/admin/policies/${id}`, payload);
    return res.data.data;
  },

  async updateApprovalRule(
    id: string,
    payload: { minRiskScore?: number; maxRiskScore?: number; requiredRole?: Role; isActive?: boolean }
  ): Promise<ApprovalRule> {
    const res = await api.patch(`/admin/approval-rules/${id}`, payload);
    return res.data.data;
  },

  async listWarehouses(): Promise<any[]> {
    const res = await api.get('/admin/warehouses');
    return res.data.data;
  },

  async createWarehouse(payload: {
    name: string;
    location: string;
    shippingWeight?: number;
  }): Promise<any> {
    const res = await api.post('/admin/warehouses', payload);
    return res.data.data;
  },

  async updateWarehouse(
    id: string,
    payload: { name?: string; location?: string; shippingWeight?: number; isActive?: boolean }
  ): Promise<any> {
    const res = await api.patch(`/admin/warehouses/${id}`, payload);
    return res.data.data;
  },

  async adjustStock(payload: {
    warehouseId: string;
    productId: string;
    availableQty: number;
    reorderLevel?: number;
  }): Promise<any> {
    const res = await api.patch('/admin/inventory', payload);
    return res.data.data;
  },
};

