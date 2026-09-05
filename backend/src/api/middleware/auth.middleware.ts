import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../../core/config/env.js';
import { TracedRequest } from './traceId.middleware.js';

/**
 * Verifies the Bearer JWT and populates req.user / req.userId.
 * Returns 401 if missing, 403 if invalid/expired.
 */
export function authenticateJWT(req: TracedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Unauthorized: Missing or malformed authorization token.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, env.JWT_ACCESS_SECRET, (err: any, decoded: any) => {
    if (err) {
      const isExpired = err.name === 'TokenExpiredError';
      res.status(isExpired ? 401 : 403).json({
        success: false,
        message: isExpired
          ? 'Unauthorized: Access token has expired. Please refresh your session.'
          : 'Forbidden: Invalid access token.',
      });
      return;
    }

    req.user   = decoded;
    req.userId = decoded.id;
    next();
  });
}

/**
 * Same as authenticateJWT but does not reject unauthenticated requests.
 * Used only for genuinely optional auth scenarios (none in business routes — kept for public meta endpoints if needed).
 */
export function optionalAuth(req: TracedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, env.JWT_ACCESS_SECRET, (err: any, decoded: any) => {
      if (!err && decoded) {
        req.user   = decoded;
        req.userId = decoded.id;
      }
      next();
    });
  } else {
    next();
  }
}

/**
 * Simple role guard — kept for backwards compatibility.
 * Prefer authorizePermission() from rbac.middleware.ts for new routes.
 */
export function authorizeRole(roles: string[]) {
  return (req: TracedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized: Authentication required.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges.' });
      return;
    }
    next();
  };
}
