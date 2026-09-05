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
   * Internal: Issue a portal token for a customer.
   * Requires employee authentication (ADMIN / SALES_MANAGER / OPERATIONS).
   * Returns the raw token ONCE — caller must relay it to the customer securely.
   */
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
