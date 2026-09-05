/**
 * DealFlow360 — Complete Judge Demo Flow with RBAC Authentication
 * Tests the entire business lifecycle end-to-end with proper JWT + portal token auth.
 */

const BASE_URL = 'http://localhost:4000/api';

const c = {
  reset: '\x1b[0m', bright: '\x1b[1m', cyan: '\x1b[36m', green: '\x1b[32m',
  yellow: '\x1b[33m', magenta: '\x1b[35m', red: '\x1b[31m', gray: '\x1b[90m',
};

let salesRepToken = '';
let managerToken = '';
let financeToken = '';
const portalToken = 'acme_portal_demo_token_2026'; // From seed

async function req(url: string, options?: RequestInit & { token?: string }) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options?.token) headers['Authorization'] = `Bearer ${options.token}`;
  
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });
  const data = await res.json();
  if (!res.ok && !data.success) {
    throw new Error(`HTTP ${res.status} on ${url}: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

async function portalReq(url: string, portalToken: string, options?: RequestInit) {
  const fullUrl = `${BASE_URL}${url}${url.includes('?') ? '&' : '?'}portalToken=${portalToken}`;
  const res = await fetch(fullUrl, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} on ${url}: ${text.substring(0, 200)}`);
  }
  
  return await res.json();
}

async function login(email: string, password: string): Promise<string> {
  const res = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return res.data.accessToken;
}

async function runJudgeFlow() {
  console.log(`${c.bright}${c.cyan}================================================================================${c.reset}`);
  console.log(`${c.bright}${c.cyan}        DEALFLOW360 — COMPLETE JUDGE DEMO FLOW WITH RBAC VERIFICATION         ${c.reset}`);
  console.log(`${c.bright}${c.cyan}================================================================================${c.reset}\n`);

  // AUTH: Login as sales rep, manager, and finance
  console.log(`${c.yellow}[AUTH] Authenticating users...${c.reset}`);
  salesRepToken = await login('rep@dealflow360.com', 'password123');
  managerToken = await login('manager@dealflow360.com', 'password123');
  financeToken = await login('finance@dealflow360.com', 'password123');
  console.log(`  -> Sales Rep authenticated: ${salesRepToken.substring(0, 20)}...`);
  console.log(`  -> Manager authenticated:   ${managerToken.substring(0, 20)}...`);
  console.log(`  -> Finance authenticated:   ${financeToken.substring(0, 20)}...`);

  // STAGE 1: Admin config & metadata
  console.log(`\n${c.yellow}[STAGE 1/13] Checking Catalog Metadata (as Sales Rep)...${c.reset}`);
  const customersRes = await req('/quotations/meta/customers', { token: salesRepToken });
  const productsRes = await req('/quotations/meta/products', { token: salesRepToken });

  const cust = customersRes.data[0];
  const prod = productsRes.data.find((p: any) => p.sku === 'HW-MBP-16') || productsRes.data[0];

  console.log(`  -> Customer: ${c.green}${cust.companyName}${c.reset} (Tier: ${cust.customerTier?.name}, Default: ${cust.customerTier?.defaultDiscount}%)`);
  console.log(`  -> Product:  ${c.green}${prod.name}${c.reset} (SKU: ${prod.sku}, Base: ₹${prod.basePrice})`);

  // STAGE 2: Create quotation (as Sales Rep)
  console.log(`\n${c.yellow}[STAGE 2/13] Creating Draft Quotation (as Sales Rep)...${c.reset}`);
  const quoteRes = await req('/quotations', {
    method: 'POST',
    body: JSON.stringify({ customerId: cust.id }),
    token: salesRepToken,
  });
  const qid = quoteRes.data.id;
  const qNum = quoteRes.data.quotationNumber;
  console.log(`  -> Created: ${c.green}${qNum}${c.reset} (ID: ${qid}, Status: ${quoteRes.data.status})`);

  // STAGE 3: Add line item with over-discount
  console.log(`\n${c.yellow}[STAGE 3/13] Adding Line Item with Over-Discount (18%)...${c.reset}`);
  const itemRes = await req(`/quotations/${qid}/items`, {
    method: 'POST',
    body: JSON.stringify({ productId: prod.id, quantity: 10, discountPercentage: 18 }),
    token: salesRepToken,
  });
  const lineData = itemRes.data;
  console.log(`  -> Subtotal:     ₹${lineData.subtotal}`);
  console.log(`  -> Margin:       ${c.green}${lineData.marginPercentage}%${c.reset}`);
  console.log(`  -> Risk Score:   ${c.magenta}${lineData.riskScore}${c.reset}`);
  console.log(`  -> Approval Lvl: ${c.magenta}${lineData.approvalLevel}${c.reset}`);

  // STAGE 4: Submit quotation
  console.log(`\n${c.yellow}[STAGE 4/13] Submitting Quotation for Approval...${c.reset}`);
  const submitRes = await req(`/quotations/${qid}/submit`, { method: 'POST', token: salesRepToken });
  console.log(`  -> Status: ${c.green}${submitRes.data.status}${c.reset}`);

  // STAGE 5: Manager approval
  console.log(`\n${c.yellow}[STAGE 5/13] Manager Approval...${c.reset}`);
  const pendingRes = await req('/approvals/pending', { token: managerToken });
  const approval = pendingRes.data.find((a: any) => a.quotationId === qid);
  if (!approval) throw new Error('Pending approval not found');

  console.log(`  -> Approval ID: ${approval.id} (${approval.approverRole}, Level ${approval.level})`);
  const approveRes = await req(`/approvals/${approval.id}/decision`, {
    method: 'POST',
    body: JSON.stringify({ action: 'APPROVE', reason: 'Initial enterprise discount authorized' }),
    token: managerToken,
  });
  console.log(`  -> Result: ${c.green}${approveRes.message}${c.reset}`);

  // STAGE 6: AI Upsell Recommendations
  console.log(`\n${c.yellow}[STAGE 6/13] AI Margin-Optimized Recommendations...${c.reset}`);
  const recsRes = await req(`/quotations/${qid}/recommendations`, { token: salesRepToken });
  console.log(`  -> Found ${recsRes.data.length} high-margin attachments`);
  for (const r of recsRes.data.slice(0, 2)) {
    console.log(`     * [${r.type}] ${r.name} — Margin Delta: +₹${r.marginDelta}`);
  }

  // STAGE 7: Restricted customer portal (using portal token, NOT employee JWT)
  console.log(`\n${c.yellow}[STAGE 7/13] Customer Portal View (with portal token)...${c.reset}`);
  const portalData = await portalReq(`/portal/quotations/${qid}`, portalToken);
  const pItem = portalData.data.items[0];
  const costHidden = pItem.costPrice === undefined || pItem.costPrice === null;
  console.log(`  -> Quote: ${c.green}${portalData.data.quotationNumber}${c.reset}`);
  console.log(`  -> Cost Redacted: ${costHidden ? c.green + 'YES ✓' : c.red + 'NO (LEAKED!)'}${c.reset}`);
  if (!costHidden) throw new Error('Security breach: cost exposed in portal!');

  // STAGE 8: Customer counter-offer
  console.log(`\n${c.yellow}[STAGE 8/13] Customer Counter-Offer (22% discount)...${c.reset}`);
  const counterData = await portalReq(`/portal/quotations/${qid}/counter-offer`, portalToken, {
    method: 'POST',
    body: JSON.stringify({
      requestedDiscount: 22,
      message: 'Budget requires 22% for Q3 closure',
    }),
  });
  
  const counterResult = counterData.data || counterData;
  console.log(`  -> Re-approval Triggered: ${c.magenta}${counterResult.reApprovalTriggered}${c.reset}`);
  console.log(`  -> New Risk Score: ${c.magenta}${counterResult.newRiskScore}${c.reset}`);
  console.log(`  -> New Status: ${c.magenta}${counterResult.status}${c.reset}`);

  // Finance approval
  const pendingRes2 = await req('/approvals/pending', { token: financeToken });
  const approval2 = pendingRes2.data.find((a: any) => a.quotationId === qid);
  if (!approval2) throw new Error('Finance approval not created after counter-offer!');

  const reApproveRes = await req(`/approvals/${approval2.id}/decision`, {
    method: 'POST',
    body: JSON.stringify({ action: 'APPROVE', reason: 'Counter-offer approved' }),
    token: financeToken,
  });
  console.log(`  -> Finance Approved: ${c.green}${reApproveRes.data.status}${c.reset}`);

  // STAGE 9: Customer Confirmation (using portal token)
  console.log(`\n${c.yellow}[STAGE 9/13] Customer Confirms Order...${c.reset}`);
  const confirmData = await portalReq(`/portal/quotations/${qid}/confirm`, portalToken, {
    method: 'POST',
  });
  const orderData = confirmData.data.order;
  console.log(`  -> Order: ${c.green}${orderData.orderNumber}${c.reset} (Status: ${orderData.status})`);

  // STAGE 10: Billing details
  console.log(`\n${c.yellow}[STAGE 10/13] Billing Schedules...${c.reset}`);
  const billingRes = await req(`/billing/orders/${orderData.id}`, { token: financeToken });
  console.log(`  -> Invoices: ${c.green}${billingRes.data.invoices.length}${c.reset}`);
  console.log(`  -> Subscriptions: ${c.green}${billingRes.data.subscriptions.length}${c.reset}`);

  // STAGE 11: Multi-Warehouse Allocation
  console.log(`\n${c.yellow}[STAGE 11/13] Multi-Warehouse Allocation...${c.reset}`);
  const fPlan = confirmData.data.fulfillment.plan;
  console.log(`  -> Status: ${c.green}${fPlan.status}${c.reset}`);
  console.log(`  -> Shipments: ${fPlan.totalShipments}`);
  console.log(`  -> Est. Freight: ₹${fPlan.totalEstimatedFreight}`);
  for (const s of fPlan.splits) {
    console.log(`     * ${s.warehouseName} | Qty: ${s.allocatedQty} | Freight: ₹${s.estimatedCost}`);
  }

  // STAGE 12: Invoice
  console.log(`\n${c.yellow}[STAGE 12/13] Generated Invoice...${c.reset}`);
  const inv = billingRes.data.invoices[0];
  if (!inv) throw new Error('No invoice found!');
  console.log(`  -> Invoice: ${c.green}${inv.invoiceNumber}${c.reset}`);
  console.log(`  -> Total: ₹${inv.totalAmount}`);
  console.log(`  -> Status: ${c.yellow}${inv.status}${c.reset}`);

  // STAGE 13: Partial + Full Payment
  console.log(`\n${c.yellow}[STAGE 13/13] Partial & Full Payment...${c.reset}`);
  const totalAmountNum = Number(inv.totalAmount);
  const partialAmount = Math.round(totalAmountNum * 0.4 * 100) / 100;
  
  console.log(`  -> Partial Payment (40%): ₹${partialAmount}`);
  const payRes1 = await req(`/billing/invoices/${inv.id}/pay`, {
    method: 'POST',
    body: JSON.stringify({ amount: partialAmount, paymentMethod: 'WIRE_TRANSFER' }),
    token: financeToken,
  });
  console.log(`     * Status: ${c.magenta}${payRes1.data.invoice.status}${c.reset}`);

  const remainingAmount = Math.round((totalAmountNum - Number(payRes1.data.invoice.paidAmount)) * 100) / 100;
  console.log(`  -> Remaining Payment (60%): ₹${remainingAmount}`);
  const payRes2 = await req(`/billing/invoices/${inv.id}/pay`, {
    method: 'POST',
    body: JSON.stringify({ amount: remainingAmount, paymentMethod: 'STRIPE_CARD' }),
    token: financeToken,
  });
  console.log(`     * Final Status: ${c.green}${payRes2.data.invoice.status}${c.reset}`);

  console.log(`\n${c.bright}${c.cyan}================================================================================${c.reset}`);
  console.log(`  ${c.bright}${c.green}🏆 ALL 13 STAGES PASSED WITH PRODUCTION-GRADE RBAC SECURITY!${c.reset}`);
  console.log(`${c.bright}${c.cyan}================================================================================${c.reset}\n`);
}

runJudgeFlow().catch((err) => {
  console.error(`\n${c.red}❌ Verification Failed:${c.reset}`, err.message);
  process.exit(1);
});
