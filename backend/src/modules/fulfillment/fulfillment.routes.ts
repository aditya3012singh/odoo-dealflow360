import { Router } from 'express';
import { FulfillmentController } from './fulfillment.controller.js';
import { authenticateJWT } from '../../api/middleware/auth.middleware.js';
import { authorizePermission } from '../../core/auth/rbac.middleware.js';
import { Permission } from '../../core/auth/permissions.js';

const router = Router();

router.get('/warehouses',                                authenticateJWT, authorizePermission(Permission.FULFILLMENT_READ),   FulfillmentController.listWarehouses);
router.get('/orders/:orderId',                           authenticateJWT, authorizePermission(Permission.FULFILLMENT_READ),   FulfillmentController.getOrderFulfillment);

// Allocation management
router.get('/orders/:orderId/allocation-plan',           authenticateJWT, authorizePermission(Permission.FULFILLMENT_READ),   FulfillmentController.getAutoAllocationPlan);
router.post('/orders/:orderId/manual-allocation',        authenticateJWT, authorizePermission(Permission.FULFILLMENT_MANAGE), FulfillmentController.commitManualAllocation);

export default router;
