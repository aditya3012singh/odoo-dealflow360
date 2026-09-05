import { Request, Response, NextFunction } from 'express';
import { QuotationService } from './quotation.service.js';
import { prisma } from '../../core/config/db.js';
import { FormattedResponse } from '../../api/middleware/responseFormatter.js';
import { TracedRequest } from '../../api/middleware/traceId.middleware.js';

export class QuotationController {
  static async listQuotations(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const { status, search, customerId, salesRepId } = req.query;
      const quotations = await QuotationService.listQuotations({
        status: status as any,
        search: search as string,
        customerId: customerId as string,
        salesRepId: salesRepId as string,
      });
      return res.ok ? res.ok(quotations, 'Quotations retrieved') : res.json({ success: true, data: quotations });
    } catch (err) {
      next(err);
    }
  }

  static async getQuotationById(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
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
      const { customerId, currency } = req.body ?? {};
      const salesRepId = (req.user?.id || req.body?.salesRepId) as string | undefined;

      if (!customerId) {
        return res.status(400).json({ success: false, message: 'customerId is required' });
      }

      // If no salesRepId provided (e.g. testing), find the first sales rep or admin
      let effectiveSalesRepId = salesRepId;
      if (!effectiveSalesRepId) {
        const user = await prisma.user.findFirst({
          where: { role: { in: ['SALES_REP', 'ADMIN'] } },
        });
        effectiveSalesRepId = user?.id;
      }

      const quotation = await QuotationService.createQuotation({
        customerId,
        salesRepId: effectiveSalesRepId || '',
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
      const id = req.params.id as string;
      const { productId, quantity, discountPercentage, unitPrice, variantId } = req.body;

      if (!productId || !quantity) {
        return res.status(400).json({ success: false, message: 'productId and quantity are required' });
      }

      const updated = await QuotationService.addItem(id, {
        productId,
        quantity: Number(quantity),
        discountPercentage: discountPercentage !== undefined ? Number(discountPercentage) : undefined,
        unitPrice: unitPrice !== undefined ? Number(unitPrice) : undefined,
        variantId,
      });

      return res.ok ? res.ok(updated, 'Item added') : res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async updateItem(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const itemId = req.params.itemId as string;
      const { quantity, discountPercentage, unitPrice } = req.body;

      const updated = await QuotationService.updateItem(id, itemId, {
        quantity: quantity !== undefined ? Number(quantity) : undefined,
        discountPercentage: discountPercentage !== undefined ? Number(discountPercentage) : undefined,
        unitPrice: unitPrice !== undefined ? Number(unitPrice) : undefined,
      });

      return res.ok ? res.ok(updated, 'Item updated') : res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async removeItem(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const itemId = req.params.itemId as string;
      const updated = await QuotationService.removeItem(id, itemId);
      return res.ok ? res.ok(updated, 'Item removed') : res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async submitQuotation(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const performedBy = (req.user?.id || req.body?.performedBy) as string | undefined;

      let userId = performedBy;
      if (!userId) {
        const quote = await prisma.quotation.findUnique({ where: { id } });
        userId = quote?.salesRepId;
      }

      const result = await QuotationService.submitQuotation(id, userId || '');
      return res.ok ? res.ok(result, 'Quotation submitted for review') : res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getRecommendations(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
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
