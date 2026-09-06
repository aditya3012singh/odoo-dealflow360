import { Router } from 'express';
import { BillingController } from './billing.controller.js';
import { authenticateJWT } from '../../api/middleware/auth.middleware.js';
import { authorizePermission } from '../../core/auth/rbac.middleware.js';
import { Permission } from '../../core/auth/permissions.js';

const router = Router();

router.get('/invoices',                     authenticateJWT, authorizePermission(Permission.BILLING_READ),   BillingController.listInvoices);
router.get('/subscriptions',                authenticateJWT, authorizePermission(Permission.BILLING_READ),   BillingController.listSubscriptions);
router.patch('/subscriptions/:id/status',   authenticateJWT, authorizePermission(Permission.BILLING_MANAGE), BillingController.updateSubscriptionStatus);
router.post('/subscriptions/:id/cancel',    authenticateJWT, authorizePermission(Permission.BILLING_MANAGE), BillingController.cancelSubscription);
router.get('/orders/:orderId',              authenticateJWT, authorizePermission(Permission.BILLING_READ),   BillingController.getOrderBilling);
router.post('/invoices/:invoiceId/pay',     authenticateJWT, authorizePermission(Permission.BILLING_PAY),    BillingController.recordPayment);
router.post('/proration/calculate',         authenticateJWT, authorizePermission(Permission.BILLING_MANAGE), BillingController.calculateProration);

export default router;
