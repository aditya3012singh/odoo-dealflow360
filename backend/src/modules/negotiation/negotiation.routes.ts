import { Router } from 'express';
import { NegotiationController } from './negotiation.controller.js';
import { authenticatePortal } from '../../core/auth/portal.middleware.js';

const router = Router();

// All portal routes require customer portal token authentication.
// The authenticatePortal middleware:
//   1. Validates the token against the hashed portalToken in the Customer record
//   2. Verifies quotation ownership (quote.customerId === customer.id)
//   3. Populates req.portalUser with the resolved customer identity

router.get('/quotations/:id',                authenticatePortal, NegotiationController.getRestrictedQuote);
router.post('/quotations/:id/counter-offer', authenticatePortal, NegotiationController.submitCounterOffer);
router.post('/quotations/:id/confirm',       authenticatePortal, NegotiationController.confirmAndConvert);

// Portal token issuance (internal — requires employee JWT + ADMIN/SALES_MANAGER/OPERATIONS)
router.post('/customers/:customerId/issue-token', NegotiationController.issuePortalToken);
router.delete('/customers/:customerId/revoke-token', NegotiationController.revokePortalToken);

export default router;
