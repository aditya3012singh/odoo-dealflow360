import { prisma, TX_OPTIONS } from '../../core/config/db.js';
import { FulfillmentStatus, OrderStatus, BackorderStatus } from '@prisma/client';
import logger from '../../core/logger/structuredLogger.js';

export interface SplitPlanItem {
  warehouseId: string;
  warehouseName: string;
  location: string;
  shippingWeight: number;
  allocatedQty: number;
  estimatedCost: number;
}

export interface AllocationResult {
  orderId: string;
  splits: SplitPlanItem[];
  backorderedQty: number;
  totalShipments: number;
  totalEstimatedFreight: number;
  status: 'FULLY_ALLOCATED' | 'PARTIALLY_ALLOCATED' | 'BACKORDER_REQUIRED';
}

export class AllocationEngine {
  /**
   * Calculate and generate optimal multi-warehouse fulfillment split.
   * Reads from immutable OrderItem snapshot — NOT live quotation items.
   */
  static async generatePlan(orderId: string): Promise<AllocationResult> {
    // Load Order with its immutable OrderItem snapshot + product info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!order) throw new Error('Order not found.');

    const splitsMap = new Map<string, SplitPlanItem>();
    let totalBackordered = 0;

    // Evaluate physical (non-recurring) items from the immutable OrderItem snapshot
    for (const item of order.items) {
      if (item.product.isRecurring) continue; // Skip subscriptions from physical shipping

      let remainingRequired = Number(item.quantity);

      // Fetch warehouse inventories sorted by shipping cost weight (lowest cost first)
      const inventories = await prisma.inventory.findMany({
        where: { productId: item.productId },
        include: { warehouse: true },
        orderBy: { warehouse: { shippingWeight: 'asc' } },
      });

      for (const inv of inventories) {
        if (remainingRequired <= 0) break;

        const effectiveAvailable = Math.max(0, Number(inv.availableQty) - Number(inv.reservedQty));
        if (effectiveAvailable > 0) {
          const takeQty = Math.min(remainingRequired, effectiveAvailable);
          const weight = Number(inv.warehouse.shippingWeight);
          const estimatedCost = Number((takeQty * 250 * weight).toFixed(2)); // ₹250 base per unit freight

          const existing = splitsMap.get(inv.warehouseId);
          if (existing) {
            existing.allocatedQty += takeQty;
            existing.estimatedCost += estimatedCost;
          } else {
            splitsMap.set(inv.warehouseId, {
              warehouseId: inv.warehouseId,
              warehouseName: inv.warehouse.name,
              location: inv.warehouse.location,
              shippingWeight: weight,
              allocatedQty: takeQty,
              estimatedCost,
            });
          }

          remainingRequired -= takeQty;
        }
      }

      if (remainingRequired > 0) {
        totalBackordered += remainingRequired;
      }
    }

    const splits = Array.from(splitsMap.values());
    const totalEstimatedFreight = splits.reduce((sum, s) => sum + s.estimatedCost, 0);

    return {
      orderId,
      splits,
      backorderedQty: totalBackordered,
      totalShipments: splits.length,
      totalEstimatedFreight,
      status:
        totalBackordered === 0
          ? 'FULLY_ALLOCATED'
          : splits.length > 0
          ? 'PARTIALLY_ALLOCATED'
          : 'BACKORDER_REQUIRED',
    };
  }

  /**
   * Commit the fulfillment plan: create Fulfillment/FulfillmentItem records and lock inventory.
   * FulfillmentItems are linked back to their OrderItem for the full snapshot chain:
   * QuotationItem → OrderItem → FulfillmentItem
   */
  static async commitPlan(orderId: string) {
    const plan = await this.generatePlan(orderId);

    // Load OrderItems to link FulfillmentItems back to the snapshot
    const orderItems = await prisma.orderItem.findMany({ where: { orderId } });

    return await prisma.$transaction(async (tx) => {
      // 1. Create Fulfillment records per warehouse split
      for (let i = 0; i < plan.splits.length; i++) {
        const split = plan.splits[i];
        const shipmentNumber = `SHIP-${orderId.substring(0, 4)}-${i + 1}`;

        const fulfillment = await tx.fulfillment.create({
          data: {
            orderId,
            warehouseId: split.warehouseId,
            status: FulfillmentStatus.ALLOCATED,
            shipmentNumber,
            estimatedCost: split.estimatedCost,
          },
        });

        // Create FulfillmentItems linking back to OrderItem snapshots
        // Each FulfillmentItem represents qty allocated from this warehouse for that order line
        for (const orderItem of orderItems) {
          await tx.fulfillmentItem.create({
            data: {
              fulfillmentId: fulfillment.id,
              orderItemId: orderItem.id,
              productId: orderItem.productId,
              quantity: orderItem.quantity,
            },
          });
        }

        // Reserve stock in inventory — decrement availableQty AND increment reservedQty atomically
        await tx.inventory.updateMany({
          where: { warehouseId: split.warehouseId },
          data: {
            availableQty: { decrement: split.allocatedQty },
            reservedQty:  { increment: split.allocatedQty },
          },
        });
      }

      // 2. If backorders exist, create Backorder record
      if (plan.backorderedQty > 0) {
        const primaryItem = orderItems[0];
        if (primaryItem) {
          await tx.backorder.create({
            data: {
              orderId,
              productId: primaryItem.productId,
              quantity: plan.backorderedQty,
              status: BackorderStatus.OPEN,
            },
          });
        }
      }

      // 3. Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status:
            plan.backorderedQty === 0
              ? OrderStatus.FULFILLED
              : OrderStatus.PARTIALLY_FULFILLED,
        },
      });

      return {
        order: updatedOrder,
        plan,
      };
    }, TX_OPTIONS);
  }

  /**
   * Mark a fulfillment as SHIPPED.
   * Does NOT release reservedQty — stock stays reserved until delivered.
   */
  static async markShipped(fulfillmentId: string): Promise<void> {
    await prisma.fulfillment.update({
      where: { id: fulfillmentId },
      data: { status: FulfillmentStatus.SHIPPED, shippedAt: new Date() },
    });
    await AllocationEngine._propagateOrderStatus(
      (await prisma.fulfillment.findUnique({ where: { id: fulfillmentId }, select: { orderId: true } }))!.orderId
    );
  }

  /**
   * Mark a fulfillment as DELIVERED.
   * Releases reservedQty (stock is now physically gone).
   * Propagates Order status to FULFILLED if all fulfillments are done.
   */
  static async markDelivered(fulfillmentId: string): Promise<void> {
    const fulfillment = await prisma.fulfillment.findUnique({
      where: { id: fulfillmentId },
      include: { items: true },
    });
    if (!fulfillment) throw new Error('Fulfillment not found.');

    // Sum total quantity delivered from this fulfillment
    const totalDeliveredQty = fulfillment.items.reduce((sum, fi) => sum + Number(fi.quantity), 0);

    await prisma.$transaction(async (tx) => {
      await tx.fulfillment.update({
        where: { id: fulfillmentId },
        data: { status: FulfillmentStatus.DELIVERED, deliveredAt: new Date() },
      });

      // Release reservedQty — stock is consumed
      await tx.inventory.updateMany({
        where: { warehouseId: fulfillment.warehouseId },
        data: { reservedQty: { decrement: totalDeliveredQty } },
      });
    }, TX_OPTIONS);

    await AllocationEngine._propagateOrderStatus(fulfillment.orderId);
  }

  /**
   * Cancel a fulfillment before shipment.
   * Releases both availableQty and reservedQty back to inventory.
   */
  static async cancelFulfillment(fulfillmentId: string): Promise<void> {
    const fulfillment = await prisma.fulfillment.findUnique({
      where: { id: fulfillmentId },
      include: { items: true },
    });
    if (!fulfillment) throw new Error('Fulfillment not found.');
    if (fulfillment.status === FulfillmentStatus.SHIPPED || fulfillment.status === FulfillmentStatus.DELIVERED) {
      throw new Error('Cannot cancel a fulfillment that has already shipped or been delivered.');
    }

    const totalQty = fulfillment.items.reduce((sum, fi) => sum + Number(fi.quantity), 0);

    await prisma.$transaction(async (tx) => {
      await tx.fulfillment.update({
        where: { id: fulfillmentId },
        data: { status: FulfillmentStatus.CANCELLED },
      });

      // Release inventory — put stock back
      await tx.inventory.updateMany({
        where: { warehouseId: fulfillment.warehouseId },
        data: {
          availableQty: { increment: totalQty },
          reservedQty:  { decrement: totalQty },
        },
      });
    }, TX_OPTIONS);

    await AllocationEngine._propagateOrderStatus(fulfillment.orderId);
  }

  /**
   * Attempt to fill OPEN backorders using newly available inventory.
   * Call this whenever inventory is restocked.
   */
  static async processBackorders(productId: string): Promise<void> {
    const openBackorders = await prisma.backorder.findMany({
      where: { productId, status: { in: [BackorderStatus.OPEN, BackorderStatus.PARTIALLY_FULFILLED] } },
      orderBy: { createdAt: 'asc' }, // FIFO
    });

    for (const bo of openBackorders) {
      const needed = Number(bo.quantity) - Number(bo.fulfilledQty);
      if (needed <= 0) continue;

      const inventories = await prisma.inventory.findMany({
        where: { productId },
        include: { warehouse: true },
        orderBy: { warehouse: { shippingWeight: 'asc' } },
      });

      let remaining = needed;
      for (const inv of inventories) {
        if (remaining <= 0) break;
        const available = Math.max(0, Number(inv.availableQty) - Number(inv.reservedQty));
        if (available <= 0) continue;

        const take = Math.min(remaining, available);
        await prisma.$transaction(async (tx) => {
          await tx.inventory.update({
            where: { id: inv.id },
            data: {
              availableQty: { decrement: take },
              reservedQty:  { increment: take },
            },
          });

          const newFulfilled = Number(bo.fulfilledQty) + take;
          const newStatus = newFulfilled >= Number(bo.quantity)
            ? BackorderStatus.FULFILLED
            : BackorderStatus.PARTIALLY_FULFILLED;

          await tx.backorder.update({
            where: { id: bo.id },
            data: {
              fulfilledQty: newFulfilled,
              status: newStatus,
              ...(newStatus === BackorderStatus.FULFILLED ? { fulfilledAt: new Date() } : {}),
            },
          });
        }, TX_OPTIONS);

        remaining -= take;
        logger.info(`[Backorder] Fulfilled ${take} units of product ${productId} for backorder ${bo.id}`);
      }
    }
  }

  /**
   * Derive and update Order.status from all its Fulfillments.
   * PENDING_FULFILLMENT → PARTIALLY_FULFILLED → FULFILLED
   */
  static async _propagateOrderStatus(orderId: string): Promise<void> {
    const fulfillments = await prisma.fulfillment.findMany({
      where: { orderId },
      select: { status: true },
    });

    const active = fulfillments.filter(f => f.status !== FulfillmentStatus.CANCELLED);
    if (active.length === 0) return;

    const allDelivered = active.every(f => f.status === FulfillmentStatus.DELIVERED);
    const anyDelivered = active.some(f => f.status === FulfillmentStatus.DELIVERED);

    const newStatus = allDelivered
      ? OrderStatus.FULFILLED
      : anyDelivered
      ? OrderStatus.PARTIALLY_FULFILLED
      : OrderStatus.PENDING_FULFILLMENT;

    await prisma.order.update({ where: { id: orderId }, data: { status: newStatus } });
  }
}

