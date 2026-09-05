import { Router } from 'express';
import { QuotationController } from './quotation.controller.js';
import { authenticateJWT } from '../../api/middleware/auth.middleware.js';
import { authorizePermission } from '../../core/auth/rbac.middleware.js';
import { Permission } from '../../core/auth/permissions.js';

const router = Router();

// ── Catalog meta (read-only, available to any authenticated user) ───────────
router.get('/meta/customers', authenticateJWT, authorizePermission(Permission.QUOTE_READ), QuotationController.listCustomers);
router.get('/meta/products',  authenticateJWT, authorizePermission(Permission.QUOTE_READ), QuotationController.listProducts);

// ── Quotation CRUD ────────────────────────────────────────────────────────────
router.get('/',                       authenticateJWT, authorizePermission(Permission.QUOTE_READ),   QuotationController.listQuotations);
router.post('/',                      authenticateJWT, authorizePermission(Permission.QUOTE_CREATE), QuotationController.createQuotation);
router.get('/:id',                    authenticateJWT, authorizePermission(Permission.QUOTE_READ),   QuotationController.getQuotationById);
router.post('/:id/items',             authenticateJWT, authorizePermission(Permission.QUOTE_UPDATE), QuotationController.addItem);
router.put('/:id/items/:itemId',      authenticateJWT, authorizePermission(Permission.QUOTE_UPDATE), QuotationController.updateItem);
router.delete('/:id/items/:itemId',   authenticateJWT, authorizePermission(Permission.QUOTE_UPDATE), QuotationController.removeItem);

// ── Workflow actions ──────────────────────────────────────────────────────────
router.post('/:id/submit',           authenticateJWT, authorizePermission(Permission.QUOTE_SUBMIT), QuotationController.submitQuotation);
router.get('/:id/recommendations',   authenticateJWT, authorizePermission(Permission.QUOTE_READ),   QuotationController.getRecommendations);

export default router;
