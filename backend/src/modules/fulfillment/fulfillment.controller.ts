import { Response, NextFunction } from 'express';
import { prisma } from '../../core/config/db.js';
import { AllocationEngine, ManualSplitInput } from './allocation.engine.js';
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

  /**
   * Generate auto allocation plan (preview only, does not commit)
   * GET /api/fulfillment/orders/:orderId/allocation-plan
   */
  static async getAutoAllocationPlan(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const actor = getActor(req);
      const orderId = req.params.orderId as string;

      await assertCanReadFulfillment(actor, orderId);

      const plan = await AllocationEngine.generatePlan(orderId);

      return res.ok
        ? res.ok(plan, 'Auto allocation plan generated')
        : res.json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Manual warehouse override - commit custom allocation
   * POST /api/fulfillment/orders/:orderId/manual-allocation
   * Body: { splits: [{ productId, warehouseId, quantity }] }
   */
  static async commitManualAllocation(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const actor = getActor(req);
      const orderId = req.params.orderId as string;
      const { splits } = req.body;

      if (!splits || !Array.isArray(splits) || splits.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Manual splits array is required with at least one split',
        });
      }

      // Validate split structure
      for (const split of splits) {
        if (!split.productId || !split.warehouseId || !split.quantity || split.quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Each split must have productId, warehouseId, and positive quantity',
          });
        }
      }

      await assertCanReadFulfillment(actor, orderId);

      const result = await AllocationEngine.commitManualPlan(orderId, splits as ManualSplitInput[]);

      return res.ok
        ? res.ok(result, 'Manual allocation committed successfully')
        : res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
