import { prisma } from '../../core/config/db.js';
import { PolicyCache } from './policy.cache.js';
import { Role } from '@prisma/client';

export interface LineItemInput {
  productId: string;
  categoryId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  costPrice: number;
  taxRate?: number;
  variantId?: string;
}

export interface CalculatedItem {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  discountAmount: number;
  lineTotal: number;
  costPrice: number;
  marginAmount: number;
  marginPercentage: number;
  discountLimit: number;
  discountExcess: number;
  riskContribution: number;
}

export interface DiscountRiskAnalysis {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  costAmount: number;
  marginAmount: number;
  marginPercentage: number;
  blendedRiskScore: number;
  requiresApproval: boolean;
  approvalLevel: number;
  requiredRole: Role;
  calculatedItems: CalculatedItem[];
}

export class DiscountEngine {
  /**
   * Evaluate a set of items against customer tier policies to compute pricing,
   * live margins, line excesses, and the blended risk score.
   */
  static async evaluate(
    customerTierId: string,
    items: LineItemInput[]
  ): Promise<DiscountRiskAnalysis> {
    if (!items || items.length === 0) {
      return {
        subtotal: 0,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
        costAmount: 0,
        marginAmount: 0,
        marginPercentage: 0,
        blendedRiskScore: 0,
        requiresApproval: false,
        approvalLevel: 0,
        requiredRole: Role.SALES_REP,
        calculatedItems: [],
      };
    }

    // Pass 1: Line totals and tentative subtotal
    let subtotal = 0;
    const initialLines = items.map((item) => {
      const lineGross = item.quantity * item.unitPrice;
      subtotal += lineGross;
      return { ...item, lineGross };
    });

    let totalDiscountAmount = 0;
    let totalTaxAmount = 0;
    let totalCostAmount = 0;
    let totalRiskScore = 0;

    const calculatedItems: CalculatedItem[] = [];

    // Pass 2: Line-level governance & risk analysis
    for (const item of initialLines) {
      const policy = await PolicyCache.get(customerTierId, item.categoryId);
      const discountLimit = policy.maxDiscount;
      const discountPercentage = Number(item.discountPercentage) || 0;

      const discountAmount = Number((item.lineGross * (discountPercentage / 100)).toFixed(2));
      const lineTotal = Number((item.lineGross - discountAmount).toFixed(2));
      const lineCost = Number((item.quantity * item.costPrice).toFixed(2));
      const marginAmount = Number((lineTotal - lineCost).toFixed(2));
      const marginPercentage = lineTotal > 0 ? Number(((marginAmount / lineTotal) * 100).toFixed(2)) : 0;

      const taxRate = item.taxRate !== undefined ? item.taxRate : 18.0;
      const taxAmount = Number((lineTotal * (taxRate / 100)).toFixed(2));

      // Discount excess over ceiling
      const discountExcess = Math.max(0, Number((discountPercentage - discountLimit).toFixed(2)));

      // Blended Risk Score Formulation:
      // Excess weighted by financial contribution to deal and margin sensitivity factor
      const financialWeight = subtotal > 0 ? item.lineGross / subtotal : 1;
      const marginSensitivity = marginPercentage < 20 ? 1.5 : marginPercentage < 35 ? 1.0 : 0.7;
      const riskContribution = Number((discountExcess * financialWeight * marginSensitivity * 2.5).toFixed(2));

      totalDiscountAmount += discountAmount;
      totalTaxAmount += taxAmount;
      totalCostAmount += lineCost;
      totalRiskScore += riskContribution;

      calculatedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercentage,
        discountAmount,
        lineTotal,
        costPrice: item.costPrice,
        marginAmount,
        marginPercentage,
        discountLimit,
        discountExcess,
        riskContribution,
      });
    }

    const finalSubtotal = Number(subtotal.toFixed(2));
    const finalDiscountAmount = Number(totalDiscountAmount.toFixed(2));
    const netSale = finalSubtotal - finalDiscountAmount;
    const finalCostAmount = Number(totalCostAmount.toFixed(2));
    const finalMarginAmount = Number((netSale - finalCostAmount).toFixed(2));
    const finalMarginPercentage = netSale > 0 ? Number(((finalMarginAmount / netSale) * 100).toFixed(2)) : 0;
    const finalTotalAmount = Number((netSale + totalTaxAmount).toFixed(2));
    const blendedRiskScore = Number(totalRiskScore.toFixed(2));

    // Determine approval requirements based on ApprovalRules
    const approvalRules = await prisma.approvalRule.findMany({
      where: { isActive: true },
      orderBy: { approvalLevel: 'asc' },
    });

    let requiresApproval = false;
    let approvalLevel = 0;
    let requiredRole: Role = Role.SALES_REP;

    if (blendedRiskScore > 0) {
      for (const rule of approvalRules) {
        if (
          blendedRiskScore >= Number(rule.minRiskScore) &&
          blendedRiskScore <= Number(rule.maxRiskScore)
        ) {
          approvalLevel = rule.approvalLevel;
          requiredRole = rule.requiredRole;
          requiresApproval = rule.approvalLevel > 0;
          break;
        }
      }

      // Default fallback if above all ranges
      if (blendedRiskScore > 25.0 && approvalLevel === 0) {
        approvalLevel = 2;
        requiredRole = Role.FINANCE;
        requiresApproval = true;
      }
    }

    return {
      subtotal: finalSubtotal,
      discountAmount: finalDiscountAmount,
      taxAmount: Number(totalTaxAmount.toFixed(2)),
      totalAmount: finalTotalAmount,
      costAmount: finalCostAmount,
      marginAmount: finalMarginAmount,
      marginPercentage: finalMarginPercentage,
      blendedRiskScore,
      requiresApproval,
      approvalLevel,
      requiredRole,
      calculatedItems,
    };
  }
}
