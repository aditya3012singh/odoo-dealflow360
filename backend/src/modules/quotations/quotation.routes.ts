import { Router } from 'express';
import { QuotationController } from './quotation.controller.js';
import { optionalAuth } from '../../api/middleware/auth.middleware.js';

const router = Router();

// Catalog lookup routes
router.get('/meta/customers', QuotationController.listCustomers);
router.get('/meta/products', QuotationController.listProducts);

// Quotation CRUD routes
router.get('/', optionalAuth, QuotationController.listQuotations);
router.post('/', optionalAuth, QuotationController.createQuotation);
router.get('/:id', optionalAuth, QuotationController.getQuotationById);
router.post('/:id/items', optionalAuth, QuotationController.addItem);
router.put('/:id/items/:itemId', optionalAuth, QuotationController.updateItem);
router.delete('/:id/items/:itemId', optionalAuth, QuotationController.removeItem);

// Workflow actions
router.post('/:id/submit', optionalAuth, QuotationController.submitQuotation);
router.get('/:id/recommendations', optionalAuth, QuotationController.getRecommendations);

export default router;
