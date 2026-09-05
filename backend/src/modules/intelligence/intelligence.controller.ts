import { Response, NextFunction } from 'express';
import { DealHealthEngine } from './deal-health.engine.js';
import { FormattedResponse } from '../../api/middleware/responseFormatter.js';
import { TracedRequest } from '../../api/middleware/traceId.middleware.js';
import { AlertType, AlertSeverity } from '@prisma/client';

export class IntelligenceController {
  /** Run all health checks manually (useful for demo / admin trigger) */
  static async runHealthScan(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const result = await DealHealthEngine.runAllChecks();
      return res.ok ? res.ok(result, 'Deal health scan complete') : res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /** List open deal alerts */
  static async listAlerts(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const alertType = req.query.alertType as AlertType | undefined;
      const severity  = req.query.severity  as AlertSeverity | undefined;
      const alerts = await DealHealthEngine.listOpenAlerts({ alertType, severity });
      return res.ok ? res.ok(alerts, 'Deal alerts') : res.json({ success: true, data: alerts });
    } catch (err) {
      next(err);
    }
  }

  /** Acknowledge a deal alert */
  static async acknowledgeAlert(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      await DealHealthEngine.acknowledgeAlert(req.params.id as string);
      return res.ok ? res.ok({}, 'Alert acknowledged') : res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  /** Resolve a deal alert */
  static async resolveAlert(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      await DealHealthEngine.resolveAlert(req.params.id as string);
      return res.ok ? res.ok({}, 'Alert resolved') : res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
}
