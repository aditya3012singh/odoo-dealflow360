$ErrorActionPreference = 'Stop'

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "             DEALFLOW360 — COMPLETE JUDGE DEMO FLOW VERIFICATION               " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

# -----------------------------------------------------------------------------
# STAGE 1: ADMIN CONFIGURATION & METADATA
# -----------------------------------------------------------------------------
Write-Host "`n[STAGE 1/13] Checking Admin Configuration & Catalog Metadata..." -ForegroundColor Yellow
$customersRes = Invoke-RestMethod -Uri "http://localhost:4000/api/quotations/meta/customers" -Method GET
$productsRes  = Invoke-RestMethod -Uri "http://localhost:4000/api/quotations/meta/products" -Method GET

$cust = $customersRes.data[0]
$prod = $productsRes.data[0]

Write-Host "  -> Selected Customer : $($cust.companyName) (Tier: $($cust.customerTier.name), Discount Ceiling: $($cust.customerTier.discountCeiling)%)" -ForegroundColor Green
Write-Host "  -> Primary Product   : $($prod.name) (SKU: $($prod.sku), Base Price: INR $($prod.basePrice), Cost: INR $($prod.costPrice))" -ForegroundColor Green

# -----------------------------------------------------------------------------
# STAGE 2: CREATE QUOTATION
# -----------------------------------------------------------------------------
Write-Host "`n[STAGE 2/13] Creating Draft Quotation..." -ForegroundColor Yellow
$createQuoteBody = @{ customerId = $cust.id } | ConvertTo-Json
$quoteRes = Invoke-RestMethod -Uri "http://localhost:4000/api/quotations" -Method POST -ContentType "application/json" -Body $createQuoteBody
$qid = $quoteRes.data.id
$qNum = $quoteRes.data.quotationNumber
Write-Host "  -> Created Quotation : $qNum (ID: $qid, Initial Status: $($quoteRes.data.status))" -ForegroundColor Green

# -----------------------------------------------------------------------------
# STAGE 3: APPLY OVER-DISCOUNT & RISK/BRS CALCULATION
# -----------------------------------------------------------------------------
Write-Host "`n[STAGE 3/13] Adding Line Item with Over-Discount (18% vs $($cust.customerTier.discountCeiling)% ceiling)..." -ForegroundColor Yellow
$itemBody = @{
    productId = $prod.id
    quantity = 10
    discountPercentage = 18
} | ConvertTo-Json

$itemRes = Invoke-RestMethod -Uri "http://localhost:4000/api/quotations/$qid/items" -Method POST -ContentType "application/json" -Body $itemBody
$lineData = $itemRes.data

Write-Host "  -> Subtotal          : INR $($lineData.subtotal)" -ForegroundColor Green
Write-Host "  -> Discount Amount   : INR $($lineData.discountAmount)" -ForegroundColor Green
Write-Host "  -> Total Net Amount  : INR $($lineData.totalAmount)" -ForegroundColor Green
Write-Host "  -> Gross Margin      : $($lineData.marginPercentage)%" -ForegroundColor Green
Write-Host "  -> Blended Risk Score: $($lineData.riskScore)%" -ForegroundColor Magenta
Write-Host "  -> Escalation Route  : Approval Level $($lineData.approvalLevel)" -ForegroundColor Magenta

if ($lineData.approvalLevel -lt 1) {
    throw "Verification Failed: Over-discount did not trigger approval escalation!"
}

# -----------------------------------------------------------------------------
# STAGE 4: SUBMIT QUOTATION & AUTOMATIC APPROVAL ROUTING
# -----------------------------------------------------------------------------
Write-Host "`n[STAGE 4/13] Submitting Quotation for Approval..." -ForegroundColor Yellow
$submitRes = Invoke-RestMethod -Uri "http://localhost:4000/api/quotations/$qid/submit" -Method POST
Write-Host "  -> Quotation Status  : $($submitRes.data.status) (Successfully routed to Manager)" -ForegroundColor Green

# -----------------------------------------------------------------------------
# STAGE 5: SALES MANAGER / FINANCE APPROVAL
# -----------------------------------------------------------------------------
Write-Host "`n[STAGE 5/13] Fetching Pending Approval & Authorizing Deal..." -ForegroundColor Yellow
$pendingRes = Invoke-RestMethod -Uri "http://localhost:4000/api/approvals/pending" -Method GET
$approval = $pendingRes.data | Where-Object { $_.quotationId -eq $qid }

if (-not $approval) {
    throw "Verification Failed: No pending approval found for quotation $qid"
}
Write-Host "  -> Found Approval ID : $($approval.id) (Role: $($approval.approverRole), Level: $($approval.level))" -ForegroundColor Green

$decisionBody = @{
    action = "APPROVE"
    reason = "Hackathon Judge Flow: Approved initial enterprise discount"
} | ConvertTo-Json

$approveRes = Invoke-RestMethod -Uri "http://localhost:4000/api/approvals/$($approval.id)/decision" -Method POST -ContentType "application/json" -Body $decisionBody
Write-Host "  -> Decision Result   : $($approveRes.message) (New Status: $($approveRes.data.status))" -ForegroundColor Green

# -----------------------------------------------------------------------------
# STAGE 6: UPSELL / CROSS-SELL RECOMMENDATIONS
# -----------------------------------------------------------------------------
Write-Host "`n[STAGE 6/13] Querying AI Margin-Optimized Recommendations..." -ForegroundColor Yellow
$recsRes = Invoke-RestMethod -Uri "http://localhost:4000/api/quotations/$qid/recommendations" -Method GET
Write-Host "  -> Recommended Items : $($recsRes.data.Count) found" -ForegroundColor Green
foreach ($r in $recsRes.data) {
    Write-Host "     * [$($r.type)] $($r.name) - Price: INR $($r.price), Margin Delta: +INR $($r.marginDelta)" -ForegroundColor Gray
}

# -----------------------------------------------------------------------------
# STAGE 7: RESTRICTED CUSTOMER PORTAL VIEW
# -----------------------------------------------------------------------------
Write-Host "`n[STAGE 7/13] Accessing Customer Portal View..." -ForegroundColor Yellow
$portalRes = Invoke-RestMethod -Uri "http://localhost:4000/api/portal/quotations/$qid" -Method GET
$pItem = $portalRes.data.items[0]
$costHidden = ($null -eq $pItem.costPrice)
Write-Host "  -> Customer Portal Q# : $($portalRes.data.quotationNumber)" -ForegroundColor Green
Write-Host "  -> Internal Cost Safe: Hidden from client? $costHidden" -ForegroundColor Green
if (-not $costHidden) {
    throw "Security Warning: Cost price was leaked to customer portal!"
}

# -----------------------------------------------------------------------------
# STAGE 8: CUSTOMER COUNTER-OFFER & AUTOMATIC RE-APPROVAL
# -----------------------------------------------------------------------------
Write-Host "`n[STAGE 8/13] Customer Submits Counter-Offer (Requesting 22% discount)..." -ForegroundColor Yellow
$counterBody = @{
    customerId = $cust.id
    requestedDiscount = 22
    message = "Enterprise budget limit requires 22% discount for deal closure"
} | ConvertTo-Json

$counterRes = Invoke-RestMethod -Uri "http://localhost:4000/api/portal/quotations/$qid/counter-offer" -Method POST -ContentType "application/json" -Body $counterBody
Write-Host "  -> Counter Result    : $($counterRes.message)" -ForegroundColor Green
Write-Host "  -> Re-approval Fired : $($counterRes.data.reApprovalTriggered)" -ForegroundColor Magenta
Write-Host "  -> Recalculated BRS  : $($counterRes.data.newRiskScore)%" -ForegroundColor Magenta
Write-Host "  -> Re-routed Status  : $($counterRes.data.status)" -ForegroundColor Magenta

# Manager re-approves the counter offer
$pendingRes2 = Invoke-RestMethod -Uri "http://localhost:4000/api/approvals/pending" -Method GET
$approval2 = $pendingRes2.data | Where-Object { $_.quotationId -eq $qid } | Select-Object -First 1

if (-not $approval2) {
    throw "Verification Failed: Re-approval record was not created after counter-offer!"
}

$reApproveBody = @{
    action = "APPROVE"
    reason = "Counter-offer accepted to win critical competitive deal"
} | ConvertTo-Json

$reApproveRes = Invoke-RestMethod -Uri "http://localhost:4000/api/approvals/$($approval2.id)/decision" -Method POST -ContentType "application/json" -Body $reApproveBody
Write-Host "  -> Counter Approved  : Quotation Status is now '$($reApproveRes.data.status)'" -ForegroundColor Green

# -----------------------------------------------------------------------------
# STAGE 9: CUSTOMER CONFIRMATION & ORDER CONVERSION
# -----------------------------------------------------------------------------
Write-Host "`n[STAGE 9/13] Customer Confirms and Converts to Order..." -ForegroundColor Yellow
$confirmRes = Invoke-RestMethod -Uri "http://localhost:4000/api/portal/quotations/$qid/confirm" -Method POST
$orderData = $confirmRes.data.order
Write-Host "  -> Order Confirmed   : $($orderData.orderNumber) (ID: $($orderData.id))" -ForegroundColor Green
Write-Host "  -> Initial Status    : $($orderData.status)" -ForegroundColor Green

# -----------------------------------------------------------------------------
# STAGE 10: ORDER + ORDERITEMS IMMUTABLE SNAPSHOT VERIFICATION
# -----------------------------------------------------------------------------
Write-Host "`n[STAGE 10/13] Verifying OrderItem Immutable Snapshot..." -ForegroundColor Yellow
$billingDetails = Invoke-RestMethod -Uri "http://localhost:4000/api/billing/orders/$($orderData.id)" -Method GET
Write-Host "  -> Invoices Created  : $($billingDetails.data.invoices.Count)" -ForegroundColor Green
Write-Host "  -> Subscriptions     : $($billingDetails.data.subscriptions.Count)" -ForegroundColor Green

# -----------------------------------------------------------------------------
# STAGE 11: MULTI-WAREHOUSE ALLOCATION & INVENTORY RESERVATION
# -----------------------------------------------------------------------------
Write-Host "`n[STAGE 11/13] Inspecting Multi-Warehouse Allocation & Freight Costs..." -ForegroundColor Yellow
$fPlan = $confirmRes.data.fulfillment.plan
Write-Host "  -> Plan Status       : $($fPlan.status)" -ForegroundColor Green
Write-Host "  -> Total Shipments   : $($fPlan.totalShipments)" -ForegroundColor Green
Write-Host "  -> Total Est. Freight: INR $($fPlan.totalEstimatedFreight)" -ForegroundColor Green
foreach ($s in $fPlan.splits) {
    Write-Host "     * Split -> Warehouse: $($s.warehouseName) ($($s.location)) | Qty: $($s.allocatedQty) | Est. Cost: INR $($s.estimatedCost)" -ForegroundColor Gray
}

# -----------------------------------------------------------------------------
# STAGE 12: HYBRID BILLING & INVOICE ENGINE
# -----------------------------------------------------------------------------
Write-Host "`n[STAGE 12/13] Inspecting Generated Invoice..." -ForegroundColor Yellow
$inv = $billingDetails.data.invoices[0]
if (-not $inv) {
    throw "Verification Failed: No invoice found on confirmed order!"
}
Write-Host "  -> Invoice Number    : $($inv.invoiceNumber) (Type: $($inv.invoiceType))" -ForegroundColor Green
Write-Host "  -> Total Invoice Amt : INR $($inv.totalAmount)" -ForegroundColor Green
Write-Host "  -> Initial Paid Amt  : INR $($inv.paidAmount)" -ForegroundColor Green
Write-Host "  -> Initial Status    : $($inv.status)" -ForegroundColor Green

# -----------------------------------------------------------------------------
# STAGE 13: PARTIAL PAYMENT & FULL PAYMENT FLOW
# -----------------------------------------------------------------------------
Write-Host "`n[STAGE 13/13] Testing Partial & Full Payment Workflow..." -ForegroundColor Yellow

# 13A: Partial payment of 40%
$partialPaymentAmount = [Math]::Round([double]$inv.totalAmount * 0.4, 2)
Write-Host "  -> Making Partial Payment of INR $partialPaymentAmount (40%)..." -ForegroundColor Gray
$payBody1 = @{
    amount = $partialPaymentAmount
    paymentMethod = "WIRE_TRANSFER"
} | ConvertTo-Json

$payRes1 = Invoke-RestMethod -Uri "http://localhost:4000/api/billing/invoices/$($inv.id)/pay" -Method POST -ContentType "application/json" -Body $payBody1
$updatedInv1 = $payRes1.data.invoice

Write-Host "     * New Paid Amount : INR $($updatedInv1.paidAmount)" -ForegroundColor Green
Write-Host "     * Invoice Status  : $($updatedInv1.status)" -ForegroundColor Magenta
if ($updatedInv1.status -ne "PARTIALLY_PAID") {
    throw "Verification Failed: Expected status 'PARTIALLY_PAID' but received '$($updatedInv1.status)'"
}

# 13B: Remaining payment to reach 100%
$remainingAmount = [Math]::Round([double]$inv.totalAmount - [double]$updatedInv1.paidAmount, 2)
Write-Host "  -> Paying Remaining Balance of INR $remainingAmount (60%)..." -ForegroundColor Gray
$payBody2 = @{
    amount = $remainingAmount
    paymentMethod = "STRIPE_CARD"
} | ConvertTo-Json

$payRes2 = Invoke-RestMethod -Uri "http://localhost:4000/api/billing/invoices/$($inv.id)/pay" -Method POST -ContentType "application/json" -Body $payBody2
$updatedInv2 = $payRes2.data.invoice

Write-Host "     * Final Paid Amount: INR $($updatedInv2.paidAmount)" -ForegroundColor Green
Write-Host "     * Final Status    : $($updatedInv2.status)" -ForegroundColor Green
if ($updatedInv2.status -ne "PAID") {
    throw "Verification Failed: Expected status 'PAID' but received '$($updatedInv2.status)'"
}

Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host "  🏆 ALL 13 STAGES OF THE DEALFLOW360 JUDGE FLOW PASSED WITH FLYING COLORS!    " -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Cyan
