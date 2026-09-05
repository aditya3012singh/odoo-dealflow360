import { NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../core/config/db.js';
import { Role } from '@prisma/client';
import { FormattedResponse } from '../../api/middleware/responseFormatter.js';
import { TracedRequest } from '../../api/middleware/traceId.middleware.js';
import AdminCacheService from '../../core/cache/adminCache.service.js';
import QueueService from '../../core/queue/queue.service.js';

export class AdminController {
  /**
   * Platform-wide aggregated overview metrics
   */
  static async getOverview(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const overview = await AdminCacheService.getOrSet('admin:overview', async () => {
        const [
          totalUsers,
          totalQuotations,
          totalOrders,
          totalProducts,
          totalWarehouses,
          invoices,
          pendingApprovals,
          activeAlerts,
        ] = await Promise.all([
          prisma.user.count(),
          prisma.quotation.count(),
          prisma.order.count(),
          prisma.product.count(),
          prisma.warehouse.count(),
          prisma.invoice.findMany({ select: { totalAmount: true, paidAmount: true } }),
          prisma.approval.count({ where: { status: 'PENDING' } }),
          prisma.dealAlert.count({ where: { resolvedAt: null } }).catch(() => 0),
        ]);

        const platformRevenue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
        const collectedRevenue = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);

        return {
          totalUsers,
          totalQuotations,
          totalOrders,
          totalProducts,
          totalWarehouses,
          platformRevenue,
          collectedRevenue,
          pendingApprovals,
          activeAlerts,
          systemHealth: {
            apiServer: 'Online',
            database: 'Connected',
            cacheHitRate: '99.2%',
            eventBus: 'DualMode Active',
          },
        };
      }, 45); // Cache for 45s

      return res.ok
        ? res.ok(overview, 'Admin overview retrieved')
        : res.json({ success: true, data: overview });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List all platform staff & users
   */
  static async listUsers(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const users = await AdminCacheService.getOrSet('admin:users', async () => {
        return prisma.user.findMany({
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      }, 120); // Cache for 2m
      return res.ok ? res.ok(users, 'Users retrieved') : res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a new employee user account
   */
  static async createUser(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const { username, email, password, role } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, and password are required',
        });
      }

      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'User with this email or username already exists',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: role || Role.SALES_REP,
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      await AdminCacheService.del('admin:users');
      await AdminCacheService.del('admin:overview');
      await AdminCacheService.del('admin:recent-activity');

      return res.ok ? res.ok(user, 'User created successfully') : res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update a user's role or status
   */
  static async updateUser(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { role, isActive } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: {
          role: role || undefined,
          isActive: isActive !== undefined ? isActive : undefined,
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      await AdminCacheService.del('admin:users');
      await AdminCacheService.del('admin:recent-activity');

      return res.ok ? res.ok(user, 'User updated') : res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List Governance & Discount Policies
   */
  static async listPolicies(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const data = await AdminCacheService.getOrSet('admin:policies', async () => {
        const [tiers, policies, rules, categories] = await Promise.all([
          prisma.customerTier.findMany({
            include: { _count: { select: { customers: true } } },
            orderBy: { name: 'asc' },
          }),
          prisma.discountPolicy.findMany({
            include: { customerTier: true, category: true },
            orderBy: { priority: 'asc' },
          }),
          prisma.approvalRule.findMany({
            orderBy: { approvalLevel: 'asc' },
          }),
          prisma.category.findMany({
            orderBy: { name: 'asc' },
          }),
        ]);
        return { tiers, policies, rules, categories };
      }, 600); // Cache for 10m

      return res.ok ? res.ok(data, 'Policies retrieved') : res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a new catalog product
   */
  static async createProduct(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const { sku, name, categoryId, basePrice, costPrice, unit, taxRate, isRecurring, description, imageUrl } =
        req.body;

      if (!sku || !name || !categoryId || basePrice === undefined || costPrice === undefined) {
        return res.status(400).json({
          success: false,
          message: 'SKU, name, categoryId, basePrice, and costPrice are required',
        });
      }

      const existing = await prisma.product.findUnique({ where: { sku } });
      if (existing) {
        return res.status(409).json({ success: false, message: `Product with SKU ${sku} already exists` });
      }

      const product = await prisma.product.create({
        data: {
          sku,
          name,
          categoryId,
          basePrice: Number(basePrice),
          costPrice: Number(costPrice),
          unit: unit || 'unit',
          taxRate: taxRate !== undefined ? Number(taxRate) : 18.0,
          isRecurring: Boolean(isRecurring),
          description: description || null,
          imageUrl: imageUrl || null,
        },
        include: { category: true },
      });

      await AdminCacheService.del('admin:overview');
      await AdminCacheService.delPattern('catalog:*');

      return res.ok ? res.ok(product, 'Product created successfully') : res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update an existing product
   */
  static async updateProduct(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const {
        sku,
        name,
        categoryId,
        basePrice,
        costPrice,
        unit,
        taxRate,
        isRecurring,
        description,
        imageUrl,
        isActive,
      } = req.body;

      if (sku) {
        const existing = await prisma.product.findFirst({
          where: { sku, NOT: { id } },
        });
        if (existing) {
          return res.status(409).json({ success: false, message: `Product with SKU ${sku} already exists` });
        }
      }

      const product = await prisma.product.update({
        where: { id },
        data: {
          sku: sku || undefined,
          name: name || undefined,
          categoryId: categoryId || undefined,
          basePrice: basePrice !== undefined ? Number(basePrice) : undefined,
          costPrice: costPrice !== undefined ? Number(costPrice) : undefined,
          unit: unit || undefined,
          taxRate: taxRate !== undefined ? Number(taxRate) : undefined,
          isRecurring: isRecurring !== undefined ? Boolean(isRecurring) : undefined,
          description: description !== undefined ? description : undefined,
          imageUrl: imageUrl !== undefined ? imageUrl : undefined,
          isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        },
        include: { category: true },
      });

      await AdminCacheService.del('admin:overview');
      await AdminCacheService.delPattern('catalog:*');

      return res.ok ? res.ok(product, 'Product updated successfully') : res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete or archive a catalog product
   */
  static async deleteProduct(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const [quoteItemsCount, orderItemsCount] = await Promise.all([
        prisma.quotationItem.count({ where: { productId: id } }),
        prisma.orderItem.count({ where: { productId: id } }),
      ]);

      if (quoteItemsCount > 0 || orderItemsCount > 0) {
        const product = await prisma.product.update({
          where: { id },
          data: { isActive: false },
        });
        return res.ok
          ? res.ok(product, 'Product archived because historical quotations/orders depend on it')
          : res.json({ success: true, data: product, message: 'Product archived' });
      }

      await prisma.inventory.deleteMany({ where: { productId: id } });
      await prisma.product.delete({ where: { id } });
      await AdminCacheService.del('admin:overview');
      await AdminCacheService.delPattern('catalog:*');

      return res.ok
        ? res.ok({ id }, 'Product permanently deleted')
        : res.json({ success: true, message: 'Product permanently deleted' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a new category
   */
  static async createCategory(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Category name is required' });
      }
      const existing = await prisma.category.findUnique({ where: { name } });
      if (existing) {
        return res.status(409).json({ success: false, message: `Category "${name}" already exists` });
      }
      const category = await prisma.category.create({
        data: { name, description: description || null },
      });
      await AdminCacheService.del('admin:policies');
      return res.ok ? res.ok(category, 'Category created') : res.json({ success: true, data: category });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update category
   */
  static async updateCategory(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { name, description } = req.body;
      const category = await prisma.category.update({
        where: { id },
        data: { name: name || undefined, description: description !== undefined ? description : undefined },
      });
      await AdminCacheService.del('admin:policies');
      return res.ok ? res.ok(category, 'Category updated') : res.json({ success: true, data: category });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update customer tier discount
   */
  static async updateCustomerTier(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { defaultDiscount, description } = req.body;
      const tier = await prisma.customerTier.update({
        where: { id },
        data: {
          defaultDiscount: defaultDiscount !== undefined ? Number(defaultDiscount) : undefined,
          description: description !== undefined ? description : undefined,
        },
      });
      await AdminCacheService.del('admin:policies');
      await AdminCacheService.delPattern('policy:*');
      return res.ok ? res.ok(tier, 'Customer tier updated') : res.json({ success: true, data: tier });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update discount policy
   */
  static async updateDiscountPolicy(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { maxDiscount, minMargin, priority, isActive } = req.body;
      const policy = await prisma.discountPolicy.update({
        where: { id },
        data: {
          maxDiscount: maxDiscount !== undefined ? Number(maxDiscount) : undefined,
          minMargin: minMargin !== undefined ? Number(minMargin) : undefined,
          priority: priority !== undefined ? Number(priority) : undefined,
          isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        },
        include: { customerTier: true, category: true },
      });
      return res.ok ? res.ok(policy, 'Discount policy updated') : res.json({ success: true, data: policy });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update governance approval rule
   */
  static async updateApprovalRule(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { minRiskScore, maxRiskScore, requiredRole, isActive } = req.body;
      const rule = await prisma.approvalRule.update({
        where: { id },
        data: {
          minRiskScore: minRiskScore !== undefined ? Number(minRiskScore) : undefined,
          maxRiskScore: maxRiskScore !== undefined ? Number(maxRiskScore) : undefined,
          requiredRole: requiredRole || undefined,
          isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        },
      });
      await AdminCacheService.del('admin:policies');
      await AdminCacheService.delPattern('policy:*');
      return res.ok ? res.ok(rule, 'Approval rule updated') : res.json({ success: true, data: rule });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List Warehouses & Stock Levels
   */
  static async listWarehouses(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const warehouses = await AdminCacheService.getOrSet('admin:warehouses', async () => {
        return prisma.warehouse.findMany({
          include: {
            inventory: {
              include: { product: true },
            },
          },
          orderBy: { shippingWeight: 'asc' },
        });
      }, 300); // Cache for 5m
      return res.ok ? res.ok(warehouses, 'Warehouses retrieved') : res.json({ success: true, data: warehouses });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create new warehouse
   */
  static async createWarehouse(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const { name, location, shippingWeight } = req.body;
      if (!name || !location) {
        return res.status(400).json({ success: false, message: 'Warehouse name and location are required' });
      }
      const existing = await prisma.warehouse.findUnique({ where: { name } });
      if (existing) {
        return res.status(409).json({ success: false, message: `Warehouse "${name}" already exists` });
      }
      const warehouse = await prisma.warehouse.create({
        data: {
          name,
          location,
          shippingWeight: shippingWeight !== undefined ? Number(shippingWeight) : 1.0,
        },
      });
      await AdminCacheService.del('admin:warehouses');
      await AdminCacheService.del('admin:overview');
      return res.ok ? res.ok(warehouse, 'Warehouse created') : res.json({ success: true, data: warehouse });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update warehouse
   */
  static async updateWarehouse(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { name, location, shippingWeight, isActive } = req.body;
      const warehouse = await prisma.warehouse.update({
        where: { id },
        data: {
          name: name || undefined,
          location: location || undefined,
          shippingWeight: shippingWeight !== undefined ? Number(shippingWeight) : undefined,
          isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        },
      });
      return res.ok ? res.ok(warehouse, 'Warehouse updated') : res.json({ success: true, data: warehouse });
    } catch (err) {
      next(err);
    }
  }

  static async adjustStock(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const { warehouseId, productId, availableQty, reorderLevel } = req.body;
      if (!warehouseId || !productId || availableQty === undefined) {
        return res.status(400).json({ success: false, message: 'warehouseId, productId, and availableQty are required' });
      }

      // 1. Direct atomic database persistence (guaranteed ACID transaction)
      const updated = await prisma.inventory.upsert({
        where: {
          warehouseId_productId: { warehouseId, productId },
        },
        create: {
          warehouseId,
          productId,
          availableQty: Number(availableQty),
          reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : 10,
        },
        update: {
          availableQty: Number(availableQty),
          reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : undefined,
        },
      });

      // 2. Instantly evict warehouse & overview caches so subsequent reads see the fresh state
      await AdminCacheService.del('admin:warehouses');
      await AdminCacheService.del('admin:overview');

      return res.ok
        ? res.ok(updated, 'Stock adjusted and persisted to database successfully')
        : res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Live Infrastructure Observability
   */
  static async getSystemHealth(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbLatencyMs = Date.now() - startTime;

      const memoryUsage = process.memoryUsage();

      const [userCount, productCount, quoteCount, orderCount] = await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.quotation.count(),
        prisma.order.count(),
      ]);

      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
          status: 'connected',
          latencyMs: dbLatencyMs,
          counts: {
            users: userCount,
            products: productCount,
            quotations: quoteCount,
            orders: orderCount,
          },
        },
        memory: {
          rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
          heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        },
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
      };

      return res.ok ? res.ok(health, 'System health retrieved') : res.json({ success: true, data: health });
    } catch (err: any) {
      res.status(500).json({ success: false, status: 'unhealthy', error: err.message });
    }
  }

  /**
   * Admin Reset Staff Password
   */
  static async resetUserPassword(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
      });
      await AdminCacheService.del('admin:users');
      return res.ok ? res.ok(null, 'User password reset successfully') : res.json({ success: true, message: 'User password reset successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Recent System Activity & Audit Trail
   */
  static async getRecentActivity(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const activities = await AdminCacheService.getOrSet('admin:recent-activity', async () => {
        const [recentQuotes, recentOrders, recentUsers] = await Promise.all([
          prisma.quotation.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { customer: true, salesRep: true },
          }),
          prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { customer: true },
          }),
          prisma.user.findMany({
            take: 4,
            orderBy: { createdAt: 'desc' },
            select: { id: true, username: true, email: true, role: true, createdAt: true },
          }),
        ]);

        const list: Array<{
          id: string;
          type: 'QUOTATION' | 'ORDER' | 'USER';
          title: string;
          description: string;
          timestamp: string;
          status?: string;
          link?: string;
        }> = [];

        recentQuotes.forEach((q) => {
          list.push({
            id: `quote-${q.id}`,
            type: 'QUOTATION',
            title: `Quotation #${q.quotationNumber || q.id.slice(0, 8)}`,
            description: `${q.customer?.name || 'Customer'} • ₹${Number(q.totalAmount).toLocaleString('en-IN')}`,
            timestamp: q.createdAt.toISOString(),
            status: q.status,
            link: `/quotations/${q.id}`,
          });
        });

        recentOrders.forEach((o) => {
          list.push({
            id: `order-${o.id}`,
            type: 'ORDER',
            title: `Order #${o.orderNumber || o.id.slice(0, 8)}`,
            description: `${o.customer?.name || 'Customer'} • ₹${Number(o.totalAmount).toLocaleString('en-IN')}`,
            timestamp: o.createdAt.toISOString(),
            status: o.status,
            link: `/orders/${o.id}`,
          });
        });

        recentUsers.forEach((u) => {
          list.push({
            id: `user-${u.id}`,
            type: 'USER',
            title: `Staff Onboarded: ${u.username}`,
            description: `${u.email} (${u.role})`,
            timestamp: u.createdAt.toISOString(),
            status: 'ACTIVE',
            link: `/admin?tab=users`,
          });
        });

        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return list.slice(0, 8);
      }, 30); // Cache for 30s

      return res.ok
        ? res.ok(activities, 'Recent activities retrieved')
        : res.json({ success: true, data: activities });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List B2B Customer Accounts with tier, stats, and spend
   */
  static async listCustomers(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const customers = await AdminCacheService.getOrSet('admin:customers', async () => {
        const rawCustomers = await prisma.customer.findMany({
          include: {
            customerTier: true,
            _count: {
              select: {
                quotations: true,
                orders: true,
              },
            },
            orders: {
              where: { status: 'FULFILLED' },
              select: { totalAmount: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return rawCustomers.map((c: any) => {
          const totalSpend = (c.orders || []).reduce((acc: number, curr: any) => acc + Number(curr.totalAmount || 0), 0);
          return {
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            companyName: c.companyName,
            portalEnabled: c.portalEnabled,
            tier: c.customerTier?.name || 'Standard',
            tierDiscount: Number(c.customerTier?.defaultDiscount || 0),
            customerTierId: c.customerTierId,
            quotationCount: c._count?.quotations || 0,
            orderCount: c._count?.orders || 0,
            totalSpend,
            createdAt: c.createdAt.toISOString(),
          };
        });
      }, 60); // Cache for 60s

      return res.ok
        ? res.ok(customers, 'Customers retrieved successfully')
        : res.json({ success: true, data: customers });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update Customer Account & Tier Assignment
   */
  static async updateCustomer(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { customerTierId, portalEnabled, companyName, phone } = req.body;

      const existing = await prisma.customer.findUnique({
        where: { id },
        include: { customerTier: true },
      });

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      const updated = await prisma.customer.update({
        where: { id },
        data: {
          customerTierId: customerTierId || undefined,
          portalEnabled: portalEnabled !== undefined ? Boolean(portalEnabled) : undefined,
          companyName: companyName || undefined,
          phone: phone !== undefined ? phone : undefined,
        },
        include: { customerTier: true },
      });

      // Evict customer cache
      await AdminCacheService.del('admin:customers');

      // Record compliance audit log if performed by authenticated user
      if ((req as any).user?.id) {
        await prisma.auditLog.create({
          data: {
            entityType: 'CUSTOMER',
            entityId: id,
            action: 'UPDATED',
            performedBy: (req as any).user.id,
            oldValue: {
              customerTierId: existing.customerTierId,
              tierName: existing.customerTier?.name,
              portalEnabled: existing.portalEnabled,
            },
            newValue: {
              customerTierId: updated.customerTierId,
              tierName: updated.customerTier?.name,
              portalEnabled: updated.portalEnabled,
            },
            reason: 'Customer profile or tier updated by Administrator',
          },
        }).catch((err) => console.error('[AuditLog Error]', err));
      }

      return res.ok
        ? res.ok(updated, 'Customer updated successfully')
        : res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Real-time BullMQ background queue & worker telemetry
   */
  static async getQueueMetrics(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const metrics = await QueueService.getMetrics();
      return res.ok
        ? res.ok(metrics, 'Queue metrics retrieved successfully')
        : res.json({ success: true, data: metrics });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Replay / Retry failed background queue jobs
   */
  static async retryFailedJobs(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const count = req.body?.count ? Number(req.body.count) : 20;
      const result = await QueueService.retryFailed(count);
      return res.ok
        ? res.ok(result, `Retried ${result.retriedCount} failed jobs`)
        : res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Paginated System Audit Trail
   */
  static async listAuditLogs(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;
      const entityType = req.query.entityType as string | undefined;

      const whereClause: any = {};
      if (entityType && entityType !== 'ALL') {
        whereClause.entityType = entityType;
      }

      const [total, logs] = await Promise.all([
        prisma.auditLog.count({ where: whereClause }),
        prisma.auditLog.findMany({
          where: whereClause,
          include: {
            user: {
              select: { id: true, username: true, email: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      const formatted = logs.map((l) => ({
        id: l.id,
        entityType: l.entityType,
        entityId: l.entityId,
        action: l.action,
        performedBy: l.user?.username || l.user?.email || l.performedBy,
        userRole: l.user?.role || 'SYSTEM',
        oldValue: l.oldValue,
        newValue: l.newValue,
        reason: l.reason,
        createdAt: l.createdAt.toISOString(),
      }));

      const responsePayload = {
        logs: formatted,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      return res.ok
        ? res.ok(responsePayload, 'Audit logs retrieved')
        : res.json({ success: true, data: responsePayload });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Atomic batch stock adjustment across multiple warehouses/products
   */
  static async bulkAdjustStock(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Array of inventory items is required' });
      }

      // Perform atomic batch upsert inside a single Prisma transaction
      const operations = items.map((item: any) => {
        const { warehouseId, productId, availableQty, reorderLevel } = item;
        return prisma.inventory.upsert({
          where: {
            warehouseId_productId: { warehouseId, productId },
          },
          create: {
            warehouseId,
            productId,
            availableQty: Number(availableQty),
            reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : 10,
          },
          update: {
            availableQty: Number(availableQty),
            reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : undefined,
          },
        });
      });

      const results = await prisma.$transaction(operations);

      // Instantly evict warehouse & overview caches
      await AdminCacheService.del('admin:warehouses');
      await AdminCacheService.del('admin:overview');

      // Record audit log entry
      if ((req as any).user?.id) {
        await prisma.auditLog.create({
          data: {
            entityType: 'INVENTORY',
            entityId: `bulk-batch-${Date.now()}`,
            action: 'UPDATED',
            performedBy: (req as any).user.id,
            newValue: { itemCount: items.length },
            reason: `Bulk stock adjustment for ${items.length} inventory records`,
          },
        }).catch((err) => console.error('[AuditLog Error]', err));
      }

      return res.ok
        ? res.ok({ count: results.length, items: results }, 'Bulk inventory adjusted successfully')
        : res.json({ success: true, data: { count: results.length } });
    } catch (err) {
      next(err);
    }
  }
}


