import { prisma, TX_OPTIONS } from '../../core/config/db.js';
import { FulfillmentStatus, OrderStatus, BackorderStatus } from '@prisma/client';

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

        // Reserve stock in inventory
        await tx.inventory.updateMany({
          where: { warehouseId: split.warehouseId },
          data: {
            reservedQty: { increment: split.allocatedQty },
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
}

