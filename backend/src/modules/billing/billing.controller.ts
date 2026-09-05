import { Response, NextFunction } from 'express';
import { prisma } from '../../core/config/db.js';
import { BillingEngine } from './billing.engine.js';
import { FormattedResponse } from '../../api/middleware/responseFormatter.js';
import { TracedRequest } from '../../api/middleware/traceId.middleware.js';
import { Role } from '@prisma/client';
import {
  assertCanReadBilling,
  assertValidPaymentAmount,
  AuthenticatedActor,
} from '../../core/auth/authorization.service.js';

function getActor(req: TracedRequest): AuthenticatedActor {
  if (!req.user) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  return { id: req.user.id as string, role: req.user.role as Role };
}

export class BillingController {
  static async listInvoices(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const invoices = await prisma.invoice.findMany({
        include: { items: true, payments: true, order: { include: { customer: true } } },
        orderBy: { issuedAt: 'desc' },
      });
      return res.ok ? res.ok(invoices, 'Invoices retrieved') : res.json({ success: true, data: invoices });
    } catch (err) {
      next(err);
    }
  }

  static async getOrderBilling(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const actor = getActor(req);
      const orderId = req.params.orderId as string;

      // Resource-level ownership check
      await assertCanReadBilling(actor, orderId);

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

      if (amount === undefined || amount === null) {
        return res.status(400).json({ success: false, message: 'Amount is required' });
      }

      const parsedAmount = Number(amount);

      // Payment validation: amount > 0 and amount <= remaining balance
      await assertValidPaymentAmount(invoiceId, parsedAmount);

      const result = await BillingEngine.recordPayment(invoiceId, parsedAmount, paymentMethod);
      return res.ok ? res.ok(result, 'Payment recorded') : res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async calculateProration(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const { currentPrice, newPrice, daysRemaining, daysInMonth } = req.body;

      if (currentPrice === undefined || newPrice === undefined || daysRemaining === undefined) {
        return res.status(400).json({
          success: false,
          message: 'currentPrice, newPrice, and daysRemaining are required',
        });
      }

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

  static async listSubscriptions(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const subscriptions = await prisma.subscription.findMany({
        include: {
          customer: true,
          product: true,
          plan: true,
          order: true,
          billingSchedules: { orderBy: { billingDate: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.ok ? res.ok(subscriptions, 'Subscriptions retrieved') : res.json({ success: true, data: subscriptions });
    } catch (err) {
      next(err);
    }
  }

  static async updateSubscriptionStatus(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
      }

      const subscription = await prisma.subscription.update({
        where: { id },
        data: {
          status,
          cancelledAt: status === 'CANCELLED' ? new Date() : undefined,
        },
        include: { customer: true, product: true, plan: true },
      });

      return res.ok ? res.ok(subscription, 'Subscription status updated') : res.json({ success: true, data: subscription });
    } catch (err) {
      next(err);
    }
  }
}
