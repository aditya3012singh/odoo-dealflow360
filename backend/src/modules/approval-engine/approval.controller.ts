import { Response, NextFunction } from 'express';
import { ApprovalService } from './approval.service.js';
import { prisma } from '../../core/config/db.js';
import { FormattedResponse } from '../../api/middleware/responseFormatter.js';
import { TracedRequest } from '../../api/middleware/traceId.middleware.js';
import { Role } from '@prisma/client';

export class ApprovalController {
  static async listPending(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const role = (req.query.role as Role) || req.user?.role;
      const pending = await ApprovalService.listPending(role);
      return res.ok ? res.ok(pending, 'Pending approvals') : res.json({ success: true, data: pending });
    } catch (err) {
      next(err);
    }
  }

  static async processDecision(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { action, reason } = req.body;

      if (!action || !['APPROVE', 'REJECT'].includes(action)) {
        return res.status(400).json({ success: false, message: 'Action must be APPROVE or REJECT' });
      }

      let approverUserId = req.user?.id || req.body.approverUserId;
      if (!approverUserId) {
        // Fallback to designated sales manager or finance user
        const approver = await prisma.user.findFirst({
          where: { role: { in: [Role.SALES_MANAGER, Role.FINANCE, Role.ADMIN] } },
        });
        approverUserId = approver?.id;
      }

      const result = await ApprovalService.processDecision(
        id,
        approverUserId,
        action,
        reason || `Decision recorded as ${action}`
      );

      return res.ok ? res.ok(result, result.message) : res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
