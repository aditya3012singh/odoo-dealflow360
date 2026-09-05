import { prisma, TX_OPTIONS } from '../../core/config/db.js';
import { ApprovalStatus, QuotationStatus, Role } from '@prisma/client';

export class ApprovalService {
  /**
   * Manager or Finance decision on an approval
   */
  static async processDecision(
    approvalId: string,
    approverUserId: string,
    action: 'APPROVE' | 'REJECT',
    reason: string
  ) {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: { quotation: true },
    });

    if (!approval) throw new Error('Approval request not found.');
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new Error(`Approval already concluded with status ${approval.status}.`);
    }

    const quote = approval.quotation;

    return await prisma.$transaction(async (tx) => {
      if (action === 'REJECT') {
        await tx.approval.update({
          where: { id: approvalId },
          data: {
            status: ApprovalStatus.REJECTED,
            action: 'REJECT',
            approverId: approverUserId,
            reason,
            actedAt: new Date(),
          },
        });

        await tx.quotation.update({
          where: { id: quote.id },
          data: { status: QuotationStatus.REJECTED, lastActivityAt: new Date() },
        });

        await tx.auditLog.create({
          data: {
            entityType: 'QUOTATION',
            entityId: quote.id,
            action: 'REJECTED',
            performedBy: approverUserId,
            oldValue: { status: quote.status },
            newValue: { status: QuotationStatus.REJECTED },
            reason,
          },
        });

        return { success: true, message: 'Quotation rejected.', status: QuotationStatus.REJECTED };
      }

      // Action is APPROVE:
      await tx.approval.update({
        where: { id: approvalId },
        data: {
          status: ApprovalStatus.APPROVED,
          action: 'APPROVE',
          approverId: approverUserId,
          reason,
          actedAt: new Date(),
        },
      });

      // Check if a second-tier approval (Finance) is required
      const riskScore = Number(quote.riskScore);
      const isLevel1 = approval.level === 1;
      const requiresFinance = isLevel1 && riskScore > 25.0;

      let nextQuotationStatus: QuotationStatus = QuotationStatus.APPROVED;

      if (requiresFinance) {
        nextQuotationStatus = QuotationStatus.PENDING_FINANCE;

        // Create Level 2 Approval
        await tx.approval.create({
          data: {
            quotationId: quote.id,
            level: 2,
            approverRole: Role.FINANCE,
            status: ApprovalStatus.PENDING,
            reason: `Risk score (${riskScore}) exceeds 25.0 threshold. Requires Finance confirmation.`,
          },
        });
      }

      await tx.quotation.update({
        where: { id: quote.id },
        data: { status: nextQuotationStatus, lastActivityAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          entityType: 'QUOTATION',
          entityId: quote.id,
          action: 'APPROVED',
          performedBy: approverUserId,
          oldValue: { status: quote.status },
          newValue: { status: nextQuotationStatus },
          reason,
        },
      });

      await tx.outboxEvent.create({
        data: {
          eventType: 'QUOTE_APPROVED',
          payload: {
            quotationId: quote.id,
            approverId: approverUserId,
            status: nextQuotationStatus,
          },
        },
      });

      return {
        success: true,
        message: requiresFinance
          ? 'Level 1 approved. Forwarded to Finance Controller.'
          : 'Quotation fully approved!',
        status: nextQuotationStatus,
      };
    }, TX_OPTIONS);
  }

  /**
   * List all pending approvals
   */
  static async listPending(role?: Role) {
    return await prisma.approval.findMany({
      where: {
        status: ApprovalStatus.PENDING,
        ...(role ? { approverRole: role } : {}),
      },
      include: {
        quotation: {
          include: {
            customer: { include: { customerTier: true } },
            salesRep: { select: { id: true, username: true, email: true } },
            items: { include: { product: true } },
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });
  }
}
