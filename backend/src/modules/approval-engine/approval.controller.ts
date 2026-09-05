import { Response, NextFunction } from 'express';
import { ApprovalService } from './approval.service.js';
import { FormattedResponse } from '../../api/middleware/responseFormatter.js';
import { TracedRequest } from '../../api/middleware/traceId.middleware.js';
import { Role } from '@prisma/client';
import { assertCanApprove, AuthenticatedActor } from '../../core/auth/authorization.service.js';

function getActor(req: TracedRequest): AuthenticatedActor {
  if (!req.user) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  return { id: req.user.id as string, role: req.user.role as Role };
}

export class ApprovalController {
  static async listPending(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const actor = getActor(req);

      // FINANCE sees only finance-level approvals; SALES_MANAGER sees manager-level; ADMIN sees all
      let roleFilter: Role | undefined;
      if (actor.role === Role.FINANCE) roleFilter = Role.FINANCE;
      else if (actor.role === Role.SALES_MANAGER) roleFilter = Role.SALES_MANAGER;
      // ADMIN: no filter → see all

      const pending = await ApprovalService.listPending(roleFilter);
      return res.ok ? res.ok(pending, 'Pending approvals') : res.json({ success: true, data: pending });
    } catch (err) {
      next(err);
    }
  }

  static async processDecision(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const actor = getActor(req);
      const id = req.params.id as string;
      const { action, reason } = req.body;

      if (!action || !['APPROVE', 'REJECT'].includes(action)) {
        return res.status(400).json({ success: false, message: 'Action must be APPROVE or REJECT' });
      }

      // Resource-level + self-approval + approval-level authorization
      await assertCanApprove(actor, id);

      const result = await ApprovalService.processDecision(
        id,
        actor.id,
        action,
        reason || `Decision recorded as ${action}`
      );

      return res.ok ? res.ok(result, result.message) : res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
