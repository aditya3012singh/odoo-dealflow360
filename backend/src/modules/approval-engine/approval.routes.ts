import { Router } from 'express';
import { ApprovalController } from './approval.controller.js';
import { optionalAuth } from '../../api/middleware/auth.middleware.js';

const router = Router();

router.get('/pending', optionalAuth, ApprovalController.listPending);
router.post('/:id/decision', optionalAuth, ApprovalController.processDecision);

export default router;
