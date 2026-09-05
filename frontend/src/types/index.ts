export interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  role: Role;
}

export type Role =
  | 'ADMIN'
  | 'SALES_REP'
  | 'SALES_MANAGER'
  | 'FINANCE'
  | 'OPERATIONS'
  | 'CUSTOMER_SUPPORT'
  | 'VIEWER';

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  SALES_REP: 'Sales Rep',
  SALES_MANAGER: 'Sales Manager',
  FINANCE: 'Finance',
  OPERATIONS: 'Operations',
  CUSTOMER_SUPPORT: 'Customer Support',
  VIEWER: 'Viewer',
};

export const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  SALES_REP: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  SALES_MANAGER: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
  FINANCE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  OPERATIONS: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  CUSTOMER_SUPPORT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
  VIEWER: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300',
};

export interface CustomerTier {
  id: string;
  name: string;
  defaultDiscount: number;
  description?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  companyName: string;
  customerTierId: string;
  customerTier?: CustomerTier;
  portalEnabled?: boolean;
  portalToken?: string | null;
  _count?: {
    quotations?: number;
    orders?: number;
    invoices?: number;
    subscriptions?: number;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  priceDelta: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  category?: Category;
  description?: string;
  imageUrl?: string | null;
  basePrice: number;
  costPrice: number;
  unit: string;
  taxRate: number;
  isRecurring: boolean;
  isActive: boolean;
  variants?: ProductVariant[];
}

export type QuotationStatus =
  | 'DRAFT'
  | 'PENDING_MANAGER'
  | 'PENDING_FINANCE'
  | 'APPROVED'
  | 'SENT_TO_CUSTOMER'
  | 'UNDER_NEGOTIATION'
  | 'CONVERTED_TO_ORDER'
  | 'REJECTED'
  | 'EXPIRED';

export interface QuotationItem {
  id: string;
  quotationId: string;
  productId: string;
  product: Product;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  discountPercentage: number;
  discountAmount: number;
  taxRate: number;
  lineTotal: number;
  marginAmount?: number;
  marginPercentage?: number;
  discountLimit?: number;
  discountExcess?: number;
  riskContribution?: number;
}

export interface Approval {
  id: string;
  quotationId: string;
  level: number;
  approverRole: Role;
  approverId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  action?: string;
  reason?: string;
  requestedAt: string;
  actedAt?: string;
  quotation?: Quotation;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customer: Customer;
  salesRepId: string;
  salesRep?: User;
  currency: string;
  status: QuotationStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  costAmount?: number;
  marginAmount?: number;
  marginPercentage?: number;
  blendedMarginPercentage?: number;
  riskScore: number;
  approvalLevel: number;
  items: QuotationItem[];
  approvals?: Approval[];
  comments?: any[];
  negotiations?: any[];
  orderId?: string | null;
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
}

export interface Recommendation {
  id: string;
  productId: string;
  name: string;
  sku: string;
  category: string;
  type: 'UPSELL' | 'CROSS_SELL' | 'BUNDLE';
  score: number;
  price: number;
  marginDelta: number;
  unit: string;
  isRecurring: boolean;
}
