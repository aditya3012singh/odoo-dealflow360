export interface User {
  id: string;
  email: string;
  username: string;
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
  ADMIN: 'bg-red-100 text-red-700',
  SALES_REP: 'bg-blue-100 text-blue-700',
  SALES_MANAGER: 'bg-purple-100 text-purple-700',
  FINANCE: 'bg-green-100 text-green-700',
  OPERATIONS: 'bg-orange-100 text-orange-700',
  CUSTOMER_SUPPORT: 'bg-yellow-100 text-yellow-700',
  VIEWER: 'bg-gray-100 text-gray-700',
};
