import { Worker, Job } from 'bullmq';
import env from '../config/env.js';
import logger from '../logger/structuredLogger.js';
import EmailService from '../email/email.service.js';

const connectionOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
};

const queueName = env.QUEUE_NAME || 'default_queue';

// ============================================================================
// JOB HANDLERS REGISTRY
// Each key maps to an async handler that receives the job data payload.
// ============================================================================

const jobHandlers: Record<string, (data: any) => Promise<void>> = {

  // ── Email ──────────────────────────────────────────────────────────────────
  send_test_email: async (data) => {
    await EmailService.sendEmail({
      to: data.to,
      subject: data.subject || 'Hello from DealFlow360!',
      text: data.text || 'This is a background queue email.',
      html: data.html || '<p>This is a background queue email.</p>',
    });
  },

  send_quote_submitted_email: async (data) => {
    if (!data.to) return;
    await EmailService.sendEmail({
      to: data.to,
      subject: `Quote ${data.quotationNumber} submitted for approval`,
      text: `Quote ${data.quotationNumber} has been submitted and routed for approval (Risk Score: ${data.riskScore}).`,
      html: `<p>Quote <strong>${data.quotationNumber}</strong> submitted. Risk Score: ${data.riskScore}. Status: ${data.status}.</p>`,
    });
  },

  send_quote_approved_email: async (data) => {
    if (!data.to) return;
    await EmailService.sendEmail({
      to: data.to,
      subject: `Quote ${data.quotationNumber} approved`,
      text: `Your quote ${data.quotationNumber} has been approved.`,
      html: `<p>Great news! Quote <strong>${data.quotationNumber}</strong> has been approved.</p>`,
    });
  },

  send_counter_offer_email: async (data) => {
    if (!data.to) return;
    await EmailService.sendEmail({
      to: data.to,
      subject: `Counter-offer received on Quote ${data.quotationNumber}`,
      text: `Customer has proposed ${data.requestedDiscount}% discount on quote ${data.quotationNumber}.`,
      html: `<p>A customer counter-offer of <strong>${data.requestedDiscount}%</strong> was submitted on quote <strong>${data.quotationNumber}</strong>. New risk score: ${data.newRiskScore}.</p>`,
    });
  },

  send_payment_received_email: async (data) => {
    if (!data.to) return;
    await EmailService.sendEmail({
      to: data.to,
      subject: `Payment received — Invoice ${data.invoiceNumber}`,
      text: `Payment of ₹${data.amount} received for invoice ${data.invoiceNumber}. Status: ${data.invoiceStatus}.`,
      html: `<p>Payment of <strong>₹${data.amount}</strong> received. Invoice <strong>${data.invoiceNumber}</strong> status: ${data.invoiceStatus}.</p>`,
    });
  },

  // ── Deal Health Scan ───────────────────────────────────────────────────────
  deal_health_scan: async (_data) => {
    logger.info('[Worker] Running deal health scan...');
    // Dynamic import to avoid circular deps at startup
    const { DealHealthEngine } = await import('../../modules/intelligence/deal-health.engine.js');
    const result = await DealHealthEngine.runAllChecks();
    logger.info(`[Worker] Deal health scan complete: ${JSON.stringify(result)}`);
  },

  // ── Backorder Processing ──────────────────────────────────────────────────
  process_backorders: async (data) => {
    if (!data.productId) {
      logger.warn('[Worker] process_backorders: missing productId');
      return;
    }
    const { AllocationEngine } = await import('../../modules/fulfillment/allocation.engine.js');
    await AllocationEngine.processBackorders(data.productId);
    logger.info(`[Worker] Backorders processed for product ${data.productId}`);
  },

  // ── Outbox Event Dispatcher ───────────────────────────────────────────────
  // Polls PENDING outbox events and re-publishes them to the event bus.
  // This guarantees no events are lost even if Redis was down at transaction time.
  dispatch_outbox_events: async (_data) => {
    const { prisma } = await import('../config/db.js');
    const dualModeEventBus = (await import('../events/dualModeEventBus.js')).default;

    const events = await prisma.outboxEvent.findMany({
      where: { status: 'PENDING', retryCount: { lt: 5 } },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    for (const event of events) {
      try {
        await dualModeEventBus.emitEvent(event.eventType, event.payload as any, event.id);
        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: { status: 'PROCESSED', processedAt: new Date() },
        });
      } catch (err: any) {
        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            retryCount: { increment: 1 },
            error: err.message,
            ...(event.retryCount + 1 >= 5 ? { status: 'FAILED' } : {}),
          },
        });
        logger.error(`[Worker] Outbox dispatch failed for event ${event.id}: ${err.message}`);
      }
    }
  },
};

// ============================================================================
// WORKER BOOTSTRAP
// ============================================================================

export function startWorker(): Worker {
  logger.info(`[Worker] ⚙️  Starting BullMQ worker on queue: ${queueName} (concurrency: ${env.WORKER_CONCURRENCY || 5})`);

  const worker = new Worker(
    queueName,
    async (job: Job) => {
      const handler = jobHandlers[job.name];
      if (!handler) {
        logger.warn(`[Worker] ⚠️  No handler registered for job: ${job.name}`);
        return;
      }

      logger.info(`[Worker] 🏃 Executing job ${job.name} (ID: ${job.id})`);
      const start = Date.now();
      try {
        await handler(job.data);
        logger.info(`[Worker] ✅ Job ${job.name} (ID: ${job.id}) completed in ${Date.now() - start}ms`);
      } catch (error) {
        logger.error(`[Worker] ❌ Job ${job.name} (ID: ${job.id}) failed:`, error);
        throw error; // BullMQ will retry per the queue's backoff config
      }
    },
    {
      connection: connectionOptions,
      concurrency: env.WORKER_CONCURRENCY || 5,
    }
  );

  worker.on('active',  (job) => logger.debug(`[Worker] Active: ${job.id}`));
  worker.on('failed',  (job, err) => logger.error(`[Worker] Failed: ${job?.id} — ${err.message}`));
  worker.on('error',   (err) => logger.error('[Worker] General error:', err));

  process.on('SIGTERM', async () => {
    logger.info('[Worker] 🛑 SIGTERM — closing worker gracefully...');
    await worker.close();
  });

  return worker;
}

// Auto-start when run directly via `npm run worker`
const isDirectRun =
  process.argv[1]?.endsWith('worker.js') ||
  process.argv[1]?.endsWith('worker') ||
  process.argv[1]?.endsWith('worker.ts');

if (isDirectRun) {
  startWorker();
}
