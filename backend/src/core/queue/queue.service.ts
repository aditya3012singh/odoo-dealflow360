import { Queue } from 'bullmq';
import env from '../config/env.js';
import logger from '../logger/structuredLogger.js';

const connectionOptions = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
};

const queueName = env.QUEUE_NAME || 'default_queue';

class QueueService {
    private static queue: Queue | null = null;

    /**
     * Get the active BullMQ Queue instance
     */
    static getQueue(): Queue | null {
        if (this.queue) {
            return this.queue;
        }

        try {
            logger.info(`[QueueService] 📦 Initializing BullMQ Queue: ${queueName}`);
            this.queue = new Queue(queueName, {
                connection: connectionOptions,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 1000,
                    },
                    removeOnComplete: true,
                    removeOnFail: false,
                },
            });
        } catch (error) {
            logger.error(`[QueueService] ❌ Failed to initialize BullMQ Queue:`, error);
        }

        return this.queue;
    }

    /**
     * Add a job to the background queue
     */
    static async addJob(jobName: string, data: any = {}, options: any = {}): Promise<any> {
        const queue = this.getQueue();
        if (!queue) {
            logger.error(`[QueueService] ❌ Queue not initialized. Cannot queue job: ${jobName}`);
            return null;
        }

        try {
            const job = await queue.add(jobName, data, options);
            logger.info(`[QueueService] 🚀 Job ${jobName} queued successfully (ID: ${job.id})`);
            return job;
        } catch (error) {
            logger.error(`[QueueService] ❌ Failed to add job ${jobName} to queue:`, error);
            throw error;
        }
    }

    /**
     * Enqueue write-behind inventory stock sync
     */
    static async enqueueStockSync(warehouseId: string, productId: string, availableQty: number): Promise<any> {
        return this.addJob('sync_inventory_stock', { warehouseId, productId, availableQty });
    }

    /**
     * Retrieve real-time BullMQ queue metrics and recent failed jobs
     */
    static async getMetrics(): Promise<any> {
        const queue = this.getQueue();
        if (!queue) {
            return {
                isHealthy: false,
                queueName,
                counts: { active: 0, completed: 0, failed: 0, delayed: 0, waiting: 0, paused: 0 },
                failedJobs: [],
                error: 'Queue connection is offline',
            };
        }

        try {
            const counts = await queue.getJobCounts('active', 'completed', 'failed', 'delayed', 'waiting', 'paused');
            const failedRaw = await queue.getFailed(0, 10);
            const failedJobs = failedRaw.map((job) => ({
                id: job.id,
                name: job.name,
                data: job.data,
                failedReason: job.failedReason,
                timestamp: job.timestamp,
                attemptsMade: job.attemptsMade,
            }));

            return {
                isHealthy: true,
                queueName,
                counts,
                failedJobs,
            };
        } catch (error: any) {
            logger.error('[QueueService] Failed to fetch queue metrics:', error);
            return {
                isHealthy: false,
                queueName,
                counts: { active: 0, completed: 0, failed: 0, delayed: 0, waiting: 0, paused: 0 },
                failedJobs: [],
                error: error.message,
            };
        }
    }

    /**
     * Re-enqueue failed jobs for execution
     */
    static async retryFailed(count: number = 20): Promise<{ retriedCount: number }> {
        const queue = this.getQueue();
        if (!queue) {
            throw new Error('Queue connection is offline');
        }

        const failedJobs = await queue.getFailed(0, count);
        let retriedCount = 0;
        for (const job of failedJobs) {
            try {
                await job.retry();
                retriedCount++;
            } catch (err) {
                logger.warn(`[QueueService] Failed to retry job ${job.id}:`, err);
            }
        }
        return { retriedCount };
    }
}

export default QueueService;

