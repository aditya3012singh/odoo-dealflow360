import { Response, NextFunction } from 'express';
import { CustomerService } from './customer.service.js';
import { FormattedResponse } from '../../api/middleware/responseFormatter.js';
import { TracedRequest } from '../../api/middleware/traceId.middleware.js';

export class CustomerController {
  static async listCustomers(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const { search, tier } = req.query;
      const customers = await CustomerService.listCustomers({
        search: search as string | undefined,
        tier: tier as string | undefined,
      });
      return res.ok ? res.ok(customers, 'Customers retrieved successfully') : res.json({ success: true, data: customers });
    } catch (err) {
      next(err);
    }
  }

  static async getCustomerTiers(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const tiers = await CustomerService.getCustomerTiers();
      return res.ok ? res.ok(tiers, 'Customer tiers retrieved') : res.json({ success: true, data: tiers });
    } catch (err) {
      next(err);
    }
  }

  static async createCustomer(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const { name, email, phone, companyName, customerTierId, portalEnabled } = req.body;
      if (!name || !email || !companyName || !customerTierId) {
        return res.status(400).json({
          success: false,
          message: 'name, email, companyName, and customerTierId are required.',
        });
      }

      const customer = await CustomerService.createCustomer({
        name,
        email,
        phone,
        companyName,
        customerTierId,
        portalEnabled,
      });

      return res.created
        ? res.created(customer, 'Customer account created successfully')
        : res.status(201).json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }

  static async updateCustomer(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { name, email, phone, companyName, customerTierId, portalEnabled } = req.body;

      const customer = await CustomerService.updateCustomer(id, {
        name,
        email,
        phone,
        companyName,
        customerTierId,
        portalEnabled,
      });

      return res.ok ? res.ok(customer, 'Customer updated successfully') : res.json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }

  static async getCustomer360(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await CustomerService.getCustomer360(id);
      return res.ok ? res.ok(data, 'Customer 360 profile retrieved') : res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async issuePortalToken(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await CustomerService.issuePortalToken(id);
      return res.ok ? res.ok(result, 'Portal token generated successfully') : res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async revokePortalToken(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await CustomerService.revokePortalToken(id);
      return res.ok ? res.ok(result, 'Portal token revoked successfully') : res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
