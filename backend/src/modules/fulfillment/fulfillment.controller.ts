import { Response, NextFunction } from 'express';
import { prisma } from '../../core/config/db.js';
import { FormattedResponse } from '../../api/middleware/responseFormatter.js';
import { TracedRequest } from '../../api/middleware/traceId.middleware.js';
import { Role } from '@prisma/client';
import { assertCanReadFulfillment, AuthenticatedActor } from '../../core/auth/authorization.service.js';

function getActor(req: TracedRequest): AuthenticatedActor {
  if (!req.user) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  return { id: req.user.id as string, role: req.user.role as Role };
}

export class FulfillmentController {
  static async getOrderFulfillment(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const actor = getActor(req);
      const orderId = req.params.orderId as string;

      // Resource-level ownership check
      await assertCanReadFulfillment(actor, orderId);

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          fulfillments: { include: { warehouse: true, items: true } },
          backorders: { include: { product: true } },
          quotation: { include: { items: { include: { product: true } } } },
        },
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      return res.ok ? res.ok(order, 'Order fulfillment status') : res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  static async listWarehouses(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const warehouses = await prisma.warehouse.findMany({
        include: {
          inventory: {
            include: { product: true },
          },
        },
      });
      return res.ok ? res.ok(warehouses, 'Warehouses and stock') : res.json({ success: true, data: warehouses });
    } catch (err) {
      next(err);
    }
  }
}
