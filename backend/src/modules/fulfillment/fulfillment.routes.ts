import { Router } from 'express';
import { FulfillmentController } from './fulfillment.controller.js';
import { optionalAuth } from '../../api/middleware/auth.middleware.js';

const router = Router();

router.get('/warehouses', optionalAuth, FulfillmentController.listWarehouses);
router.get('/orders/:orderId', optionalAuth, FulfillmentController.getOrderFulfillment);

export default router;
