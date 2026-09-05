import { Response, NextFunction } from 'express';
import { prisma } from '../../core/config/db.js';
import { BillingEngine } from './billing.engine.js';
import { FormattedResponse } from '../../api/middleware/responseFormatter.js';
import { TracedRequest } from '../../api/middleware/traceId.middleware.js';

export class BillingController {
  static async getOrderBilling(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const orderId = req.params.orderId as string;

      const invoices = await prisma.invoice.findMany({
        where: { orderId },
        include: { items: true, payments: true },
      });

      const subscriptions = await prisma.subscription.findMany({
        where: { orderId },
        include: {
          plan: true,
          product: true,
          billingSchedules: { orderBy: { billingDate: 'asc' } },
        },
      });

      return res.ok
        ? res.ok({ invoices, subscriptions }, 'Billing details')
        : res.json({ success: true, data: { invoices, subscriptions } });
    } catch (err) {
      next(err);
    }
  }

  static async recordPayment(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const invoiceId = req.params.invoiceId as string;
      const { amount, paymentMethod } = req.body;

      if (!amount) {
        return res.status(400).json({ success: false, message: 'Amount is required' });
      }

      const result = await BillingEngine.recordPayment(invoiceId, Number(amount), paymentMethod);
      return res.ok ? res.ok(result, 'Payment recorded') : res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async calculateProration(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const { currentPrice, newPrice, daysRemaining, daysInMonth } = req.body;
      const proration = BillingEngine.calculateProration(
        Number(currentPrice),
        Number(newPrice),
        Number(daysRemaining),
        daysInMonth ? Number(daysInMonth) : 30
      );
      return res.ok ? res.ok(proration, 'Proration calculated') : res.json({ success: true, data: proration });
    } catch (err) {
      next(err);
    }
  }
}
