import { Router } from 'express';
import { NegotiationController } from './negotiation.controller.js';
import { CommentController } from '../quotations/comment.controller.js';
import { authenticatePortal } from '../../core/auth/portal.middleware.js';

const router = Router();

// All portal routes require customer portal token authentication.
// The authenticatePortal middleware:
//   1. Validates the token against the hashed portalToken in the Customer record
//   2. Verifies quotation ownership (quote.customerId === customer.id)
//   3. Populates req.portalUser with the resolved customer identity

router.get('/dashboard',                     authenticatePortal, NegotiationController.getPortalDashboard);
router.get('/quotations',                     authenticatePortal, NegotiationController.listPortalQuotations);
router.get('/products',                       authenticatePortal, NegotiationController.listPortalProducts);
router.post('/quotations/request',            authenticatePortal, NegotiationController.requestPortalQuotation);
router.get('/quotations/:id',                authenticatePortal, NegotiationController.getRestrictedQuote);
router.post('/quotations/:id/counter-offer', authenticatePortal, NegotiationController.submitCounterOffer);
router.post('/quotations/:id/confirm',       authenticatePortal, NegotiationController.confirmAndConvert);
router.post('/quotations/:id/decline',       authenticatePortal, NegotiationController.declineQuotation);
router.get('/orders',                         authenticatePortal, NegotiationController.listPortalOrders);
router.get('/billing',                        authenticatePortal, NegotiationController.listPortalBilling);
router.get('/profile',                        authenticatePortal, NegotiationController.getPortalProfile);
router.put('/profile',                        authenticatePortal, NegotiationController.updatePortalProfile);

// Customer can add comments to quotations (quote-level or line-level)
router.post('/quotations/:id/comments',      authenticatePortal, CommentController.addComment);
router.get('/quotations/:id/comments',       authenticatePortal, CommentController.getComments);

// Customer self-service login using email
router.post('/login', NegotiationController.portalLogin);
router.post('/register', NegotiationController.portalRegister);

// Portal token issuance (internal — requires employee JWT + ADMIN/SALES_MANAGER/OPERATIONS)
router.post('/customers/:customerId/issue-token', NegotiationController.issuePortalToken);
router.delete('/customers/:customerId/revoke-token', NegotiationController.revokePortalToken);

export default router;
