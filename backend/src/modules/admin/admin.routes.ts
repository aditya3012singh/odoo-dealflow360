import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authenticateJWT } from '../../api/middleware/auth.middleware.js';
import { requireRole } from '../../core/auth/rbac.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Guard all admin routes with JWT authentication and Role.ADMIN check
router.use(authenticateJWT, requireRole(Role.ADMIN));

router.get('/overview', AdminController.getOverview);
router.get('/users', AdminController.listUsers);
router.post('/users', AdminController.createUser);
router.patch('/users/:id', AdminController.updateUser);
router.get('/policies', AdminController.listPolicies);
router.post('/products', AdminController.createProduct);
router.get('/warehouses', AdminController.listWarehouses);

export default router;
