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
   * Customer self-service login with email + company name
   * POST /api/portal/login
   * Returns the raw portal token so the frontend can use it for subsequent requests
   */
  static async portalLogin(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const { email, companyName } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ success: false, message: 'Email is required.' });
      }

      // Look up customer by email
      const customer = await (await import('../../core/config/db.js')).prisma.customer.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          portalEnabled: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
          portalToken: true,
        },
      });

      // If no customer found or portal disabled - generic message for security
      if (!customer || !customer.portalToken) {
        return res.status(401).json({
          success: false,
          message: 'No active portal account found for this email. Please contact your sales representative.',
        });
      }

      // Optional: verify company name matches (extra security)
      if (companyName && customer.companyName.toLowerCase() !== companyName.toLowerCase().trim()) {
        return res.status(401).json({
          success: false,
          message: 'Email or company name does not match our records.',
        });
      }

      // Return customer info + their hashed token as the session token
      // Note: We return the hash as the session identifier since the raw token
      // is already hashed in the DB. For demo we use the known raw tokens.
      // In production this would trigger a magic link email instead.
      return res.ok
        ? res.ok(
            {
              customerId: customer.id,
              name: customer.name,
              companyName: customer.companyName,
              email: customer.email,
              // We can't reverse the hash, so we signal success.
              // The client must have the raw token from the initial issuance.
              // This endpoint just VALIDATES the email is registered.
              portalAccessGranted: true,
            },
            'Portal access verified. Use your portal token to continue.'
          )
        : res.json({
            success: true,
            data: {
              customerId: customer.id,
              name: customer.name,
              companyName: customer.companyName,
              portalAccessGranted: true,
            },
          });
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
