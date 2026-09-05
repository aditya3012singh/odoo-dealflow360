import { Request, Response, NextFunction } from 'express';
import { QuotationService } from './quotation.service.js';
import { prisma } from '../../core/config/db.js';
import { FormattedResponse } from '../../api/middleware/responseFormatter.js';
import { TracedRequest } from '../../api/middleware/traceId.middleware.js';
import { assertCanReadQuote, AuthenticatedActor } from '../../core/auth/authorization.service.js';
import { Role } from '@prisma/client';

/**
 * Build an AuthenticatedActor from the request user.
 * Throws 401 if no authenticated user is present (should not happen after authenticateJWT middleware).
 */
function getActor(req: TracedRequest): AuthenticatedActor {
  if (!req.user) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  return { id: req.user.id as string, role: req.user.role as Role };
}

export class QuotationController {
  static async listQuotations(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const actor = getActor(req);
      const { status, search, customerId } = req.query;

      // SALES_REP can only list their own quotations
      const salesRepFilter = actor.role === Role.SALES_REP ? actor.id : (req.query.salesRepId as string | undefined);

      const quotations = await QuotationService.listQuotations({
        status: status as any,
        search: search as string,
        customerId: customerId as string,
        salesRepId: salesRepFilter,
      });
      return res.ok ? res.ok(quotations, 'Quotations retrieved') : res.json({ success: true, data: quotations });
    } catch (err) {
      next(err);
    }
  }

  static async getQuotationById(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const actor = getActor(req);
      const id = req.params.id as string;

      // Resource-level ownership check
      await assertCanReadQuote(actor, id);

      const quotation = await QuotationService.getQuotationById(id);
      if (!quotation) {
        return res.status(404).json({ success: false, message: 'Quotation not found' });
      }
      return res.ok ? res.ok(quotation, 'Quotation details') : res.json({ success: true, data: quotation });
    } catch (err) {
      next(err);
    }
  }

  static async createQuotation(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const actor = getActor(req);
      const { customerId, currency } = req.body ?? {};

      if (!customerId) {
        return res.status(400).json({ success: false, message: 'customerId is required' });
      }

      // salesRepId is always sourced from the authenticated JWT — never from req.body
      const quotation = await QuotationService.createQuotation({
        customerId,
        salesRepId: actor.id,
        currency,
      });

      return res.created
        ? res.created(quotation, 'Quotation created')
        : res.status(201).json({ success: true, data: quotation });
    } catch (err) {
      next(err);
    }
  }

  static async addItem(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const actor = getActor(req);
      const id = req.params.id as string;
      const { productId, quantity, discountPercentage, unitPrice, variantId } = req.body;

      if (!productId || !quantity) {
        return res.status(400).json({ success: false, message: 'productId and quantity are required' });
      }

      const updated = await QuotationService.addItem(
        id,
        {
          productId,
          quantity: Number(quantity),
          discountPercentage: discountPercentage !== undefined ? Number(discountPercentage) : undefined,
          unitPrice: unitPrice !== undefined ? Number(unitPrice) : undefined,
          variantId,
        },
        actor
      );

      return res.ok ? res.ok(updated, 'Item added') : res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async updateItem(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const actor = getActor(req);
      const id = req.params.id as string;
      const itemId = req.params.itemId as string;
      const { quantity, discountPercentage, unitPrice } = req.body;

      const updated = await QuotationService.updateItem(
        id,
        itemId,
        {
          quantity: quantity !== undefined ? Number(quantity) : undefined,
          discountPercentage: discountPercentage !== undefined ? Number(discountPercentage) : undefined,
          unitPrice: unitPrice !== undefined ? Number(unitPrice) : undefined,
        },
        actor
      );

      return res.ok ? res.ok(updated, 'Item updated') : res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async removeItem(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const actor = getActor(req);
      const id = req.params.id as string;
      const itemId = req.params.itemId as string;
      const updated = await QuotationService.removeItem(id, itemId, actor);
      return res.ok ? res.ok(updated, 'Item removed') : res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async deleteQuotation(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const actor = getActor(req);
      const id = req.params.id as string;
      const result = await QuotationService.deleteQuotation(id, actor);
      return res.ok ? res.ok(result, 'Quotation deleted successfully') : res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async submitQuotation(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const actor = getActor(req);
      const id = req.params.id as string;

      const result = await QuotationService.submitQuotation(id, actor.id, actor);
      return res.ok ? res.ok(result, 'Quotation submitted for review') : res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getRecommendations(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const actor = getActor(req);
      const id = req.params.id as string;
      await assertCanReadQuote(actor, id);
      const recommendations = await QuotationService.getRecommendations(id);
      return res.ok ? res.ok(recommendations, 'Recommendations retrieved') : res.json({ success: true, data: recommendations });
    } catch (err) {
      next(err);
    }
  }

  static async listCustomers(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const customers = await prisma.customer.findMany({
        include: { customerTier: true },
        orderBy: { companyName: 'asc' },
      });
      return res.ok ? res.ok(customers, 'Customers retrieved') : res.json({ success: true, data: customers });
    } catch (err) {
      next(err);
    }
  }

  static async listProducts(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        include: { category: true, variants: true },
        orderBy: { name: 'asc' },
      });
      return res.ok ? res.ok(products, 'Products retrieved') : res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  }
}
