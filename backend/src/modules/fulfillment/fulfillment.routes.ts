import { Router } from 'express';
import { FulfillmentController } from './fulfillment.controller.js';
import { authenticateJWT } from '../../api/middleware/auth.middleware.js';
import { authorizePermission } from '../../core/auth/rbac.middleware.js';
import { Permission } from '../../core/auth/permissions.js';

const router = Router();

router.get('/warehouses',        authenticateJWT, authorizePermission(Permission.FULFILLMENT_READ), FulfillmentController.listWarehouses);
router.get('/orders/:orderId',   authenticateJWT, authorizePermission(Permission.FULFILLMENT_READ), FulfillmentController.getOrderFulfillment);

export default router;
