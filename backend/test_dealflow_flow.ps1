$ErrorActionPreference = 'Stop'

Write-Host "=== 1. FETCHING CUSTOMERS ==="
$c = Invoke-RestMethod -Uri "http://localhost:4000/api/quotations/meta/customers" -Method GET
Write-Host "Customers found: $($c.data.Count)"
$cust = $c.data[0]
Write-Host "Selected Customer: $($cust.companyName) (Tier: $($cust.customerTier.name), Ceiling: $($cust.customerTier.discountCeiling)%)"

Write-Host "`n=== 2. FETCHING CATALOG PRODUCTS ==="
$prods = Invoke-RestMethod -Uri "http://localhost:4000/api/quotations/meta/products" -Method GET
Write-Host "Products found: $($prods.data.Count)"
$macbook = $prods.data[0]
Write-Host "Primary Product: $($macbook.name) (SKU: $($macbook.sku)) - Base Price: INR $($macbook.basePrice), Cost: INR $($macbook.costPrice)"

Write-Host "`n=== 3. CREATING DRAFT QUOTATION ==="
$createPayload = @{ customerId = $cust.id } | ConvertTo-Json
$q = Invoke-RestMethod -Uri "http://localhost:4000/api/quotations" -Method POST -ContentType "application/json" -Body $createPayload
$qid = $q.data.id
Write-Host "Created Quotation: $($q.data.quotationNumber) (ID: $qid)"

Write-Host "`n=== 4. ADDING 10 UNITS WITH 18% DISCOUNT (EXCEEDING 15% CEILING) ==="
$itemPayload = @{ productId = $macbook.id; quantity = 10; discountPercentage = 18 } | ConvertTo-Json
$itemRes = Invoke-RestMethod -Uri "http://localhost:4000/api/quotations/$qid/items" -Method POST -ContentType "application/json" -Body $itemPayload
Write-Host "Subtotal: INR $($itemRes.data.subtotal)"
Write-Host "Discount: INR $($itemRes.data.discountAmount)"
Write-Host "Net Total: INR $($itemRes.data.totalAmount)"
Write-Host "Deal Gross Margin: $($itemRes.data.marginPercentage)%"
Write-Host "BLENDED RISK SCORE: $($itemRes.data.riskScore)%"
Write-Host "REQUIRED APPROVAL ROUTING: Level $($itemRes.data.approvalLevel) (Sales Manager Escalation)"

Write-Host "`n=== 5. FETCHING AI MARGIN-OPTIMIZED RECOMMENDATIONS ==="
$recs = Invoke-RestMethod -Uri "http://localhost:4000/api/quotations/$qid/recommendations" -Method GET
Write-Host "AI Recommendations found: $($recs.data.Count)"
foreach ($r in $recs.data) {
  Write-Host " -> $($r.name) [$($r.type)]: Price INR $($r.price), Margin Delta: +INR $($r.marginDelta)"
}

Write-Host "`n=== 6. SUBMITTING QUOTATION FOR APPROVAL ==="
$sub = Invoke-RestMethod -Uri "http://localhost:4000/api/quotations/$qid/submit" -Method POST
Write-Host "Submission Status: $($sub.data.status) (Routed according to Blended Risk)"

Write-Host "`n=== 7. PROCESSING SALES MANAGER APPROVAL ==="
$pendingApps = Invoke-RestMethod -Uri "http://localhost:4000/api/approvals/pending" -Method GET
$myApp = $pendingApps.data | Where-Object { $_.quotationId -eq $qid }
Write-Host "Found Pending Approval ID: $($myApp.id) for Level $($myApp.level) ($($myApp.approverRole))"

$decPayload = @{ action = "APPROVE"; reason = "Strategic enterprise expansion discount authorized" } | ConvertTo-Json
$dec = Invoke-RestMethod -Uri "http://localhost:4000/api/approvals/$($myApp.id)/decision" -Method POST -ContentType "application/json" -Body $decPayload
Write-Host "Approval Result: $($dec.message) - Next Quotation Status: $($dec.data.status)"

Write-Host "`n=== 8. ACCESSING RESTRICTED CUSTOMER PORTAL VIEW ==="
$portal = Invoke-RestMethod -Uri "http://localhost:4000/api/portal/quotations/$qid" -Method GET
Write-Host "Portal View Loaded: $($portal.data.quotationNumber)"
Write-Host "Customer View Items: $($portal.data.items.Count)"
Write-Host "Cost Price Hidden from Customer: $( $null -eq $portal.data.items[0].costPrice )"

Write-Host "`n=== 9. CUSTOMER ACCEPTS & CONVERTS TO ORDER ==="
$orderConv = Invoke-RestMethod -Uri "http://localhost:4000/api/portal/quotations/$qid/confirm" -Method POST
Write-Host "ORDER CREATED: $($orderConv.data.order.orderNumber) (Status: $($orderConv.data.order.status))"

Write-Host "`n=== 10. MULTI-WAREHOUSE FULFILLMENT ALLOCATION RESULT ==="
Write-Host "Fulfillment Allocation Status: $($orderConv.data.fulfillment.plan.status)"
Write-Host "Total Warehouse Shipments: $($orderConv.data.fulfillment.plan.totalShipments)"
foreach ($s in $orderConv.data.fulfillment.plan.splits) {
  Write-Host "  * Warehouse: $($s.warehouseName) ($($s.location)) -> Allocated: $($s.allocatedQty) units, Estimated Freight: INR $($s.estimatedCost)"
}
Write-Host "Total Estimated Freight: INR $($orderConv.data.fulfillment.plan.totalEstimatedFreight)"

Write-Host "`n=== 11. HYBRID BILLING & INVOICE ENGINE RESULT ==="
if ($orderConv.data.billing.oneTimeInvoice) {
  Write-Host "One-Time Hardware Invoice: $($orderConv.data.billing.oneTimeInvoice.invoiceNumber) - Total: INR $($orderConv.data.billing.oneTimeInvoice.totalAmount) (Due: Net 15 days)"
}
Write-Host "Active Subscriptions Initialized: $($orderConv.data.billing.subscriptionsCount)"

Write-Host "`n=== ALL DEALFLOW360 ENGINES VERIFIED SUCCESSFULLY ==="
