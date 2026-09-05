import { prisma } from '../../core/config/db.js';
import { DiscountEngine } from '../discount-engine/discount.engine.js';
import { QuotationStatus, ApprovalStatus, Role, CustomerStatus } from '@prisma/client';

export class QuotationService {
  /**
   * Generate next sequential quotation number
   */
  static async generateQuotationNumber(): Promise<string> {
    const count = await prisma.quotation.count();
    const datePart = new Date().getFullYear();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `Q-${datePart}-${sequence}`;
  }

  /**
   * Create a new draft quotation
   */
  static async createQuotation(data: {
    customerId: string;
    salesRepId: string;
    currency?: string;
  }) {
    const quotationNumber = await this.generateQuotationNumber();

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: data.customerId,
        salesRepId: data.salesRepId,
        currency: data.currency || 'INR',
        status: QuotationStatus.DRAFT,
      },
      include: {
        customer: { include: { customerTier: true } },
        salesRep: { select: { id: true, username: true, email: true, role: true } },
        items: { include: { product: true } },
      },
    });

    // Record creation audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'QUOTATION',
        entityId: quotation.id,
        action: 'CREATED',
        performedBy: data.salesRepId,
        newValue: { quotationNumber, customerId: data.customerId },
        reason: 'Initiated new draft quotation',
      },
    });

    return quotation;
  }

  /**
   * Recalculate quotation financials, margins, and blended risk score
   */
  static async recalculateQuotation(quotationId: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    if (!quotation) throw new Error('Quotation not found.');

    const lineInputs = quotation.items.map((item) => ({
      productId: item.productId,
      categoryId: item.product.categoryId,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discountPercentage: Number(item.discountPercentage),
      costPrice: Number(item.costPrice),
      taxRate: Number(item.taxRate),
      variantId: item.variantId || undefined,
    }));

    const analysis = await DiscountEngine.evaluate(quotation.customer.customerTierId, lineInputs);

    // Update quote & line items inside a transaction
    return await prisma.$transaction(async (tx) => {
      // Update each quotation item's computed risk & margins
      for (const computed of analysis.calculatedItems) {
        await tx.quotationItem.updateMany({
          where: { quotationId, productId: computed.productId },
          data: {
            discountAmount: computed.discountAmount,
            lineTotal: computed.lineTotal,
            marginAmount: computed.marginAmount,
            marginPercentage: computed.marginPercentage,
            discountLimit: computed.discountLimit,
            discountExcess: computed.discountExcess,
            riskContribution: computed.riskContribution,
          },
        });
      }

      // Update the main quotation header
      return await tx.quotation.update({
        where: { id: quotationId },
        data: {
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
        include: {
          customer: { include: { customerTier: true } },
          salesRep: { select: { id: true, username: true, email: true, role: true } },
          items: { include: { product: true } },
          approvals: true,
        },
      });
    });
  }

  /**
   * Add a product line item to the quotation
   */
  static async addItem(
    quotationId: string,
    data: {
      productId: string;
      quantity: number;
      discountPercentage?: number;
      unitPrice?: number;
      variantId?: string;
    }
  ) {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) throw new Error('Product not found.');

    const unitPrice = data.unitPrice !== undefined ? data.unitPrice : Number(product.basePrice);
    const costPrice = Number(product.costPrice);
    const discountPercentage = data.discountPercentage || 0;
    const lineGross = data.quantity * unitPrice;
    const discountAmount = lineGross * (discountPercentage / 100);
    const lineTotal = lineGross - discountAmount;
    const marginAmount = lineTotal - (data.quantity * costPrice);
    const marginPercentage = lineTotal > 0 ? (marginAmount / lineTotal) * 100 : 0;

    await prisma.quotationItem.create({
      data: {
        quotationId,
        productId: data.productId,
        variantId: data.variantId,
        quantity: data.quantity,
        unitPrice,
        discountPercentage,
        discountAmount,
        taxRate: Number(product.taxRate),
        lineTotal,
        costPrice,
        marginAmount,
        marginPercentage,
      },
    });

    return await this.recalculateQuotation(quotationId);
  }

  /**
   * Update quantity or discount of an existing quotation item
   */
  static async updateItem(
    quotationId: string,
    itemId: string,
    data: { quantity?: number; discountPercentage?: number; unitPrice?: number }
  ) {
    await prisma.quotationItem.update({
      where: { id: itemId },
      data: {
        ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
        ...(data.discountPercentage !== undefined ? { discountPercentage: data.discountPercentage } : {}),
        ...(data.unitPrice !== undefined ? { unitPrice: data.unitPrice } : {}),
      },
    });

    return await this.recalculateQuotation(quotationId);
  }

  /**
   * Remove an item from the quotation
   */
  static async removeItem(quotationId: string, itemId: string) {
    await prisma.quotationItem.delete({
      where: { id: itemId },
    });

    return await this.recalculateQuotation(quotationId);
  }

  /**
   * Submit quotation for formal risk approval or auto-approval
   */
  static async submitQuotation(quotationId: string, performedByUserId: string) {
    const updatedQuote = await this.recalculateQuotation(quotationId);

    if (updatedQuote.items.length === 0) {
      throw new Error('Cannot submit an empty quotation.');
    }

    const requiresApproval = Number(updatedQuote.riskScore) > 0;
    const targetStatus = !requiresApproval
      ? QuotationStatus.APPROVED
      : updatedQuote.approvalLevel === 1
      ? QuotationStatus.PENDING_MANAGER
      : QuotationStatus.PENDING_FINANCE;

    return await prisma.$transaction(async (tx) => {
      // 1. Update quotation status
      const quote = await tx.quotation.update({
        where: { id: quotationId },
        data: {
          status: targetStatus,
          lastActivityAt: new Date(),
        },
      });

      // 2. If approval is required, create the Approval record
      if (requiresApproval) {
        await tx.approval.create({
          data: {
            quotationId,
            level: quote.approvalLevel,
            approverRole: quote.approvalLevel === 1 ? Role.SALES_MANAGER : Role.FINANCE,
            status: ApprovalStatus.PENDING,
            reason: `Automatic routing: Blended Risk Score is ${quote.riskScore}`,
          },
        });
      }

      // 3. Immutable audit log
      await tx.auditLog.create({
        data: {
          entityType: 'QUOTATION',
          entityId: quotationId,
          action: 'SUBMITTED',
          performedBy: performedByUserId,
          newValue: {
            status: targetStatus,
            riskScore: quote.riskScore,
            approvalLevel: quote.approvalLevel,
          },
          reason: requiresApproval
            ? `Routed to ${quote.approvalLevel === 1 ? 'Sales Manager' : 'Finance'} due to risk score ${quote.riskScore}`
            : 'Auto-approved under standard discount ceilings',
        },
      });

      // 4. Staging transactional outbox event
      await tx.outboxEvent.create({
        data: {
          eventType: 'QUOTE_SUBMITTED',
          payload: {
            quotationId,
            quotationNumber: quote.quotationNumber,
            status: targetStatus,
            riskScore: quote.riskScore,
            totalAmount: quote.totalAmount,
          },
        },
      });

      return quote;
    });
  }

  /**
   * Get upsell and cross-sell suggestions for the current quote items
   */
  static async getRecommendations(quotationId: string) {
    const quote = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { items: true },
    });

    if (!quote) throw new Error('Quotation not found.');

    const productIdsInQuote = quote.items.map((i) => i.productId);

    // Find recommended products that are not yet in the quote
    const recommendations = await prisma.productRelationship.findMany({
      where: {
        productId: { in: productIdsInQuote },
        recommendedProductId: { notIn: productIdsInQuote },
      },
      include: {
        recommendedProduct: {
          include: { category: true },
        },
      },
      orderBy: { score: 'desc' },
      take: 4,
    });

    return recommendations.map((r) => {
      const p = r.recommendedProduct;
      const baseGross = Number(p.basePrice);
      const cost = Number(p.costPrice);
      const marginDelta = baseGross - cost;

      return {
        id: r.id,
        productId: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category.name,
        type: r.relationshipType,
        score: Number(r.score),
        price: baseGross,
        marginDelta,
        unit: p.unit,
        isRecurring: p.isRecurring,
      };
    });
  }

  /**
   * List quotations with search & status filters
   */
  static async listQuotations(filters: {
    status?: QuotationStatus;
    salesRepId?: string;
    customerId?: string;
    search?: string;
  }) {
    return await prisma.quotation.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.salesRepId ? { salesRepId: filters.salesRepId } : {}),
        ...(filters.customerId ? { customerId: filters.customerId } : {}),
        ...(filters.search
          ? {
              OR: [
                { quotationNumber: { contains: filters.search, mode: 'insensitive' } },
                { customer: { companyName: { contains: filters.search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        customer: true,
        salesRep: { select: { id: true, username: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single quotation with full relationships
   */
  static async getQuotationById(id: string) {
    return await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: { include: { customerTier: true } },
        salesRep: { select: { id: true, username: true, email: true, role: true } },
        items: { include: { product: { include: { category: true } } } },
        approvals: { include: { approver: { select: { username: true, role: true } } } },
        comments: true,
        negotiations: true,
      },
    });
  }
}
