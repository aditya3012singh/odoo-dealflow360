import { Role } from '@prisma/client';

// ============================================================================
// CENTRALIZED PERMISSION DEFINITIONS
// ============================================================================

export enum Permission {
  // Quotation / CPQ
  QUOTE_READ        = 'quote:read',
  QUOTE_CREATE      = 'quote:create',
  QUOTE_UPDATE      = 'quote:update',
  QUOTE_SUBMIT      = 'quote:submit',

  // Approval Engine
  APPROVAL_READ     = 'approval:read',
  APPROVAL_DECIDE   = 'approval:decide',

  // Customer Portal / Negotiation
  NEGOTIATION_READ    = 'negotiation:read',
  NEGOTIATION_COUNTER = 'negotiation:counter',
  NEGOTIATION_CONFIRM = 'negotiation:confirm',

  // Fulfillment
  FULFILLMENT_READ   = 'fulfillment:read',
  FULFILLMENT_MANAGE = 'fulfillment:manage',

  // Billing
  BILLING_READ   = 'billing:read',
  BILLING_PAY    = 'billing:pay',
  BILLING_MANAGE = 'billing:manage',

  // Catalog
  CUSTOMER_MANAGE = 'customer:manage',
  PRODUCT_MANAGE  = 'product:manage',
  PRICING_MANAGE  = 'pricing:manage',

  // Administration
  USER_MANAGE  = 'user:manage',
  SYSTEM_ADMIN = 'system:admin',
}

// ============================================================================
// ROLE → PERMISSION MATRIX
// Single source of truth for all authorization decisions.
// ============================================================================

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.USER]: [],

  [Role.CUSTOMER]: [
    // Customer portal actions are handled by separate portal middleware.
    // This ensures customers never accidentally access internal routes.
  ],

  [Role.SALES_REP]: [
    Permission.QUOTE_READ,
    Permission.QUOTE_CREATE,
    Permission.QUOTE_UPDATE,
    Permission.QUOTE_SUBMIT,
    Permission.FULFILLMENT_READ,
    Permission.BILLING_READ,
  ],

  [Role.SALES_MANAGER]: [
    Permission.QUOTE_READ,
    Permission.QUOTE_CREATE,
    Permission.QUOTE_UPDATE,
    Permission.QUOTE_SUBMIT,
    Permission.APPROVAL_READ,
    Permission.APPROVAL_DECIDE,
    Permission.FULFILLMENT_READ,
    Permission.BILLING_READ,
  ],

  [Role.FINANCE]: [
    Permission.QUOTE_READ,
    Permission.APPROVAL_READ,
    Permission.APPROVAL_DECIDE,
    Permission.BILLING_READ,
    Permission.BILLING_PAY,
    Permission.BILLING_MANAGE,
    Permission.FULFILLMENT_READ,
  ],

  [Role.OPERATIONS]: [
    Permission.QUOTE_READ,
    Permission.FULFILLMENT_READ,
    Permission.FULFILLMENT_MANAGE,
    Permission.BILLING_READ,
    Permission.CUSTOMER_MANAGE,
    Permission.PRODUCT_MANAGE,
  ],

  [Role.ADMIN]: [
    Permission.QUOTE_READ,
    Permission.QUOTE_CREATE,
    Permission.QUOTE_UPDATE,
    Permission.QUOTE_SUBMIT,
    Permission.APPROVAL_READ,
    Permission.APPROVAL_DECIDE,
    Permission.NEGOTIATION_READ,
    Permission.NEGOTIATION_COUNTER,
    Permission.NEGOTIATION_CONFIRM,
    Permission.FULFILLMENT_READ,
    Permission.FULFILLMENT_MANAGE,
    Permission.BILLING_READ,
    Permission.BILLING_PAY,
    Permission.BILLING_MANAGE,
    Permission.CUSTOMER_MANAGE,
    Permission.PRODUCT_MANAGE,
    Permission.PRICING_MANAGE,
    Permission.USER_MANAGE,
    Permission.SYSTEM_ADMIN,
  ],
};

/**
 * Check whether a role has a given permission.
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] as Permission[])?.includes(permission) ?? false;
}
