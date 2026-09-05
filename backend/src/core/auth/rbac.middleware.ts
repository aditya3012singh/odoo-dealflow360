import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/db.js';
import { Permission, roleHasPermission } from './permissions.js';
import { TracedRequest } from '../../api/middleware/traceId.middleware.js';
import logger from '../logger/structuredLogger.js';

// ============================================================================
// PERMISSION-BASED ROUTE GUARD
// Use after authenticateJWT. Checks the permission matrix.
// ============================================================================

/**
 * Authorizes that the authenticated user has all of the given permissions.
 * Reads the live role from the DB for sensitive operations (ADMIN, FINANCE, SALES_MANAGER).
 */
export function authorizePermission(...permissions: Permission[]) {
  return async (req: TracedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized: Authentication required.' });
        return;
      }

      // For privileged roles, verify role against DB (protects against stale JWT after role change)
      const sensitiveRoles: Role[] = [Role.ADMIN, Role.FINANCE, Role.SALES_MANAGER];
      let effectiveRole: Role = req.user.role as Role;

      if (sensitiveRoles.includes(effectiveRole)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { id: true, role: true, isActive: true },
        });

        if (!dbUser) {
          res.status(401).json({ success: false, message: 'Unauthorized: User account not found.' });
          return;
        }

        if (!dbUser.isActive) {
          res.status(403).json({ success: false, message: 'Forbidden: Your account has been disabled. Contact an administrator.' });
          return;
        }

        effectiveRole = dbUser.role;
        req.user.role = effectiveRole;
      }

      for (const permission of permissions) {
        if (!roleHasPermission(effectiveRole, permission)) {
          logger.warn(`[RBAC] Forbidden: User ${req.user.id} (role: ${effectiveRole}) lacks permission: ${permission}`);
          res.status(403).json({
            success: false,
            message: `Forbidden: You do not have the required permission (${permission}).`,
          });
          return;
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

// ============================================================================
// ROLE-BASED ROUTE GUARD (simple, for backwards compatibility)
// ============================================================================

/**
 * Requires the authenticated user to have one of the given roles.
 * Verifies role against DB for privileged roles.
 */
export function requireRole(...roles: Role[]) {
  return async (req: TracedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized: Authentication required.' });
        return;
      }

      const sensitiveRoles: Role[] = [Role.ADMIN, Role.FINANCE, Role.SALES_MANAGER];
      let effectiveRole: Role = req.user.role as Role;

      if (sensitiveRoles.includes(effectiveRole)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { id: true, role: true, isActive: true },
        });
        if (!dbUser) {
          res.status(401).json({ success: false, message: 'Unauthorized: User account not found.' });
          return;
        }
        if (!dbUser.isActive) {
          res.status(403).json({ success: false, message: 'Forbidden: Your account has been disabled.' });
          return;
        }
        effectiveRole = dbUser.role;
        req.user.role = effectiveRole;
      }

      if (!roles.includes(effectiveRole)) {
        logger.warn(`[RBAC] Forbidden: User ${req.user.id} (role: ${effectiveRole}) is not in required roles: [${roles.join(', ')}]`);
        res.status(403).json({
          success: false,
          message: `Forbidden: Insufficient role. Required: [${roles.join(', ')}].`,
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
