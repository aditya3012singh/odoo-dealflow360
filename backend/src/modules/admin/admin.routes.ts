import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authenticateJWT } from '../../api/middleware/auth.middleware.js';
import { requireRole } from '../../core/auth/rbac.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Guard all admin routes with JWT authentication and Role.ADMIN check
router.use(authenticateJWT, requireRole(Role.ADMIN));

router.get('/overview', AdminController.getOverview);
router.get('/system-health', AdminController.getSystemHealth);
router.get('/recent-activity', AdminController.getRecentActivity);
router.get('/users', AdminController.listUsers);
router.post('/users', AdminController.createUser);
router.patch('/users/:id', AdminController.updateUser);
router.post('/users/:id/reset-password', AdminController.resetUserPassword);

// Products & Categories CRUD
router.post('/products', AdminController.createProduct);
router.patch('/products/:id', AdminController.updateProduct);
router.delete('/products/:id', AdminController.deleteProduct);
router.post('/categories', AdminController.createCategory);
router.patch('/categories/:id', AdminController.updateCategory);

// Governance & Policies
router.get('/policies', AdminController.listPolicies);
router.patch('/tiers/:id', AdminController.updateCustomerTier);
router.patch('/policies/:id', AdminController.updateDiscountPolicy);
router.patch('/approval-rules/:id', AdminController.updateApprovalRule);

// Warehouses & Multi-Facility Logistics
router.get('/warehouses', AdminController.listWarehouses);
router.post('/warehouses', AdminController.createWarehouse);
router.patch('/warehouses/:id', AdminController.updateWarehouse);
router.patch('/inventory', AdminController.adjustStock);
router.post('/inventory/bulk', AdminController.bulkAdjustStock);

// B2B Customer Accounts & Tier Assignment
router.get('/customers', AdminController.listCustomers);
router.patch('/customers/:id', AdminController.updateCustomer);

// Queue & Worker Observability
router.get('/queue/metrics', AdminController.getQueueMetrics);
router.post('/queue/retry-failed', AdminController.retryFailedJobs);

// System Audit Logs
router.get('/audit-logs', AdminController.listAuditLogs);

export default router;
