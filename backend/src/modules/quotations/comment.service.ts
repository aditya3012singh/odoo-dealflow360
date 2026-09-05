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

    // Enrich comments with author metadata
    const userIds = [
      ...new Set(
        comments
          .filter((c) => c.authorType === 'REP' || c.authorType === 'MANAGER')
          .map((c) => c.authorId)
      ),
    ];
    const customerIds = [
      ...new Set(
        comments
          .filter((c) => c.authorType === 'CUSTOMER')
          .map((c) => c.authorId)
      ),
    ];

    const [users, customers] = await Promise.all([
      userIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true, role: true },
          })
        : [],
      customerIds.length > 0
        ? prisma.customer.findMany({
            where: { id: { in: customerIds } },
            select: { id: true, name: true, companyName: true },
          })
        : [],
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const customerMap = new Map(customers.map((c) => [c.id, c]));

    return comments.map((c) => {
      let authorName = 'Sales Representative';
      let authorRole = c.authorType;

      if (c.authorType === 'CUSTOMER') {
        const cust = customerMap.get(c.authorId);
        authorName = cust ? `${cust.companyName} (${cust.name})` : 'Client (Customer)';
        authorRole = 'CUSTOMER';
      } else {
        const usr = userMap.get(c.authorId);
        if (usr) {
          authorName = usr.username;
          authorRole = usr.role;
        } else if (c.authorType === 'MANAGER') {
          authorName = 'Sales Operations';
          authorRole = 'SALES_MANAGER';
        } else {
          authorName = 'Sales Representative';
          authorRole = 'SALES_REP';
        }
      }

      return {
        ...c,
        authorName,
        authorRole,
      };
    });
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
