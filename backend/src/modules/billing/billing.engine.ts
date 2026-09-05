import { prisma, TX_OPTIONS } from '../../core/config/db.js';
import { InvoiceType, InvoiceStatus, PaymentStatus, SubscriptionStatus } from '@prisma/client';

export class BillingEngine {
  /**
   * Process order conversion into hybrid invoices and subscription billing schedules
   */
  static async processOrderBilling(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        quotation: {
          include: { items: { include: { product: true } } },
        },
        customer: true,
      },
    });

    if (!order) throw new Error('Order not found.');

    const oneTimeItems = order.quotation.items.filter((i) => !i.product.isRecurring);
    const subscriptionItems = order.quotation.items.filter((i) => i.product.isRecurring);

    return await prisma.$transaction(async (tx) => {
      let oneTimeInvoice = null;

      // 1. Generate Invoice for One-Time physical/services items
      if (oneTimeItems.length > 0) {
        const subtotal = oneTimeItems.reduce((sum, i) => sum + Number(i.lineTotal), 0);
        const taxAmount = Number((subtotal * 0.18).toFixed(2));
        const totalAmount = Number((subtotal + taxAmount).toFixed(2));
        const invoiceNumber = `INV-ONE-${Date.now().toString().slice(-6)}`;

        oneTimeInvoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            orderId: order.id,
            customerId: order.customerId,
            invoiceType: InvoiceType.ONE_TIME,
            subtotal,
            taxAmount,
            totalAmount,
            status: InvoiceStatus.ISSUED,
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Net 15 days
            items: {
              create: oneTimeItems.map((item) => ({
                productId: item.productId,
                description: `${item.product.name} (One-Time)`,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discountAmount: item.discountAmount,
                taxAmount: item.taxRate,
                lineTotal: item.lineTotal,
              })),
            },
          },
        });
      }

      // 2. Set up Subscriptions and generate Recurring Billing Schedule
      const createdSubscriptions = [];

      for (const subItem of subscriptionItems) {
        // Find or assign standard monthly plan
        const plan = await tx.subscriptionPlan.findFirst({
          where: { billingInterval: 'MONTHLY' },
        });

        if (plan) {
          const now = new Date();
          const periodEnd = new Date(now);
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          const subscription = await tx.subscription.create({
            data: {
              orderId: order.id,
              customerId: order.customerId,
              productId: subItem.productId,
              planId: plan.id,
              quantity: subItem.quantity,
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              nextBillingDate: periodEnd,
            },
          });

          // Pre-generate the next 3 scheduled billing intervals
          for (let month = 1; month <= 3; month++) {
            const billingDate = new Date(now);
            billingDate.setMonth(billingDate.getMonth() + month);

            await tx.billingSchedule.create({
              data: {
                subscriptionId: subscription.id,
                billingDate,
                amount: Number(subItem.lineTotal),
              },
            });
          }

          createdSubscriptions.push(subscription);
        }
      }

      return {
        oneTimeInvoice,
        subscriptionsCount: createdSubscriptions.length,
      };
    }, TX_OPTIONS);
  }

  /**
   * Calculate mid-cycle subscription proration charge or credit
   */
  static calculateProration(
    currentMonthlyPrice: number,
    newMonthlyPrice: number,
    daysRemainingInMonth: number,
    daysInMonth: number = 30
  ) {
    const fraction = Math.max(0, Math.min(1, daysRemainingInMonth / daysInMonth));
    const priceDelta = newMonthlyPrice - currentMonthlyPrice;
    const prorationAmount = Number((priceDelta * fraction).toFixed(2));

    return {
      fraction,
      priceDelta,
      prorationAmount,
      isCredit: prorationAmount < 0,
      invoiceType: prorationAmount >= 0 ? InvoiceType.PRORATION : InvoiceType.CREDIT_NOTE,
    };
  }

  /**
   * Record payment against an invoice
   */
  static async recordPayment(
    invoiceId: string,
    amount: number,
    paymentMethod: string = 'CARD'
  ) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) throw new Error('Invoice not found.');

    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount,
          paymentMethod,
          status: PaymentStatus.SUCCESS,
          transactionRef: `TXN-${Date.now()}`,
        },
      });

      const newPaidAmount = Number(invoice.paidAmount) + amount;
      const isFullyPaid = newPaidAmount >= Number(invoice.totalAmount);

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: isFullyPaid ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID,
          paidAt: isFullyPaid ? new Date() : invoice.paidAt,
        },
      });

      return { payment, invoice: updatedInvoice };
    }, TX_OPTIONS);
  }
}
