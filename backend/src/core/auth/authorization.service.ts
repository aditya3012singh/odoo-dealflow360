import { Role } from '@prisma/client';
import { prisma } from '../config/db.js';
import logger from '../logger/structuredLogger.js';

// ============================================================================
// RESOURCE-LEVEL AUTHORIZATION SERVICE
// Used from service layer so that authorization is enforced even when services
// are called from workers, schedulers, or future GraphQL endpoints.
// ============================================================================

export interface AuthenticatedActor {
  id: string;
  role: Role;
}

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

// ============================================================================
// QUOTATION AUTHORIZATION
// ============================================================================

/**
 * Assert that the actor can read the given quotation.
 * SALES_REP: own quotes only
 * SALES_MANAGER: all quotes (team visibility)
 * FINANCE: all quotes
 * OPERATIONS: all quotes (fulfillment relevance)
 * ADMIN: all quotes
 */
export async function assertCanReadQuote(actor: AuthenticatedActor, quotationId: string): Promise<void> {
  const wideRoles: Role[] = [Role.ADMIN, Role.SALES_MANAGER, Role.FINANCE, Role.OPERATIONS];
  if ((wideRoles as string[]).includes(actor.role)) {
    return; // Wide visibility
  }

  if (actor.role === Role.SALES_REP) {
    const quote = await prisma.quotation.findUnique({
      where: { id: quotationId },
      select: { salesRepId: true },
    });
    if (!quote) throw new NotFoundError('Quotation not found.');
    if (quote.salesRepId !== actor.id) {
      throw new ForbiddenError('You can only view your own quotations.');
    }
    return;
  }

  throw new ForbiddenError('You do not have access to this quotation.');
}

/**
 * Assert that the actor owns or manages this quotation for write operations.
 */
export async function assertCanWriteQuote(actor: AuthenticatedActor, quotationId: string): Promise<void> {
  const wideRoles: Role[] = [Role.ADMIN, Role.SALES_MANAGER];
  if ((wideRoles as string[]).includes(actor.role)) return;

  if (actor.role === Role.SALES_REP) {
    const quote = await prisma.quotation.findUnique({
      where: { id: quotationId },
      select: { salesRepId: true },
    });
    if (!quote) throw new NotFoundError('Quotation not found.');
    if (quote.salesRepId !== actor.id) {
      throw new ForbiddenError('You can only modify your own quotations.');
    }
    return;
  }

  throw new ForbiddenError('You do not have permission to modify this quotation.');
}

// ============================================================================
// APPROVAL AUTHORIZATION
// ============================================================================

/**
 * Assert that the actor is authorized to act on the given approval.
 * Enforces:
 *   1. Role matches the approval's requiredRole
 *   2. Approval level matches role authority
 *   3. Self-approval is prevented
 *   4. Approval is still PENDING
 */
export async function assertCanApprove(
  actor: AuthenticatedActor,
  approvalId: string
): Promise<void> {
  const approval = await prisma.approval.findUnique({
    where: { id: approvalId },
    include: {
      quotation: {
        select: { salesRepId: true, status: true },
      },
    },
  });

  if (!approval) throw new NotFoundError('Approval request not found.');

  const { ApprovalStatus } = await import('@prisma/client');
  if (approval.status !== ApprovalStatus.PENDING) {
    throw new ConflictError(`Approval already concluded with status: ${approval.status}.`);
  }

  // ADMIN can approve anything but the self-approval check still applies
  if (actor.role === Role.ADMIN) {
    // Self-approval guard for admin
    if (approval.quotation.salesRepId === actor.id) {
      logger.warn(`[Auth] Self-approval attempt blocked: ADMIN ${actor.id} on their own quotation`);
      throw new ForbiddenError('Admins cannot approve their own quotations.');
    }
    return;
  }

  // Level 1 approvals (Manager-level) require SALES_MANAGER
  if (approval.level === 1 && actor.role !== Role.SALES_MANAGER) {
    throw new ForbiddenError(
      `Level 1 approvals require a Sales Manager role. Your role: ${actor.role}.`
    );
  }

  // Level 2 approvals (Finance-level) require FINANCE
  if (approval.level === 2 && actor.role !== Role.FINANCE) {
    throw new ForbiddenError(
      `Level 2 approvals require a Finance role. Your role: ${actor.role}.`
    );
  }

  // Self-approval prevention
  if (approval.quotation.salesRepId === actor.id) {
    logger.warn(`[Auth] Self-approval attempt blocked: ${actor.id} (${actor.role})`);
    throw new ForbiddenError('You cannot approve your own quotations.');
  }
}

// ============================================================================
// BILLING AUTHORIZATION
// ============================================================================

/**
 * Assert that the actor can view billing for a specific order.
 */
export async function assertCanReadBilling(actor: AuthenticatedActor, orderId: string): Promise<void> {
  const wideRoles: Role[] = [Role.ADMIN, Role.FINANCE, Role.OPERATIONS];
  if ((wideRoles as string[]).includes(actor.role)) return;

  const salesRoles: Role[] = [Role.SALES_REP, Role.SALES_MANAGER];
  if ((salesRoles as string[]).includes(actor.role)) {
    // Sales roles can see billing for orders tied to their quotations
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { quotation: { select: { salesRepId: true } } },
    });
    if (!order) throw new NotFoundError('Order not found.');
    if (actor.role === Role.SALES_REP && order.quotation.salesRepId !== actor.id) {
      throw new ForbiddenError('You can only view billing for your own orders.');
    }
    return;
  }

  throw new ForbiddenError('You do not have access to billing information.');
}

/**
 * Assert that a payment amount is valid against the invoice balance.
 */
export async function assertValidPaymentAmount(invoiceId: string, amount: number): Promise<void> {
  if (amount <= 0) {
    throw new ValidationError('Payment amount must be greater than zero.');
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { totalAmount: true, paidAmount: true },
  });

  if (!invoice) throw new NotFoundError('Invoice not found.');

  const remaining = Number(invoice.totalAmount) - Number(invoice.paidAmount);
  if (amount > remaining + 0.01) {
    // Allow ₹0.01 rounding tolerance
    throw new ValidationError(
      `Payment amount ₹${amount.toFixed(2)} exceeds remaining invoice balance ₹${remaining.toFixed(2)}.`
    );
  }
}

// ============================================================================
// FULFILLMENT AUTHORIZATION
// ============================================================================

/**
 * Assert that the actor can view fulfillment details for an order.
 */
export async function assertCanReadFulfillment(actor: AuthenticatedActor, orderId: string): Promise<void> {
  const wideRoles: Role[] = [Role.ADMIN, Role.FINANCE, Role.OPERATIONS, Role.SALES_MANAGER];
  if ((wideRoles as string[]).includes(actor.role)) return;

  if (actor.role === Role.SALES_REP) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { quotation: { select: { salesRepId: true } } },
    });
    if (!order) throw new NotFoundError('Order not found.');
    if (order.quotation.salesRepId !== actor.id) {
      throw new ForbiddenError('You can only view fulfillment for your own orders.');
    }
    return;
  }

  throw new ForbiddenError('You do not have access to fulfillment information.');
}

// ============================================================================
// QUOTATION STATE MACHINE
// ============================================================================

import { QuotationStatus } from '@prisma/client';

/**
 * Valid state transitions for quotations.
 * Prevents arbitrary status jumps via API.
 */
const VALID_TRANSITIONS: Partial<Record<QuotationStatus, QuotationStatus[]>> = {
  [QuotationStatus.DRAFT]: [QuotationStatus.PENDING_MANAGER, QuotationStatus.PENDING_FINANCE, QuotationStatus.APPROVED],
  [QuotationStatus.PENDING_MANAGER]: [QuotationStatus.APPROVED, QuotationStatus.REJECTED, QuotationStatus.PENDING_FINANCE],
  [QuotationStatus.PENDING_FINANCE]: [QuotationStatus.APPROVED, QuotationStatus.REJECTED],
  [QuotationStatus.APPROVED]: [QuotationStatus.UNDER_NEGOTIATION, QuotationStatus.CONFIRMED, QuotationStatus.CONVERTED_TO_ORDER],
  [QuotationStatus.UNDER_NEGOTIATION]: [QuotationStatus.PENDING_MANAGER, QuotationStatus.PENDING_FINANCE, QuotationStatus.CONFIRMED, QuotationStatus.CONVERTED_TO_ORDER],
  [QuotationStatus.REJECTED]: [QuotationStatus.DRAFT], // Allow reopening
  [QuotationStatus.CONFIRMED]: [QuotationStatus.CONVERTED_TO_ORDER],
  [QuotationStatus.CONVERTED_TO_ORDER]: [],   // Terminal
  [QuotationStatus.EXPIRED]: [],              // Terminal
};

/**
 * Assert that a quotation status transition is valid.
 */
export function assertValidStatusTransition(from: QuotationStatus, to: QuotationStatus): void {
  const allowed = VALID_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new ValidationError(
      `Invalid status transition: ${from} → ${to}. Allowed transitions from ${from}: [${allowed.join(', ')}]`
    );
  }
}

/**
 * Assert that a quotation can still be modified (not in a terminal/locked state).
 */
export function assertQuoteIsEditable(status: QuotationStatus): void {
  const editableStatuses: QuotationStatus[] = [QuotationStatus.DRAFT];
  if (!editableStatuses.includes(status)) {
    throw new ValidationError(
      `Quotation cannot be modified in status: ${status}. Only DRAFT quotations can be edited.`
    );
  }
}

/**
 * Assert that a quotation can be submitted.
 */
export function assertQuoteIsSubmittable(status: QuotationStatus): void {
  const submittableStatuses: QuotationStatus[] = [QuotationStatus.DRAFT];
  if (!submittableStatuses.includes(status)) {
    throw new ValidationError(
      `Only DRAFT quotations can be submitted. Current status: ${status}.`
    );
  }
}
