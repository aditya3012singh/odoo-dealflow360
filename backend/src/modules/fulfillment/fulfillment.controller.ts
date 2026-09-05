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

  static async listOrders(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const orders = await prisma.order.findMany({
        include: {
          customer: true,
          items: { include: { product: true } },
          fulfillments: {
            include: {
              warehouse: true,
              items: { include: { orderItem: { include: { product: true } } } },
            },
          },
          backorders: { include: { product: true } },
          invoices: true,
          subscriptions: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.ok ? res.ok(orders, 'Orders retrieved') : res.json({ success: true, data: orders });
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
        orderBy: { name: 'asc' },
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
   * Commit automated multi-warehouse fulfillment plan
   * POST /api/fulfillment/orders/:orderId/auto-allocate
   */
  static async commitAutoAllocation(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const actor = getActor(req);
      const orderId = req.params.orderId as string;

      await assertCanReadFulfillment(actor, orderId);

      const result = await AllocationEngine.commitPlan(orderId);

      return res.ok
        ? res.ok(result, 'Auto allocation executed and inventory reserved')
        : res.json({ success: true, data: result });
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

  /**
   * Mark a fulfillment shipment as SHIPPED
   * POST /api/fulfillment/fulfillments/:fulfillmentId/ship
   */
  static async shipFulfillment(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const fulfillmentId = req.params.fulfillmentId as string;
      const { trackingNumber } = req.body;

      if (trackingNumber) {
        await prisma.fulfillment.update({
          where: { id: fulfillmentId },
          data: { shipmentNumber: trackingNumber },
        });
      }

      await AllocationEngine.markShipped(fulfillmentId);

      const updated = await prisma.fulfillment.findUnique({
        where: { id: fulfillmentId },
        include: { warehouse: true, order: true },
      });

      return res.ok
        ? res.ok(updated, 'Fulfillment marked as shipped')
        : res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Mark a fulfillment shipment as DELIVERED
   * POST /api/fulfillment/fulfillments/:fulfillmentId/deliver
   */
  static async deliverFulfillment(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const fulfillmentId = req.params.fulfillmentId as string;

      await AllocationEngine.markDelivered(fulfillmentId);

      const updated = await prisma.fulfillment.findUnique({
        where: { id: fulfillmentId },
        include: { warehouse: true, order: true },
      });

      return res.ok
        ? res.ok(updated, 'Fulfillment marked as delivered and inventory reconciled')
        : res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cancel an un-shipped fulfillment shipment
   * POST /api/fulfillment/fulfillments/:fulfillmentId/cancel
   */
  static async cancelFulfillment(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const fulfillmentId = req.params.fulfillmentId as string;

      await AllocationEngine.cancelFulfillment(fulfillmentId);

      return res.ok
        ? res.ok({ id: fulfillmentId, status: 'CANCELLED' }, 'Fulfillment cancelled and reserved inventory restored')
        : res.json({ success: true, message: 'Fulfillment cancelled' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List all queued Backorders across all orders
   * GET /api/fulfillment/backorders
   */
  static async listBackorders(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const backorders = await prisma.backorder.findMany({
        include: {
          product: true,
          order: {
            include: { customer: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.ok
        ? res.ok(backorders, 'Backorders retrieved')
        : res.json({ success: true, data: backorders });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Trigger backorder processing for a specific product
   * POST /api/fulfillment/backorders/process/:productId
   */
  static async processBackorders(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const productId = req.params.productId as string;

      await AllocationEngine.processBackorders(productId);

      const remainingBackorders = await prisma.backorder.findMany({
        where: { productId },
        include: { product: true, order: true },
      });

      return res.ok
        ? res.ok(remainingBackorders, 'Backorders processed successfully')
        : res.json({ success: true, data: remainingBackorders });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Restock warehouse inventory and auto-resolve open backorders
   * POST /api/fulfillment/warehouses/:warehouseId/restock
   */
  static async restockInventory(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const warehouseId = req.params.warehouseId as string;
      const { productId, quantity } = req.body;

      const qty = Number(quantity);
      if (!productId || isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid productId and positive quantity are required',
        });
      }

      const inventory = await prisma.inventory.upsert({
        where: {
          warehouseId_productId: { warehouseId, productId },
        },
        update: {
          availableQty: { increment: qty },
        },
        create: {
          warehouseId,
          productId,
          availableQty: qty,
          reservedQty: 0,
        },
        include: { warehouse: true, product: true },
      });

      // Automatically trigger FIFO backorder fulfillment for this product
      await AllocationEngine.processBackorders(productId);

      return res.ok
        ? res.ok(inventory, `Restocked ${qty} units and executed backorder check`)
        : res.json({ success: true, data: inventory });
    } catch (err) {
      next(err);
    }
  }
}
