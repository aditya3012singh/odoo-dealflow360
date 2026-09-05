import { Router } from 'express';
import { BillingController } from './billing.controller.js';
import { optionalAuth } from '../../api/middleware/auth.middleware.js';

const router = Router();

router.get('/orders/:orderId', optionalAuth, BillingController.getOrderBilling);
router.post('/invoices/:invoiceId/pay', optionalAuth, BillingController.recordPayment);
router.post('/proration/calculate', optionalAuth, BillingController.calculateProration);

export default router;
