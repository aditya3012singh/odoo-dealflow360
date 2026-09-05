import { prisma } from '../../core/config/db.js';
import { issuePortalToken, revokePortalToken } from '../../core/auth/portal.middleware.js';

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone?: string;
  companyName: string;
  customerTierId: string;
  portalEnabled?: boolean;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  customerTierId?: string;
  portalEnabled?: boolean;
}

export class CustomerService {
  /**
   * List customers with tier details and basic aggregations
   */
  static async listCustomers(filters?: { search?: string; tier?: string }) {
    const where: any = {};

    if (filters?.search) {
      const q = filters.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (filters?.tier && filters.tier !== 'ALL') {
      where.customerTier = {
        name: { equals: filters.tier, mode: 'insensitive' },
      };
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        customerTier: true,
        _count: {
          select: {
            quotations: true,
            orders: true,
            invoices: true,
            subscriptions: true,
          },
        },
      },
      orderBy: { companyName: 'asc' },
    });

    return customers;
  }

  /**
   * Get all customer tiers
   */
  static async getCustomerTiers() {
    return prisma.customerTier.findMany({
      orderBy: { defaultDiscount: 'asc' },
    });
  }

  /**
   * Create a customer. If portalEnabled is true, generate initial portal token.
   */
  static async createCustomer(data: CreateCustomerInput) {
    const existing = await prisma.customer.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });
    if (existing) {
      throw Object.assign(new Error('A customer with this email already exists.'), { statusCode: 409 });
    }

    // Verify tier exists
    const tier = await prisma.customerTier.findUnique({
      where: { id: data.customerTierId },
    });
    if (!tier) {
      throw Object.assign(new Error('Specified Customer Tier not found.'), { statusCode: 404 });
    }

    const customer = await prisma.customer.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone?.trim() || null,
        companyName: data.companyName.trim(),
        customerTierId: data.customerTierId,
        portalEnabled: data.portalEnabled ?? true,
      },
      include: {
        customerTier: true,
      },
    });

    let rawPortalToken: string | null = null;
    if (customer.portalEnabled) {
      rawPortalToken = await issuePortalToken(customer.id);
    }

    return {
      ...customer,
      rawPortalToken,
    };
  }

  /**
   * Update an existing customer
   */
  static async updateCustomer(id: string, data: UpdateCustomerInput) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw Object.assign(new Error('Customer not found.'), { statusCode: 404 });
    }

    if (data.email && data.email.toLowerCase().trim() !== customer.email) {
      const emailInUse = await prisma.customer.findUnique({
        where: { email: data.email.toLowerCase().trim() },
      });
      if (emailInUse) {
        throw Object.assign(new Error('Email already registered to another customer.'), { statusCode: 409 });
      }
    }

    if (data.customerTierId) {
      const tier = await prisma.customerTier.findUnique({ where: { id: data.customerTierId } });
      if (!tier) {
        throw Object.assign(new Error('Customer tier does not exist.'), { statusCode: 404 });
      }
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.email ? { email: data.email.toLowerCase().trim() } : {}),
        ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
        ...(data.companyName ? { companyName: data.companyName.trim() } : {}),
        ...(data.customerTierId ? { customerTierId: data.customerTierId } : {}),
        ...(data.portalEnabled !== undefined ? { portalEnabled: data.portalEnabled } : {}),
      },
      include: {
        customerTier: true,
      },
    });

    return updated;
  }

  /**
   * Get 360-degree view of a customer
   */
  static async getCustomer360(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        customerTier: true,
        quotations: {
          orderBy: { createdAt: 'desc' },
          take: 15,
          include: {
            salesRep: { select: { id: true, username: true, email: true } },
            items: {
              include: {
                product: { select: { name: true, sku: true } },
              },
            },
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 15,
          include: {
            items: {
              include: {
                product: { select: { name: true, sku: true } },
              },
            },
            fulfillments: true,
          },
        },
        invoices: {
          orderBy: { issuedAt: 'desc' },
          take: 15,
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        negotiations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            quotation: { select: { quotationNumber: true } },
          },
        },
      },
    });

    if (!customer) {
      throw Object.assign(new Error('Customer not found.'), { statusCode: 404 });
    }

    // Calculate aggregated lifetime KPIs
    const lifetimeQuotationsCount = await prisma.quotation.count({ where: { customerId: id } });
    const lifetimeOrdersCount = await prisma.order.count({ where: { customerId: id } });
    
    // Total spend from converted orders or paid invoices
    const ordersSpend = await prisma.order.aggregate({
      where: { customerId: id },
      _sum: { totalAmount: true },
    });

    const activeSubscriptionsCount = await prisma.subscription.count({
      where: { customerId: id, status: 'ACTIVE' },
    });

    const pendingNegotiationsCount = await prisma.negotiationRequest.count({
      where: { customerId: id, status: 'OPEN' },
    });

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        companyName: customer.companyName,
        customerTier: customer.customerTier,
        portalEnabled: customer.portalEnabled,
        hasPortalToken: !!customer.portalToken,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
      metrics: {
        lifetimeSpend: Number(ordersSpend._sum.totalAmount || 0),
        totalQuotations: lifetimeQuotationsCount,
        totalOrders: lifetimeOrdersCount,
        activeSubscriptions: activeSubscriptionsCount,
        pendingNegotiations: pendingNegotiationsCount,
      },
      quotations: customer.quotations,
      orders: customer.orders,
      invoices: customer.invoices,
      subscriptions: customer.subscriptions,
      negotiations: customer.negotiations,
    };
  }

  /**
   * Issue a portal token
   */
  static async issuePortalToken(id: string) {
    const rawToken = await issuePortalToken(id);
    return {
      portalToken: rawToken,
      warning: 'Store this token securely. It cannot be retrieved again in plaintext.',
    };
  }

  /**
   * Revoke a portal token
   */
  static async revokePortalToken(id: string) {
    await revokePortalToken(id);
    return { message: 'Customer portal access revoked successfully.' };
  }
}
