import { prisma } from '../../core/config/db.js';

export class CommentService {
  /**
   * Add a comment to a quotation (quote-level or line-level)
   */
  static async addComment(
    quotationId: string,
    authorId: string,
    authorType: 'REP' | 'CUSTOMER' | 'MANAGER',
    comment: string,
    quotationItemId?: string
  ) {
    // Verify quotation exists
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      select: { id: true },
    });

    if (!quotation) {
      throw new Error('Quotation not found.');
    }

    // If line-level comment, verify item exists
    if (quotationItemId) {
      const item = await prisma.quotationItem.findFirst({
        where: { id: quotationItemId, quotationId },
      });

      if (!item) {
        throw new Error('Quotation item not found or does not belong to this quotation.');
      }
    }

    // Create comment
    const newComment = await prisma.quotationComment.create({
      data: {
        quotationId,
        quotationItemId: quotationItemId || null,
        authorId,
        authorType,
        comment,
      },
      include: {
        quotationItem: {
          select: {
            id: true,
            productId: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    // Update lastActivityAt
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { lastActivityAt: new Date() },
    });

    return newComment;
  }

  /**
   * Get all comments for a quotation (both quote-level and line-level)
   */
  static async getComments(quotationId: string) {
    const comments = await prisma.quotationComment.findMany({
      where: { quotationId },
      orderBy: { createdAt: 'desc' },
      include: {
        quotationItem: {
          select: {
            id: true,
            productId: true,
            product: { select: { name: true, sku: true } },
            quantity: true,
          },
        },
      },
    });

    return comments;
  }

  /**
   * Get comments for a specific line item
   */
  static async getLineComments(quotationId: string, quotationItemId: string) {
    const comments = await prisma.quotationComment.findMany({
      where: {
        quotationId,
        quotationItemId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return comments;
  }

  /**
   * Delete a comment (only by author or admin)
   */
  static async deleteComment(commentId: string, userId: string, userRole: string) {
    const comment = await prisma.quotationComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found.');
    }

    // Only author or admin can delete
    if (comment.authorId !== userId && userRole !== 'ADMIN') {
      throw new Error('Unauthorized: You can only delete your own comments.');
    }

    await prisma.quotationComment.delete({
      where: { id: commentId },
    });

    return { success: true, message: 'Comment deleted.' };
  }
}
