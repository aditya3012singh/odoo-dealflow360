import { prisma, TX_OPTIONS } from '../../core/config/db.js';
import { AlertType, AlertSeverity, AlertStatus, QuotationStatus, OrderStatus } from '@prisma/client';
import logger from '../../core/logger/structuredLogger.js';

// ============================================================================
// DEAL HEALTH & ANOMALY DETECTION ENGINE
// Scans for: stalled deals, discount anomalies, delivery slippage
// Designed to be called by a BullMQ worker or a scheduled cron job.
// ============================================================================

const STALL_THRESHOLD_DAYS = 7;
const DISCOUNT_ANOMALY_MULTIPLIER = 1.5; // rep avg * 1.5 triggers anomaly

export class DealHealthEngine {

  /**
   * Run all health checks and create DealAlert records for new issues.
   * Idempotent — won't create duplicate alerts for the same entity.
   */
  static async runAllChecks(): Promise<{ stalled: number; anomalies: number; slippage: number }> {
    const [stalled, anomalies, slippage] = await Promise.all([
      this.detectStalledDeals(),
      this.detectDiscountAnomalies(),
      this.detectDeliverySlippage(),
    ]);
    logger.info(`[DealHealth] Scan complete — stalled:${stalled} anomalies:${anomalies} slippage:${slippage}`);
    return { stalled, anomalies, slippage };
  }

  // ── 1. Stalled Deals ──────────────────────────────────────────────────────

  /**
   * Find quotations that have not had any activity for > STALL_THRESHOLD_DAYS
   * and are still in an active (non-terminal) status.
   */
  static async detectStalledDeals(): Promise<number> {
    const threshold = new Date(Date.now() - STALL_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

    const activeStatuses = [
      QuotationStatus.DRAFT,
      QuotationStatus.PENDING_MANAGER,
      QuotationStatus.PENDING_FINANCE,
      QuotationStatus.APPROVED,
      QuotationStatus.UNDER_NEGOTIATION,
    ];

    const stalledQuotes = await prisma.quotation.findMany({
      where: {
        status: { in: activeStatuses },
        lastActivityAt: { lt: threshold },
      },
      select: { id: true, quotationNumber: true, status: true, lastActivityAt: true },
    });

    let created = 0;
    for (const q of stalledQuotes) {
      const exists = await prisma.dealAlert.findFirst({
        where: { quotationId: q.id, alertType: AlertType.STALLED_DEAL, status: AlertStatus.OPEN },
      });
      if (exists) continue;

      const daysSinceActivity = Math.floor(
        (Date.now() - new Date(q.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      await prisma.dealAlert.create({
        data: {
          quotationId: q.id,
          alertType: AlertType.STALLED_DEAL,
          severity: daysSinceActivity > 14 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
          title: `Stalled Deal: ${q.quotationNumber}`,
          description: `Quotation ${q.quotationNumber} (status: ${q.status}) has had no activity for ${daysSinceActivity} days.`,
          status: AlertStatus.OPEN,
        },
      });
      created++;
    }
    return created;
  }

  // ── 2. Discount Anomaly Detection ─────────────────────────────────────────

  /**
   * Compare each rep's recent discount against their own historical average.
   * Flag if current quote discount > avg * DISCOUNT_ANOMALY_MULTIPLIER.
   */
  static async detectDiscountAnomalies(): Promise<number> {
    // Get all active quotes with their rep's recent discount history
    const recentQuotes = await prisma.quotation.findMany({
      where: {
        status: { in: [QuotationStatus.PENDING_MANAGER, QuotationStatus.PENDING_FINANCE] },
        riskScore: { gt: 0 },
      },
      select: {
        id: true,
        quotationNumber: true,
        salesRepId: true,
        riskScore: true,
        marginPercentage: true,
      },
    });

    let created = 0;
    for (const q of recentQuotes) {
      // Calculate this rep's average risk score across their last 20 approved/confirmed quotes
      const repHistory = await prisma.quotation.aggregate({
        where: {
          salesRepId: q.salesRepId,
          status: { in: [QuotationStatus.APPROVED, QuotationStatus.CONVERTED_TO_ORDER, QuotationStatus.CONFIRMED] },
        },
        _avg: { riskScore: true },
        _count: true,
      });

      const avgRisk = Number(repHistory._avg.riskScore ?? 0);
      const currentRisk = Number(q.riskScore);

      // Only flag if there's enough history and current risk is anomalously high
      if (repHistory._count < 3) continue;
      if (currentRisk <= avgRisk * DISCOUNT_ANOMALY_MULTIPLIER) continue;

      const exists = await prisma.dealAlert.findFirst({
        where: { quotationId: q.id, alertType: AlertType.DISCOUNT_ANOMALY, status: AlertStatus.OPEN },
      });
      if (exists) continue;

      await prisma.dealAlert.create({
        data: {
          quotationId: q.id,
          alertType: AlertType.DISCOUNT_ANOMALY,
          severity: AlertSeverity.HIGH,
          title: `Discount Anomaly: ${q.quotationNumber}`,
          description:
            `Risk score ${currentRisk.toFixed(2)} is ${(currentRisk / Math.max(avgRisk, 0.01)).toFixed(1)}x ` +
            `above this rep's average of ${avgRisk.toFixed(2)}.`,
          status: AlertStatus.OPEN,
        },
      });
      created++;
    }
    return created;
  }

  // ── 3. Delivery Slippage Detection ────────────────────────────────────────

  /**
   * Find fulfillments that are ALLOCATED or PICKED but were created more than
   * 7 days ago without being shipped — potential delivery promise slippage.
   */
  static async detectDeliverySlippage(): Promise<number> {
    const { FulfillmentStatus } = await import('@prisma/client');
    const slippageThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const laggingFulfillments = await prisma.fulfillment.findMany({
      where: {
        status: { in: [FulfillmentStatus.ALLOCATED, FulfillmentStatus.PICKED] },
        createdAt: { lt: slippageThreshold },
      },
      select: { id: true, orderId: true, shipmentNumber: true, createdAt: true, status: true },
    });

    let created = 0;
    for (const f of laggingFulfillments) {
      const exists = await prisma.dealAlert.findFirst({
        where: { orderId: f.orderId, alertType: AlertType.DELIVERY_SLIPPAGE, status: AlertStatus.OPEN },
      });
      if (exists) continue;

      const daysOverdue = Math.floor(
        (Date.now() - new Date(f.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      await prisma.dealAlert.create({
        data: {
          orderId: f.orderId,
          alertType: AlertType.DELIVERY_SLIPPAGE,
          severity: daysOverdue > 14 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
          title: `Delivery Slippage: Shipment ${f.shipmentNumber ?? f.id.substring(0, 8)}`,
          description: `Shipment ${f.shipmentNumber ?? f.id} has been in ${f.status} state for ${daysOverdue} days without shipping.`,
          status: AlertStatus.OPEN,
        },
      });
      created++;
    }
    return created;
  }

  // ── Alert management ──────────────────────────────────────────────────────

  static async acknowledgeAlert(alertId: string): Promise<void> {
    await prisma.dealAlert.update({
      where: { id: alertId },
      data: { status: AlertStatus.ACKNOWLEDGED, nudgeCount: { increment: 1 } },
    });
  }

  static async resolveAlert(alertId: string): Promise<void> {
    await prisma.dealAlert.update({
      where: { id: alertId },
      data: { status: AlertStatus.RESOLVED, resolvedAt: new Date() },
    });
  }

  static async listOpenAlerts(filters?: { alertType?: AlertType; severity?: AlertSeverity }) {
    return prisma.dealAlert.findMany({
      where: {
        status: { in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
        ...(filters?.alertType ? { alertType: filters.alertType } : {}),
        ...(filters?.severity ? { severity: filters.severity } : {}),
      },
      include: {
        quotation: { select: { quotationNumber: true, status: true } },
        order: { select: { orderNumber: true, status: true } },
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    });
  }
}
