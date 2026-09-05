import { Router } from 'express';
import { BillingController } from './billing.controller.js';
import { authenticateJWT } from '../../api/middleware/auth.middleware.js';
import { authorizePermission } from '../../core/auth/rbac.middleware.js';
import { Permission } from '../../core/auth/permissions.js';

const router = Router();

router.get('/orders/:orderId',              authenticateJWT, authorizePermission(Permission.BILLING_READ),   BillingController.getOrderBilling);
router.post('/invoices/:invoiceId/pay',     authenticateJWT, authorizePermission(Permission.BILLING_PAY),    BillingController.recordPayment);
router.post('/proration/calculate',         authenticateJWT, authorizePermission(Permission.BILLING_MANAGE), BillingController.calculateProration);

export default router;
