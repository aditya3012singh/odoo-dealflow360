import { Router } from 'express';
import { NegotiationController } from './negotiation.controller.js';

const router = Router();

// Customer Portal routes (open to customer link with token/ID)
router.get('/quotations/:id', NegotiationController.getRestrictedQuote);
router.post('/quotations/:id/counter-offer', NegotiationController.submitCounterOffer);
router.post('/quotations/:id/confirm', NegotiationController.confirmAndConvert);

export default router;
