import crypto from 'crypto';
import { Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { TracedRequest } from '../../api/middleware/traceId.middleware.js';
import logger from '../logger/structuredLogger.js';

// ============================================================================
// CUSTOMER PORTAL AUTHENTICATION
// Customers authenticate with a dedicated opaque token stored as a hash.
// This is completely separate from the employee JWT system.
// ============================================================================

export interface PortalUser {
  customerId: string;
  customerName: string;
  companyName: string;
  portalToken: string;    // The raw token (for response only — never logged or stored raw)
}

// Extend TracedRequest so controllers get typed portal identity
declare module '../../api/middleware/traceId.middleware.js' {
  interface TracedRequest {
    portalUser?: PortalUser;
  }
}

/**
 * Hash an opaque portal token using SHA-256.
 * We store only the hash; the raw token is only ever in the DB during generation.
 */
export function hashPortalToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a cryptographically secure portal token.
 * Returns both the raw token (to be sent to the customer once) and the hash (to store in DB).
 */
export function generatePortalToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('hex');
  return { raw, hash: hashPortalToken(raw) };
}

/**
 * Portal authentication middleware.
 *
 * Accepts the portal token from:
 *   - Authorization header: Bearer <token>
 *   - Query param:          ?portalToken=<token>
 *
 * Populates req.portalUser with the resolved customer identity.
 * If the quotationId is in req.params.id, also verifies the quote belongs to this customer.
 */
export function authenticatePortal(req: TracedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
  const queryToken = req.query.portalToken as string | undefined;
  const rawToken = headerToken || queryToken;

  if (!rawToken) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Portal access token is required. Provide it as Bearer token or portalToken query param.',
    });
    return;
  }

  const tokenHash = hashPortalToken(rawToken);

  prisma.customer
    .findFirst({ where: { portalToken: tokenHash, portalEnabled: true } })
    .then(async (customer) => {
      if (!customer) {
        logger.warn(`[Portal] Invalid or revoked portal token attempt. Hash: ${tokenHash.substring(0, 12)}...`);
        res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired portal token.' });
        return;
      }

      req.portalUser = {
        customerId: customer.id,
        customerName: customer.name,
        companyName: customer.companyName,
        portalToken: rawToken,
      };

      // If a quotationId is present in the route params, verify ownership immediately
      const quotationId = req.params.id as string;
      if (quotationId) {
        const quote = await prisma.quotation.findUnique({
          where: { id: quotationId as string },
          select: { customerId: true },
        });

        if (!quote) {
          res.status(404).json({ success: false, message: 'Quotation not found.' });
          return;
        }

        if (quote.customerId !== customer.id) {
          logger.warn(
            `[Portal] Ownership violation: Customer ${customer.id} attempted to access quote belonging to ${quote.customerId}`
          );
          res.status(403).json({
            success: false,
            message: 'Forbidden: This quotation does not belong to your account.',
          });
          return;
        }
      }

      next();
    })
    .catch(next);
}

/**
 * Issue or regenerate a portal token for a customer.
 * Stores the hash in the DB; returns the raw token to the caller (once).
 */
export async function issuePortalToken(customerId: string): Promise<string> {
  const { raw, hash } = generatePortalToken();

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      portalToken: hash,
      portalEnabled: true,
    },
  });

  // Never log the raw token
  logger.info(`[Portal] Portal token issued for customer ${customerId}`);
  return raw;
}

/**
 * Revoke a customer's portal access.
 */
export async function revokePortalToken(customerId: string): Promise<void> {
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      portalToken: null,
      portalEnabled: false,
    },
  });
  logger.info(`[Portal] Portal token revoked for customer ${customerId}`);
}
