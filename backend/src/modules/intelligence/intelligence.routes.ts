import { Router } from 'express';
import { IntelligenceController } from './intelligence.controller.js';
import { authenticateJWT } from '../../api/middleware/auth.middleware.js';
import { requireRole } from '../../core/auth/rbac.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

const managers = [Role.ADMIN, Role.SALES_MANAGER, Role.FINANCE, Role.OPERATIONS];

router.get('/alerts',               authenticateJWT, requireRole(...managers), IntelligenceController.listAlerts);
router.post('/scan',                authenticateJWT, requireRole(Role.ADMIN, Role.OPERATIONS), IntelligenceController.runHealthScan);
router.patch('/alerts/:id/ack',     authenticateJWT, requireRole(...managers), IntelligenceController.acknowledgeAlert);
router.patch('/alerts/:id/resolve', authenticateJWT, requireRole(...managers), IntelligenceController.resolveAlert);

export default router;
