import { prisma, TX_OPTIONS } from '../../core/config/db.js';
import { DiscountEngine } from '../discount-engine/discount.engine.js';
import { AllocationEngine } from '../fulfillment/allocation.engine.js';
import { BillingEngine } from '../billing/billing.engine.js';
import logger from '../../core/logger/structuredLogger.js';
import {
  QuotationStatus,
  CustomerStatus,
  NegotiationStatus,
  ApprovalStatus,
  Role,
  OrderStatus,
} from '@prisma/client';

export class NegotiationService {
  /**
   * Get public / restricted quotation view for customer portal (hides internal cost & profit margins)
   */
  static async getRestrictedQuote(quotationId: string) {
    const quote = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        customer: { select: { id: true, name: true, companyName: true, email: true } },
        items: {
          select: {
            id: true,
            productId: true,
            product: { select: { name: true, sku: true, unit: true, description: true, isRecurring: true } },
            quantity: true,
            unitPrice: true,
            discountPercentage: true,
            discountAmount: true,
            taxRate: true,
            lineTotal: true,
          },
        },
        negotiations: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!quote) throw new Error('Quotation not found.');

    // Mark as VIEWED by customer if currently UNOPENED
    if (quote.customerStatus === CustomerStatus.UNOPENED) {
      await prisma.quotation.update({
        where: { id: quotationId },
        data: { customerStatus: CustomerStatus.VIEWED },
      });
    }

    return quote;
  }

  /**
   * Customer submits a counter-offer with a requested discount
   * Automatically re-evaluates risk and re-routes through approval if thresholds are exceeded!
   */
  static async submitCounterOffer(
    quotationId: string,
    customerId: string,
    requestedDiscount: number,
    message?: string
  ) {
    const quote = await prisma.quotation.findUnique({
      where: { id: quotationId },
      select: {
        id: true,
        customerId: true,  // Explicitly select customerId
        quotationNumber: true,
        status: true,
        salesRepId: true,  // Need for audit log
        customer: {
          select: {
            id: true,
            name: true,
            companyName: true,
            customerTierId: true,
          },
        },
        items: {
          include: { product: true },
        },
      },
    });

    if (!quote) throw new Error('Quotation not found.');

    // Debug: Log customer IDs to diagnose foreign key constraint violation
    logger.info('[DEBUG submitCounterOffer]', {
      quotationId,
      customerId_param: customerId,
      quote_customerId: quote.customerId,
      quote_customerId_type: typeof quote.customerId,
      match: customerId === quote.customerId,
    });

    return await prisma.$transaction(async (tx) => {
      // 1. Create Negotiation Request record
      // Use quote.customerId to ensure we have the correct customer ID from the database
      await tx.negotiationRequest.create({
        data: {
          quotationId,
          customerId: quote.customerId, // Use the quotation's customerId, not the parameter
          requestedDiscount,
          message: message || `Customer proposed a counter discount of ${requestedDiscount}%`,
          status: NegotiationStatus.OPEN,
        },
      });

      // 2. Prepare line item inputs with the counter-offered discount
      const lineInputs = quote.items.map((item) => ({
        productId: item.productId,
        categoryId: item.product.categoryId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discountPercentage: requestedDiscount,
        costPrice: Number(item.costPrice),
        taxRate: Number(item.taxRate),
      }));

      // 3. Re-run the Discount Governance & Risk Engine
      const analysis = await DiscountEngine.evaluate(quote.customer.customerTierId, lineInputs);

      // 4. Update line items
      for (const computed of analysis.calculatedItems) {
        await tx.quotationItem.updateMany({
          where: { quotationId, productId: computed.productId },
          data: {
            discountPercentage: requestedDiscount,
            discountAmount: computed.discountAmount,
            lineTotal: computed.lineTotal,
            marginAmount: computed.marginAmount,
            marginPercentage: computed.marginPercentage,
            discountExcess: computed.discountExcess,
            riskContribution: computed.riskContribution,
          },
        });
      }

      // 5. Automatic Re-Approval Trigger
      const requiresApproval = Number(analysis.blendedRiskScore) > 0;
      const nextStatus = requiresApproval
        ? analysis.approvalLevel === 1
          ? QuotationStatus.PENDING_MANAGER
          : QuotationStatus.PENDING_FINANCE
        : QuotationStatus.UNDER_NEGOTIATION;

      if (requiresApproval) {
        // Create new Approval record for the re-evaluation
        await tx.approval.create({
          data: {
            quotationId,
            level: analysis.approvalLevel,
            approverRole: analysis.approvalLevel === 1 ? Role.SALES_MANAGER : Role.FINANCE,
            status: ApprovalStatus.PENDING,
            reason: `Customer counter-offer (${requestedDiscount}%) triggered automatic re-approval. New Risk Score: ${analysis.blendedRiskScore}`,
          },
        });
      }

      // 6. Update Quotation header
      await tx.quotation.update({
        where: { id: quotationId },
        data: {
          status: nextStatus,
          customerStatus: CustomerStatus.COUNTER_PROPOSED,
          subtotal: analysis.subtotal,
          discountAmount: analysis.discountAmount,
          taxAmount: analysis.taxAmount,
          totalAmount: analysis.totalAmount,
          costAmount: analysis.costAmount,
          marginAmount: analysis.marginAmount,
          marginPercentage: analysis.marginPercentage,
          riskScore: analysis.blendedRiskScore,
          approvalLevel: analysis.approvalLevel,
          lastActivityAt: new Date(),
        },
      });

      // 7. Audit log
      await tx.auditLog.create({
        data: {
          entityType: 'QUOTATION',
          entityId: quotationId,
          action: 'CUSTOMER_COUNTER_OFFER',
          performedBy: quote.salesRepId, // or customer
          newValue: {
            requestedDiscount,
            newRiskScore: analysis.blendedRiskScore,
            status: nextStatus,
          },
          reason: `Customer countered with ${requestedDiscount}%. Re-approval triggered automatically.`,
        },
      });

      return {
        success: true,
        reApprovalTriggered: requiresApproval,
        status: nextStatus,
        newRiskScore: analysis.blendedRiskScore,
        totalAmount: analysis.totalAmount,
      };
    }, TX_OPTIONS);
  }

  /**
   * Customer confirms and accepts the quotation.
   * customerId must come from the authenticated portal session — never from request body.
   * 1. Creates Order + immutable OrderItem snapshot (inside a single transaction)
   * 2. Stages ORDER_CONFIRMED outbox event
   * 3. Runs AllocationEngine (reads OrderItems, not live quotation)
   * 4. Runs BillingEngine (invoice + subscription schedules)
   */
  static async confirmAndConvert(quotationId: string, customerId?: string) {
    const quote = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { customer: true, items: { include: { product: true } } },
    });

    if (!quote) throw new Error('Quotation not found.');

    // Verify portal customer owns this quotation (defence-in-depth — middleware already checks too)
    if (customerId && quote.customerId !== customerId) {
      throw new Error('Forbidden: This quotation does not belong to your account.');
    }

    if (
      quote.status !== QuotationStatus.APPROVED &&
      quote.status !== QuotationStatus.UNDER_NEGOTIATION &&
      quote.status !== QuotationStatus.DRAFT
    ) {
      throw new Error(`Cannot convert quote in status ${quote.status}. It must be approved.`);
    }

    const orderNumber = `ORD-${quote.quotationNumber.replace('Q-', '')}`;

    const order = await prisma.$transaction(async (tx) => {
      // 1. Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          quotationId: quote.id,
          customerId: quote.customerId,
          status: OrderStatus.PENDING_FULFILLMENT,
          subtotal: quote.subtotal,
          discountAmount: quote.discountAmount,
          taxAmount: quote.taxAmount,
          totalAmount: quote.totalAmount,
        },
      });

      // 2. Snapshot QuotationItems → OrderItems (immutable at time of confirmation)
      await tx.orderItem.createMany({
        data: quote.items.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          taxAmount: Number((Number(item.lineTotal) * (Number(item.taxRate) / 100)).toFixed(2)),
          lineTotal: item.lineTotal,
          costPrice: item.costPrice,
        })),
      });

      // 3. Update quotation status to CONVERTED
      await tx.quotation.update({
        where: { id: quote.id },
        data: {
          status: QuotationStatus.CONVERTED_TO_ORDER,
          customerStatus: CustomerStatus.ACCEPTED,
        },
      });

      // 4. Stage transactional outbox event (Outbox pattern — guaranteed delivery)
      await tx.outboxEvent.create({
        data: {
          eventType: 'QUOTE_CONFIRMED',
          payload: {
            orderId: newOrder.id,
            orderNumber: newOrder.orderNumber,
            quotationId: quote.id,
            totalAmount: newOrder.totalAmount,
          },
        },
      });

      return newOrder;
    }, TX_OPTIONS);

    // 5. Run Warehouse Allocation Engine (reads OrderItems, not live quotation)
    const fulfillmentResult = await AllocationEngine.commitPlan(order.id);

    // 6. Run Hybrid Billing Engine (generates One-Time invoice + Subscription schedules)
    const billingResult = await BillingEngine.processOrderBilling(order.id);

    return {
      order,
      fulfillment: fulfillmentResult,
      billing: billingResult,
    };
  }
}
