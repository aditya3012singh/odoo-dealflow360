import { Router } from 'express';
import { CustomerController } from './customer.controller.js';
import { authenticateJWT } from '../../api/middleware/auth.middleware.js';
import { requireRole } from '../../core/auth/rbac.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// All customer routes require employee authentication
router.use(authenticateJWT);

router.get('/', CustomerController.listCustomers);
router.get('/tiers', CustomerController.getCustomerTiers);
router.get('/:id/360', CustomerController.getCustomer360);
router.get('/:id', CustomerController.getCustomer360);

router.post(
  '/',
  requireRole(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP, Role.OPERATIONS),
  CustomerController.createCustomer
);

router.put(
  '/:id',
  requireRole(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP, Role.OPERATIONS),
  CustomerController.updateCustomer
);

router.post(
  '/:id/portal-token',
  requireRole(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP, Role.OPERATIONS),
  CustomerController.issuePortalToken
);

router.delete(
  '/:id/portal-token',
  requireRole(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP, Role.OPERATIONS),
  CustomerController.revokePortalToken
);

export default router;
