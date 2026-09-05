import { Response, NextFunction } from 'express';
import { CommentService } from './comment.service.js';
import { FormattedResponse } from '../../api/middleware/responseFormatter.js';
import { TracedRequest } from '../../api/middleware/traceId.middleware.js';

export class CommentController {
  /**
   * Add a comment to a quotation (employee or customer)
   * POST /api/quotations/:id/comments
   * POST /api/portal/quotations/:id/comments (customer)
   */
  static async addComment(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const quotationId = req.params.id as string;
      const { comment, quotationItemId } = req.body;

      if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Comment text is required.' });
      }

      // Determine author type and ID based on authentication
      let authorId: string;
      let authorType: 'REP' | 'CUSTOMER' | 'MANAGER';

      if (req.portalUser) {
        // Customer portal
        authorId = req.portalUser.customerId;
        authorType = 'CUSTOMER';
      } else if (req.user) {
        // Employee
        authorId = req.user.id;
        authorType = req.user.role === 'SALES_MANAGER' || req.user.role === 'ADMIN' ? 'MANAGER' : 'REP';
      } else {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
      }

      const result = await CommentService.addComment(
        quotationId,
        authorId,
        authorType,
        comment.trim(),
        quotationItemId
      );

      return res.ok
        ? res.ok(result, 'Comment added successfully.')
        : res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get all comments for a quotation
   * GET /api/quotations/:id/comments
   * GET /api/portal/quotations/:id/comments (customer)
   */
  static async getComments(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const quotationId = req.params.id as string;
      const comments = await CommentService.getComments(quotationId);

      return res.ok
        ? res.ok(comments, 'Comments retrieved successfully.')
        : res.json({ success: true, data: comments });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get comments for a specific line item
   * GET /api/quotations/:id/items/:itemId/comments
   */
  static async getLineComments(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const quotationId = req.params.id as string;
      const itemId = req.params.itemId as string;

      const comments = await CommentService.getLineComments(quotationId, itemId);

      return res.ok
        ? res.ok(comments, 'Line item comments retrieved.')
        : res.json({ success: true, data: comments });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete a comment
   * DELETE /api/quotations/comments/:commentId
   */
  static async deleteComment(req: TracedRequest, res: FormattedResponse, next: NextFunction) {
    try {
      const commentId = req.params.commentId as string;

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
      }

      const result = await CommentService.deleteComment(commentId, req.user.userId, req.user.role);

      return res.ok
        ? res.ok(result, result.message)
        : res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
