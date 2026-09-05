import { Response, NextFunction } from 'express';
import { NegotiationService } from './negotiation.service.js';
import { FormattedResponse } from '../../api/middleware/responseFormatter.js';
import { TracedRequest } from '../../api/middleware/traceId.middleware.js';
import { issuePortalToken, revokePortalToken } from '../../core/auth/portal.middleware.js';
import { authenticateJWT } from '../../api/middleware/auth.middleware.js';
import { requireRole } from '../../core/auth/rbac.middleware.js';
import { Role } from '@prisma/client';

export class NegotiationController {
  /**
   * Customer portal: get masked quote view
   * req.portalUser is populated by authenticatePortal middleware
   */
  static async getRestrictedQuote(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const quote = await NegotiationService.getRestrictedQuote(id);
      return res.ok ? res.ok(quote, 'Customer quote view') : res.json({ success: true, data: quote });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Customer portal: submit a counter-offer
   * customerId is sourced from req.portalUser (portal token), NOT from req.body
   */
  static async submitCounterOffer(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { requestedDiscount, message } = req.body;

      if (requestedDiscount === undefined || isNaN(Number(requestedDiscount))) {
        return res.status(400).json({ success: false, message: 'requestedDiscount is required' });
      }

      // Identity is always from the authenticated portal token — never from req.body
      const customerId = req.portalUser!.customerId;

      console.log('[DEBUG submitCounterOffer] req.portalUser:', JSON.stringify(req.portalUser));
      console.log('[DEBUG submitCounterOffer] customerId:', customerId, 'type:', typeof customerId);

      const result = await NegotiationService.submitCounterOffer(
        id,
        customerId,
        Number(requestedDiscount),
        message
      );

      return res.ok
        ? res.ok(result, 'Counter-offer processed')
        : res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Customer portal: confirm and convert quotation to order
   * customerId is sourced from req.portalUser (portal token), NOT from req.body
   */
  static async confirmAndConvert(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;

      // Identity is always from the authenticated portal token
      const customerId = req.portalUser!.customerId;

      const result = await NegotiationService.confirmAndConvert(id, customerId);
      return res.ok
        ? res.ok(result, 'Quotation converted to Order. Fulfillment & Billing initiated.')
        : res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Customer portal: decline a quotation proposal
   */
  static async declineQuotation(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;
      const customerId = req.portalUser!.customerId;

      const result = await NegotiationService.declineQuotation(id, customerId, reason);
      return res.ok
        ? res.ok(result, 'Quotation proposal declined.')
        : res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Customer portal: get customer dashboard data
   */
  static async getPortalDashboard(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const customerId = req.portalUser!.customerId;
      const { prisma } = await import('../../core/config/db.js');

      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { customerTier: true },
      });

      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer account not found' });
      }

      // Fetch customer quotations with items and salesRep
      const quotes = await prisma.quotation.findMany({
        where: { customerId },
        include: {
          items: {
            include: {
              product: { select: { name: true, sku: true } },
            },
          },
          salesRep: { select: { username: true, email: true } },
          negotiations: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
      });

      // KPI counts
      const activeQuotes = quotes.filter((q) =>
        ['DRAFT', 'PENDING_MANAGER', 'PENDING_FINANCE', 'APPROVED', 'UNDER_NEGOTIATION'].includes(q.status)
      ).length;

      const awaitingConfirmation = quotes.filter((q) => q.status === 'APPROVED').length;

      const ordersCount = await prisma.order.count({
        where: { customerId },
      });

      const unreadCommentsCount = await prisma.quotationComment.count({
        where: {
          quotation: { customerId },
          authorType: 'REP',
        },
      });

      // Build recent activity feed
      const recentActivity: Array<{ icon: string; text: string; time: string; quotationId?: string }> = [];

      for (const q of quotes.slice(0, 5)) {
        if (q.status === 'APPROVED') {
          recentActivity.push({
            icon: '✅',
            text: `Quotation ${q.quotationNumber} is approved and ready to confirm!`,
            time: new Date(q.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            quotationId: q.id,
          });
        } else if (q.status === 'UNDER_NEGOTIATION') {
          recentActivity.push({
            icon: '📝',
            text: `Counter-offer for ${q.quotationNumber} is currently under review.`,
            time: new Date(q.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            quotationId: q.id,
          });
        } else if (q.status === 'CONVERTED_TO_ORDER') {
          recentActivity.push({
            icon: '📦',
            text: `Quotation ${q.quotationNumber} converted to Order. Fulfillment initiated.`,
            time: new Date(q.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            quotationId: q.id,
          });
        } else {
          recentActivity.push({
            icon: '📄',
            text: `Quotation ${q.quotationNumber} generated by sales executive.`,
            time: new Date(q.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            quotationId: q.id,
          });
        }
      }

      const formattedQuotes = quotes.map((q) => ({
        id: q.id,
        quotationNumber: q.quotationNumber,
        currency: q.currency,
        totalAmount: Number(q.totalAmount),
        subtotal: Number(q.subtotal),
        discountAmount: Number(q.discountAmount),
        taxAmount: Number(q.taxAmount),
        status: q.status,
        customerStatus: q.customerStatus,
        salesRep: q.salesRep?.username || 'Account Executive',
        itemCount: q.items.length,
        items: q.items.map((it) => ({
          id: it.id,
          product: it.product.name,
          sku: it.product.sku,
          quantity: it.quantity,
          unitPrice: Number(it.unitPrice),
          discountPercentage: Number(it.discountPercentage),
          lineTotal: Number(it.lineTotal),
        })),
        validUntil: q.expiresAt ? new Date(q.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
        updatedAt: new Date(q.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      }));

      const payload = {
        customer: {
          id: customer.id,
          name: customer.name,
          companyName: customer.companyName,
          email: customer.email,
          tier: customer.customerTier?.name || 'Standard',
        },
        kpis: {
          activeQuotations: activeQuotes,
          awaitingConfirmation,
          ordersPlaced: ordersCount,
          unreadMessages: unreadCommentsCount > 0 ? unreadCommentsCount : (quotes.length > 0 ? 1 : 0),
        },
        quotations: formattedQuotes,
        recentActivity,
      };

      return res.ok ? res.ok(payload, 'Portal dashboard data retrieved') : res.json({ success: true, data: payload });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Customer portal: list all customer quotations
   */
  static async listPortalQuotations(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const customerId = req.portalUser!.customerId;
      const { prisma } = await import('../../core/config/db.js');

      const quotes = await prisma.quotation.findMany({
        where: { customerId },
        include: {
          items: {
            include: {
              product: { select: { name: true, sku: true } },
            },
          },
          salesRep: { select: { username: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return res.ok ? res.ok(quotes, 'Customer quotations list') : res.json({ success: true, data: quotes });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Customer portal: get product catalog for enterprise storefront
   */
  static async listPortalProducts(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const { prisma } = await import('../../core/config/db.js');
      const products = await prisma.product.findMany({
        where: { isActive: true },
        include: { category: true, variants: true },
        orderBy: { name: 'asc' },
      });
      return res.ok ? res.ok(products, 'Storefront catalog products') : res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Customer portal: self-service bulk quote creation from enterprise storefront
   */
  static async requestPortalQuotation(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const customerId = req.portalUser!.customerId;
      const { items, requestedDiscount, notes } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Please select at least one item.' });
      }

      const { prisma } = await import('../../core/config/db.js');
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { customerTier: true },
      });

      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer account not found' });
      }

      // Find an active sales rep or fallback to any rep/admin
      const salesRep =
        (await prisma.user.findFirst({ where: { role: 'SALES_REP' } })) ||
        (await prisma.user.findFirst());

      if (!salesRep) {
        return res.status(500).json({ success: false, message: 'No sales representative available.' });
      }

      const count = await prisma.quotation.count();
      const quotationNumber = `Q-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      // Default discount is customer's tier discount or custom requested discount
      const tierDiscount = Number(customer.customerTier?.defaultDiscount || 0);
      const discountToApply =
        requestedDiscount !== undefined && !isNaN(Number(requestedDiscount))
          ? Number(requestedDiscount)
          : tierDiscount;

      // Fetch products
      const productIds = items.map((it: any) => it.productId);
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      const prodMap = new Map(dbProducts.map((p) => [p.id, p]));

      // Create quotation and items in transaction
      const quote = await prisma.$transaction(async (tx) => {
        const newQuote = await tx.quotation.create({
          data: {
            quotationNumber,
            customerId: customer.id,
            salesRepId: salesRep.id,
            status: 'DRAFT',
            currency: 'INR',
          },
        });

        for (const it of items) {
          const prod = prodMap.get(it.productId);
          if (!prod) continue;
          const qty = Math.max(1, Number(it.quantity) || 1);
          const unitPrice = Number(prod.basePrice);
          const lineSubtotal = unitPrice * qty;
          const lineDiscountAmt = (lineSubtotal * discountToApply) / 100;
          const lineTaxAmt = ((lineSubtotal - lineDiscountAmt) * Number(prod.taxRate)) / 100;
          const lineTotal = lineSubtotal - lineDiscountAmt + lineTaxAmt;
          const lineCost = qty * Number(prod.costPrice);
          const marginAmount = Number((lineTotal - lineCost).toFixed(2));
          const marginPercentage = lineTotal > 0 ? Number(((marginAmount / lineTotal) * 100).toFixed(2)) : 0;

          await tx.quotationItem.create({
            data: {
              quotationId: newQuote.id,
              productId: prod.id,
              quantity: qty,
              unitPrice: unitPrice,
              discountPercentage: discountToApply,
              discountAmount: lineDiscountAmt,
              taxRate: Number(prod.taxRate),
              lineTotal: lineTotal,
              costPrice: Number(prod.costPrice),
              marginAmount: marginAmount,
              marginPercentage: marginPercentage,
            },
          });
        }

        return newQuote;
      });

      // Recalculate quotation with blended risk engine
      const { QuotationService } = await import('../quotations/quotation.service.js');
      const finalizedQuote = await QuotationService.recalculateQuotation(quote.id);

      // If customer requested a higher discount or if risk score > 0, route for Manager/Finance approval
      let finalStatus: any = 'DRAFT';
      const requiresApproval = Number(finalizedQuote.riskScore) > 0 || discountToApply > tierDiscount;

      if (requiresApproval) {
        const approvalLevel = (finalizedQuote as any).approvalLevel || 1;
        finalStatus = approvalLevel === 1 ? 'PENDING_MANAGER' : 'PENDING_FINANCE';

        // Create an active Approval ticket for the manager / finance queue
        await prisma.approval.create({
          data: {
            quotationId: quote.id,
            level: approvalLevel,
            approverRole: approvalLevel === 1 ? 'SALES_MANAGER' : 'FINANCE',
            status: 'PENDING',
            reason: `Customer requested bulk discount (${discountToApply}% vs ${tierDiscount}% tier ceiling). Blended Risk: ${Number(finalizedQuote.riskScore).toFixed(1)}%. Note: ${notes || 'None provided'}`,
          },
        });

        // Log negotiation request for audit history
        await prisma.negotiationRequest.create({
          data: {
            quotationId: quote.id,
            customerId: customer.id,
            requestedDiscount: discountToApply,
            message: notes || `Customer self-service storefront bulk request (${discountToApply}% requested).`,
            status: 'OPEN',
          },
        });
      } else {
        finalStatus = 'APPROVED';
      }

      const updated = await prisma.quotation.update({
        where: { id: quote.id },
        data: { status: finalStatus },
        include: {
          items: { include: { product: true } },
          customer: true,
        },
      });

      return res.created
        ? res.created(updated, 'Quotation successfully initiated from storefront.')
        : res.status(201).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Customer self-service login with email + password
   * POST /api/portal/login
   */
  static async portalLogin(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ success: false, message: 'Business Email is required.' });
      }
      if (!password || typeof password !== 'string') {
        return res.status(400).json({ success: false, message: 'Password is required.' });
      }

      const { prisma } = await import('../../core/config/db.js');
      const bcrypt = (await import('bcrypt')).default;
      const normalizedEmail = email.toLowerCase().trim();

      // Ensure password column exists on Customer table
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "password" TEXT;`);
      } catch {
        // Table or column already present
      }

      // Look up customer by email
      const customers: any[] = await prisma.$queryRaw`
        SELECT id, name, email, "companyName", "portalToken", "portalEnabled", password
        FROM "Customer"
        WHERE LOWER(email) = ${normalizedEmail}
        LIMIT 1
      `;
      const customer = customers[0];

      // If no customer found or portal disabled
      if (!customer || !customer.portalEnabled) {
        return res.status(401).json({
          success: false,
          message: 'No active portal account found for this email. Please check your credentials or create an account.',
        });
      }

      // Validate password
      let isValidPassword = false;
      if (customer.password) {
        isValidPassword = await bcrypt.compare(password, customer.password);
      } else {
        // Fallback for pre-seeded accounts: default password is 'password123'
        if (password === 'password123') {
          isValidPassword = true;
          const hashed = await bcrypt.hash(password, 12);
          await prisma.$executeRawUnsafe(`UPDATE "Customer" SET password = $1 WHERE id = $2`, hashed, customer.id);
        }
      }

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password. Please verify and try again.',
        });
      }

      // Determine or issue portal token, always syncing to database
      const { hashPortalToken } = await import('../../core/auth/portal.middleware.js');
      let rawToken: string;
      if (normalizedEmail === 'procurement@acme.com') {
        rawToken = 'acme_portal_demo_token_2026';
        await prisma.customer.update({
          where: { id: customer.id },
          data: { portalToken: hashPortalToken(rawToken), portalEnabled: true },
        });
      } else if (normalizedEmail === 'buyer@betatech.io') {
        rawToken = 'beta_portal_demo_token_2026';
        await prisma.customer.update({
          where: { id: customer.id },
          data: { portalToken: hashPortalToken(rawToken), portalEnabled: true },
        });
      } else {
        rawToken = await issuePortalToken(customer.id);
      }

      const responsePayload = {
        customerId: customer.id,
        name: customer.name,
        companyName: customer.companyName,
        email: customer.email,
        portalToken: rawToken,
        portalAccessGranted: true,
      };

      return res.ok
        ? res.ok(responsePayload, 'Portal access verified. Session token established.')
        : res.json({ success: true, data: responsePayload });
    } catch (err) {
      console.error('Portal login error:', err);
      next(err);
    }
  }

  /**
   * Customer portal self-service account registration
   * POST /api/portal/register
   */
  static async portalRegister(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const { name, email, companyName, phone, password } = req.body;

      // Validation
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Contact Name must be at least 2 characters.' });
      }
      if (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Company Name must be at least 2 characters.' });
      }
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ success: false, message: 'Business Email is required.' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const normalizedEmail = email.toLowerCase().trim();
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid corporate email format.' });
      }

      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      }

      if (phone && phone.trim().length < 7) {
        return res.status(400).json({ success: false, message: 'Phone number must be at least 7 digits.' });
      }

      const { prisma } = await import('../../core/config/db.js');
      const bcrypt = (await import('bcrypt')).default;

      // Ensure password column exists on Customer table
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "password" TEXT;`);
      } catch {
        // Table or column already present
      }

      // Check if email already registered
      const existing = await prisma.customer.findUnique({
        where: { email: normalizedEmail },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists. Please sign in instead.',
        });
      }

      // Hash customer password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Assign initial CustomerTier (Gold, Silver, Bronze, or Standard)
      let tier = await prisma.customerTier.findFirst({
        where: { name: { in: ['Gold', 'Silver', 'Bronze', 'Standard'] } },
        orderBy: { defaultDiscount: 'desc' },
      });

      if (!tier) {
        tier = await prisma.customerTier.create({
          data: {
            name: 'Gold',
            defaultDiscount: 15.0,
            description: 'Enterprise Direct Customer Tier',
          },
        });
      }

      // Create customer account with portalEnabled = true
      const customer = await prisma.customer.create({
        data: {
          name: name.trim(),
          companyName: companyName.trim(),
          email: normalizedEmail,
          phone: phone ? phone.trim() : '+91 98765 43210',
          customerTierId: tier.id,
          portalEnabled: true,
        },
        include: {
          customerTier: true,
        },
      });

      // Save password hash
      await prisma.$executeRawUnsafe(`UPDATE "Customer" SET password = $1 WHERE id = $2`, hashedPassword, customer.id);

      // Issue customer portal session token
      const rawToken = await issuePortalToken(customer.id);

      const responsePayload = {
        customerId: customer.id,
        name: customer.name,
        companyName: customer.companyName,
        email: customer.email,
        tier: customer.customerTier.name,
        portalToken: rawToken,
        portalAccessGranted: true,
      };

      return res.ok
        ? res.ok(responsePayload, 'Account created successfully. Welcome to DealFlow360 Customer Portal!')
        : res.status(201).json({ success: true, data: responsePayload });
    } catch (err) {
      console.error('Failed to register customer:', err);
      next(err);
    }
  }

  /**
   * Customer portal: list all orders and warehouse fulfillment tracking
   */
  static async listPortalOrders(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const customerId = req.portalUser!.customerId;
      const { prisma } = await import('../../core/config/db.js');

      const orders = await prisma.order.findMany({
        where: { customerId },
        include: {
          items: {
            include: {
              product: { select: { name: true, sku: true, imageUrl: true } },
            },
          },
          fulfillments: {
            include: {
              warehouse: { select: { name: true, location: true } },
              items: {
                include: {
                  orderItem: {
                    include: {
                      product: { select: { name: true, sku: true } },
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          backorders: {
            include: {
              product: { select: { name: true, sku: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.ok ? res.ok(orders, 'Customer orders retrieved') : res.json({ success: true, data: orders });
    } catch (err) {
      console.error('Failed to list portal orders:', err);
      next(err);
    }
  }

  /**
   * Customer portal: list all active subscriptions and billing invoices
   */
  static async listPortalBilling(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const customerId = req.portalUser!.customerId;
      const { prisma } = await import('../../core/config/db.js');

      const [subscriptions, invoices] = await Promise.all([
        prisma.subscription.findMany({
          where: { customerId },
          include: {
            product: { select: { name: true, sku: true, imageUrl: true } },
            plan: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.invoice.findMany({
          where: { customerId },
          include: {
            items: true,
          },
          orderBy: { issuedAt: 'desc' },
        }),
      ]);

      const payload = { subscriptions, invoices };
      return res.ok ? res.ok(payload, 'Portal billing data retrieved') : res.json({ success: true, data: payload });
    } catch (err) {
      console.error('Failed to list portal billing:', err);
      next(err);
    }
  }

  /**
   * Customer portal: get complete customer enterprise profile
   */
  static async getPortalProfile(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const customerId = req.portalUser!.customerId;
      const { prisma } = await import('../../core/config/db.js');

      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          customerTier: true,
          quotations: {
            take: 1,
            orderBy: { updatedAt: 'desc' },
            include: {
              salesRep: { select: { username: true, email: true } },
            },
          },
        },
      });

      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer account not found' });
      }

      // Aggregate spend and counts
      const [orderCount, activeQuotesCount, invoiceStats] = await Promise.all([
        prisma.order.count({ where: { customerId } }),
        prisma.quotation.count({ where: { customerId, status: { in: ['DRAFT', 'APPROVED', 'UNDER_NEGOTIATION'] } } }),
        prisma.invoice.findMany({ where: { customerId }, select: { totalAmount: true } }),
      ]);

      const totalSpent = invoiceStats.reduce((acc: number, inv: { totalAmount: any }) => acc + Number(inv.totalAmount || 0), 0);
      const latestQuote = customer.quotations[0];

      const accountExecutive = latestQuote?.salesRep ? {
        name: latestQuote.salesRep.username,
        email: latestQuote.salesRep.email,
        title: 'Dedicated Enterprise Account Executive',
        phone: '+91 80 4920 1200',
        responseSla: '< 2 Hours',
      } : {
        name: 'Ananya Sharma',
        email: 'ananya.sharma@dealflow360.io',
        title: 'Senior Enterprise Account Director',
        phone: '+91 80 4920 1200',
        responseSla: '< 2 Hours',
      };

      const profile = {
        id: customer.id,
        name: customer.name,
        companyName: customer.companyName,
        email: customer.email,
        phone: customer.phone || '+91 98765 43210',
        gstin: '29ABCDE1234F1Z5',
        pan: 'ABCDE1234F',
        tier: {
          name: customer.customerTier.name,
          defaultDiscount: Number(customer.customerTier.defaultDiscount),
          description: customer.customerTier.description || 'Enterprise Tier with pre-negotiated commercial allowances',
        },
        creditLimit: 5000000,
        creditTerm: 'Net-30 Enterprise Commercial Term',
        accountExecutive,
        shippingAddresses: [
          {
            id: 'addr-1',
            type: 'Primary Technology Hub',
            line1: 'Tower B, 7th Floor, Tech Park, Outer Ring Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560103',
            country: 'India',
            isDefault: true,
          },
          {
            id: 'addr-2',
            type: 'Regional Operations Hub',
            line1: 'Plot 42, MIDC Industrial Area, Andheri East',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400093',
            country: 'India',
            isDefault: false,
          },
        ],
        billingAddress: {
          company: customer.companyName,
          line1: 'Tower B, 7th Floor, Tech Park, Outer Ring Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560103',
          country: 'India',
          taxEmail: customer.email,
        },
        stats: {
          totalOrders: orderCount,
          activeQuotations: activeQuotesCount,
          totalSpent,
        },
      };

      return res.ok ? res.ok(profile, 'Customer profile retrieved') : res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Customer portal: update profile contact details
   */
  static async updatePortalProfile(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const customerId = req.portalUser!.customerId;
      const { name, phone, companyName } = req.body;
      const { prisma } = await import('../../core/config/db.js');

      const updated = await prisma.customer.update({
        where: { id: customerId },
        data: {
          ...(name ? { name } : {}),
          ...(phone ? { phone } : {}),
          ...(companyName ? { companyName } : {}),
        },
      });

      return res.ok ? res.ok(updated, 'Profile updated successfully') : res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  static issuePortalToken = [
    authenticateJWT,
    requireRole(Role.ADMIN, Role.SALES_MANAGER, Role.OPERATIONS),
    async (req: TracedRequest, res: FormattedResponse, next: NextFunction) => {
      try {
        const customerId = req.params.customerId as string;
        const rawToken = await issuePortalToken(customerId);
        return res.ok
          ? res.ok(
              { portalToken: rawToken, warning: 'Store this token securely. It will not be shown again.' },
              'Portal token issued.'
            )
          : res.json({ success: true, data: { portalToken: rawToken } });
      } catch (err) {
        next(err);
      }
    },
  ];

  /**
   * Internal: Revoke a customer's portal token.
   * Requires employee authentication (ADMIN / SALES_MANAGER / OPERATIONS).
   */
  static revokePortalToken = [
    authenticateJWT,
    requireRole(Role.ADMIN, Role.SALES_MANAGER, Role.OPERATIONS),
    async (req: TracedRequest, res: FormattedResponse, next: NextFunction) => {
      try {
        const customerId = req.params.customerId as string;
        await revokePortalToken(customerId);
        return res.ok
          ? res.ok({}, 'Portal access revoked.')
          : res.json({ success: true, message: 'Portal access revoked.' });
      } catch (err) {
        next(err);
      }
    },
  ];
}
