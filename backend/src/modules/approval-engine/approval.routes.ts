import { Router } from 'express';
import { ApprovalController } from './approval.controller.js';
import { authenticateJWT } from '../../api/middleware/auth.middleware.js';
import { authorizePermission } from '../../core/auth/rbac.middleware.js';
import { Permission } from '../../core/auth/permissions.js';

const router = Router();

router.get('/pending',        authenticateJWT, authorizePermission(Permission.APPROVAL_READ),   ApprovalController.listPending);
router.post('/:id/decision',  authenticateJWT, authorizePermission(Permission.APPROVAL_DECIDE), ApprovalController.processDecision);

export default router;
