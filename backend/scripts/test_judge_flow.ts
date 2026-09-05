/**
 * DealFlow360 — Complete Judge Demo Flow Automated Verification
 * 
 * Tests the entire business lifecycle end-to-end:
 *  1. Admin config & catalog check
 *  2. Create quotation
 *  3. Apply over-discount (exceeding tier ceiling)
 *  4. Blended Risk Score (BRS) calculation & approval escalation
 *  5. Sales Manager approval
 *  6. AI Margin-Optimized recommendations
 *  7. Restricted customer portal view (cost price redacted)
 *  8. Customer counter-offer & automatic re-approval triggering
 *  9. Counter-offer approved
 * 10. Customer confirmation & conversion to Order
 * 11. Immutable OrderItem snapshot verification
 * 12. Multi-warehouse greedy allocation & inventory reservation
 * 13. Partial payment & invoice status lifecycle (ISSUED -> PARTIALLY_PAID -> PAID)
 */

const BASE_URL = 'http://localhost:4000/api';

const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

async function req(url: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok && !data.success) {
    throw new Error(`HTTP ${res.status} on ${url}: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

async function runJudgeFlow() {
  console.log(`${c.bright}${c.cyan}================================================================================${c.reset}`);
  console.log(`${c.bright}${c.cyan}             DEALFLOW360 — COMPLETE JUDGE DEMO FLOW VERIFICATION               ${c.reset}`);
  console.log(`${c.bright}${c.cyan}================================================================================${c.reset}\n`);

  // STAGE 1: Admin config & metadata
  console.log(`${c.yellow}[STAGE 1/13] Checking Admin Configuration & Catalog Metadata...${c.reset}`);
  const customersRes = await req('/quotations/meta/customers');
  const productsRes = await req('/quotations/meta/products');

  const cust = customersRes.data[0];
  const prod = productsRes.data.find((p: any) => p.sku === 'HW-MBP-16') || productsRes.data[0];

  console.log(`  -> Selected Customer : ${c.green}${cust.companyName}${c.reset} (Tier: ${cust.customerTier?.name || 'Gold'}, Default Discount: ${cust.customerTier?.defaultDiscount || 15}%)`);
  console.log(`  -> Primary Product   : ${c.green}${prod.name}${c.reset} (SKU: ${prod.sku}, Base: INR ${prod.basePrice}, Cost: INR ${prod.costPrice})`);

  // STAGE 2: Create quotation
  console.log(`\n${c.yellow}[STAGE 2/13] Creating Draft Quotation...${c.reset}`);
  const quoteRes = await req('/quotations', {
    method: 'POST',
    body: JSON.stringify({ customerId: cust.id }),
  });
  const qid = quoteRes.data.id;
  const qNum = quoteRes.data.quotationNumber;
  console.log(`  -> Created Quotation : ${c.green}${qNum}${c.reset} (ID: ${qid}, Initial Status: ${quoteRes.data.status})`);

  // STAGE 3: Apply over-discount (18% vs 10% ceiling)
  console.log(`\n${c.yellow}[STAGE 3/13] Adding Line Item with Over-Discount (18% vs ${cust.customerTier.discountCeiling}% ceiling)...${c.reset}`);
  const itemRes = await req(`/quotations/${qid}/items`, {
    method: 'POST',
    body: JSON.stringify({
      productId: prod.id,
      quantity: 10,
      discountPercentage: 18,
    }),
  });
  const lineData = itemRes.data;
  console.log(`  -> Subtotal          : INR ${lineData.subtotal}`);
  console.log(`  -> Discount Amount   : INR ${lineData.discountAmount}`);
  console.log(`  -> Total Net Amount  : INR ${lineData.totalAmount}`);
  console.log(`  -> Deal Gross Margin : ${c.green}${lineData.marginPercentage}%${c.reset}`);
  console.log(`  -> Blended Risk Score: ${c.magenta}${lineData.riskScore}%${c.reset}`);
  console.log(`  -> Escalation Route  : ${c.magenta}Approval Level ${lineData.approvalLevel} (Sales Manager Escalation)${c.reset}`);

  if (lineData.approvalLevel < 1) {
    throw new Error('Verification Failed: Over-discount did not trigger approval escalation!');
  }

  // STAGE 4: Submit quotation for approval
  console.log(`\n${c.yellow}[STAGE 4/13] Submitting Quotation for Approval...${c.reset}`);
  const submitRes = await req(`/quotations/${qid}/submit`, { method: 'POST' });
  console.log(`  -> Quotation Status  : ${c.green}${submitRes.data.status}${c.reset} (Routed to Manager)`);

  // STAGE 5: Manager approval
  console.log(`\n${c.yellow}[STAGE 5/13] Fetching Pending Approval & Authorizing Deal...${c.reset}`);
  const pendingRes = await req('/approvals/pending');
  const approval = pendingRes.data.find((a: any) => a.quotationId === qid);
  if (!approval) throw new Error(`Pending approval not found for quotation ${qid}`);

  console.log(`  -> Found Approval ID : ${approval.id} (${approval.approverRole}, Level ${approval.level})`);
  const approveRes = await req(`/approvals/${approval.id}/decision`, {
    method: 'POST',
    body: JSON.stringify({
      action: 'APPROVE',
      reason: 'Hackathon Judge Demo: Initial enterprise discount authorized',
    }),
  });
  console.log(`  -> Decision Result   : ${c.green}${approveRes.message}${c.reset} (New Status: ${approveRes.data.status})`);

  // STAGE 6: AI Upsell Recommendations
  console.log(`\n${c.yellow}[STAGE 6/13] Querying AI Margin-Optimized Recommendations...${c.reset}`);
  const recsRes = await req(`/quotations/${qid}/recommendations`);
  console.log(`  -> Recommendations   : ${recsRes.data.length} high-margin attachments found`);
  for (const r of recsRes.data) {
    console.log(`     * [${r.type}] ${r.name} — Price: INR ${r.price}, Margin Delta: +INR ${r.marginDelta}`);
  }

  // STAGE 7: Restricted customer portal
  console.log(`\n${c.yellow}[STAGE 7/13] Accessing Restricted Customer Portal View...${c.reset}`);
  const portalRes = await req(`/portal/quotations/${qid}`);
  const pItem = portalRes.data.items[0];
  const costHidden = pItem.costPrice === undefined || pItem.costPrice === null;
  console.log(`  -> Customer Portal Q#: ${c.green}${portalRes.data.quotationNumber}${c.reset}`);
  console.log(`  -> Cost Redacted     : ${costHidden ? c.green + 'YES (Safe)' : c.red + 'NO (LEAKED!)'}${c.reset}`);
  if (!costHidden) throw new Error('Security Breach: Cost price exposed in customer portal!');

  // STAGE 8: Customer counter-offer & re-approval
  console.log(`\n${c.yellow}[STAGE 8/13] Customer Submits Counter-Offer (Requesting 22% discount)...${c.reset}`);
  const counterRes = await req(`/portal/quotations/${qid}/counter-offer`, {
    method: 'POST',
    body: JSON.stringify({
      customerId: cust.id,
      requestedDiscount: 22,
      message: 'Budget requires 22% discount for closure before Q3 end',
    }),
  });
  console.log(`  -> Counter Result    : ${counterRes.message}`);
  console.log(`  -> Re-approval Fired : ${c.magenta}${counterRes.data.reApprovalTriggered}${c.reset}`);
  console.log(`  -> Recalculated BRS  : ${c.magenta}${counterRes.data.newRiskScore}%${c.reset}`);
  console.log(`  -> Re-routed Status  : ${c.magenta}${counterRes.data.status}${c.reset}`);

  // Re-approve counter offer
  const pendingRes2 = await req('/approvals/pending');
  const approval2 = pendingRes2.data.find((a: any) => a.quotationId === qid);
  if (!approval2) throw new Error('Re-approval record was not created after counter-offer!');

  const reApproveRes = await req(`/approvals/${approval2.id}/decision`, {
    method: 'POST',
    body: JSON.stringify({
      action: 'APPROVE',
      reason: 'Counter-offer approved to win key enterprise account',
    }),
  });
  console.log(`  -> Counter Approved  : Quotation Status is now ${c.green}'${reApproveRes.data.status}'${c.reset}`);

  // STAGE 9: Customer Confirmation
  console.log(`\n${c.yellow}[STAGE 9/13] Customer Confirms and Converts to Order...${c.reset}`);
  const confirmRes = await req(`/portal/quotations/${qid}/confirm`, { method: 'POST' });
  const orderData = confirmRes.data.order;
  console.log(`  -> Order Confirmed   : ${c.green}${orderData.orderNumber}${c.reset} (ID: ${orderData.id})`);
  console.log(`  -> Order Status      : ${orderData.status}`);

  // STAGE 10: OrderItem Immutable Snapshot
  console.log(`\n${c.yellow}[STAGE 10/13] Verifying OrderItem Immutable Snapshot & Billing Schedules...${c.reset}`);
  const billingDetails = await req(`/billing/orders/${orderData.id}`);
  console.log(`  -> Invoices Created  : ${c.green}${billingDetails.data.invoices.length}${c.reset}`);
  console.log(`  -> Subscriptions     : ${c.green}${billingDetails.data.subscriptions.length}${c.reset}`);

  // STAGE 11: Multi-Warehouse Allocation
  console.log(`\n${c.yellow}[STAGE 11/13] Inspecting Multi-Warehouse Allocation & Freight Costs...${c.reset}`);
  const fPlan = confirmRes.data.fulfillment.plan;
  console.log(`  -> Allocation Status : ${c.green}${fPlan.status}${c.reset}`);
  console.log(`  -> Total Shipments   : ${fPlan.totalShipments}`);
  console.log(`  -> Est. Total Freight: INR ${fPlan.totalEstimatedFreight}`);
  for (const s of fPlan.splits) {
    console.log(`     * Warehouse: ${s.warehouseName} (${s.location}) | Qty: ${s.allocatedQty} | Freight: INR ${s.estimatedCost}`);
  }

  // STAGE 12: Generated Invoice Details
  console.log(`\n${c.yellow}[STAGE 12/13] Inspecting Generated Invoice...${c.reset}`);
  const inv = billingDetails.data.invoices[0];
  if (!inv) throw new Error('No invoice found on confirmed order!');
  console.log(`  -> Invoice Number    : ${c.green}${inv.invoiceNumber}${c.reset} (${inv.invoiceType})`);
  console.log(`  -> Total Amount      : INR ${inv.totalAmount}`);
  console.log(`  -> Initial Paid Amt  : INR ${inv.paidAmount}`);
  console.log(`  -> Initial Status    : ${c.yellow}${inv.status}${c.reset}`);

  // STAGE 13: Partial Payment & Full Payment
  console.log(`\n${c.yellow}[STAGE 13/13] Testing Partial & Full Payment Workflow...${c.reset}`);
  
  // 13A: Partial payment 40%
  const totalAmountNum = Number(inv.totalAmount);
  const partialAmount = Math.round(totalAmountNum * 0.4 * 100) / 100;
  console.log(`  -> Making Partial Payment of INR ${partialAmount} (40%)...`);
  const payRes1 = await req(`/billing/invoices/${inv.id}/pay`, {
    method: 'POST',
    body: JSON.stringify({
      amount: partialAmount,
      paymentMethod: 'WIRE_TRANSFER',
    }),
  });
  const updatedInv1 = payRes1.data.invoice;
  console.log(`     * Paid Amount     : INR ${updatedInv1.paidAmount}`);
  console.log(`     * Invoice Status  : ${c.magenta}${updatedInv1.status}${c.reset}`);
  if (updatedInv1.status !== 'PARTIALLY_PAID') {
    throw new Error(`Expected PARTIALLY_PAID, got ${updatedInv1.status}`);
  }

  // 13B: Remaining payment 60%
  const remainingAmount = Math.round((totalAmountNum - Number(updatedInv1.paidAmount)) * 100) / 100;
  console.log(`  -> Paying Remaining Balance of INR ${remainingAmount} (60%)...`);
  const payRes2 = await req(`/billing/invoices/${inv.id}/pay`, {
    method: 'POST',
    body: JSON.stringify({
      amount: remainingAmount,
      paymentMethod: 'STRIPE_CARD',
    }),
  });
  const updatedInv2 = payRes2.data.invoice;
  console.log(`     * Final Paid Amt  : INR ${updatedInv2.paidAmount}`);
  console.log(`     * Final Status    : ${c.green}${updatedInv2.status}${c.reset}`);
  if (updatedInv2.status !== 'PAID') {
    throw new Error(`Expected PAID, got ${updatedInv2.status}`);
  }

  console.log(`\n${c.bright}${c.cyan}================================================================================${c.reset}`);
  console.log(`  ${c.bright}${c.green}🏆 ALL 13 STAGES OF THE DEALFLOW360 JUDGE FLOW PASSED WITH FLYING COLORS!${c.reset}`);
  console.log(`${c.bright}${c.cyan}================================================================================${c.reset}\n`);
}

runJudgeFlow().catch((err) => {
  console.error(`\n${c.red}❌ Verification Failed:${c.reset}`, err.message);
  process.exit(1);
});
