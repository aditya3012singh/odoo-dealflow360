import { Router } from 'express';
import { FulfillmentController } from './fulfillment.controller.js';
import { authenticateJWT } from '../../api/middleware/auth.middleware.js';
import { authorizePermission } from '../../core/auth/rbac.middleware.js';
import { Permission } from '../../core/auth/permissions.js';

const router = Router();

// Warehouses & Orders listing
router.get('/warehouses',                                 authenticateJWT, authorizePermission(Permission.FULFILLMENT_READ),   FulfillmentController.listWarehouses);
router.post('/warehouses/:warehouseId/restock',           authenticateJWT, authorizePermission(Permission.FULFILLMENT_MANAGE), FulfillmentController.restockInventory);
router.get('/orders',                                     authenticateJWT, authorizePermission(Permission.FULFILLMENT_READ),   FulfillmentController.listOrders);
router.get('/orders/:orderId',                            authenticateJWT, authorizePermission(Permission.FULFILLMENT_READ),   FulfillmentController.getOrderFulfillment);

// Allocation management (Auto & Manual split routing)
router.get('/orders/:orderId/allocation-plan',            authenticateJWT, authorizePermission(Permission.FULFILLMENT_READ),   FulfillmentController.getAutoAllocationPlan);
router.post('/orders/:orderId/auto-allocate',             authenticateJWT, authorizePermission(Permission.FULFILLMENT_MANAGE), FulfillmentController.commitAutoAllocation);
router.post('/orders/:orderId/manual-allocation',         authenticateJWT, authorizePermission(Permission.FULFILLMENT_MANAGE), FulfillmentController.commitManualAllocation);

// Shipment dispatch lifecycle
router.post('/fulfillments/:fulfillmentId/ship',          authenticateJWT, authorizePermission(Permission.FULFILLMENT_MANAGE), FulfillmentController.shipFulfillment);
router.post('/fulfillments/:fulfillmentId/deliver',       authenticateJWT, authorizePermission(Permission.FULFILLMENT_MANAGE), FulfillmentController.deliverFulfillment);
router.post('/fulfillments/:fulfillmentId/cancel',        authenticateJWT, authorizePermission(Permission.FULFILLMENT_MANAGE), FulfillmentController.cancelFulfillment);

// Backorders management
router.get('/backorders',                                 authenticateJWT, authorizePermission(Permission.FULFILLMENT_READ),   FulfillmentController.listBackorders);
router.post('/backorders/process/:productId',             authenticateJWT, authorizePermission(Permission.FULFILLMENT_MANAGE), FulfillmentController.processBackorders);

export default router;
