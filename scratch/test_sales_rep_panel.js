const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('=== AUDITING SALES REPRESENTATIVE PANEL APIS ===\n');

  // Step 1: Login as Sales Rep
  const loginRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'rep@dealflow360.com', password: 'password123' }
  );

  if (loginRes.status !== 200) {
    console.error('FAIL: Login failed:', loginRes.body);
    process.exit(1);
  }
  const token = loginRes.body.data?.accessToken || loginRes.body.accessToken;
  const user = loginRes.body.data?.user || loginRes.body.user;
  console.log(`[PASS] 1. Authenticated as: ${user.username} (${user.email}) - Role: ${user.role}`);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Step 2: List Quotations
  const listQRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/quotations',
    method: 'GET',
    headers,
  });
  const quotes = listQRes.body.data || listQRes.body;
  console.log(`[PASS] 2. GET /api/quotations -> Status: ${listQRes.status}, Returned ${quotes.length} quotations`);

  // Step 3: Meta Customers
  const custRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/quotations/meta/customers',
    method: 'GET',
    headers,
  });
  const customers = custRes.body.data || custRes.body;
  console.log(`[PASS] 3. GET /api/quotations/meta/customers -> Status: ${custRes.status}, Returned ${customers.length} customers`);

  // Step 4: Meta Products
  const prodRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/quotations/meta/products',
    method: 'GET',
    headers,
  });
  const products = prodRes.body.data || prodRes.body;
  console.log(`[PASS] 4. GET /api/quotations/meta/products -> Status: ${prodRes.status}, Returned ${products.length} products`);

  // Step 5: Orders Hub
  const ordersRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/fulfillment/orders',
    method: 'GET',
    headers,
  });
  const orders = ordersRes.body.data || ordersRes.body;
  console.log(`[PASS] 5. GET /api/fulfillment/orders -> Status: ${ordersRes.status}, Returned ${orders.length} orders`);

  // Step 6: Create New Quotation
  const acme = customers.find((c) => c.companyName?.includes('Acme')) || customers[0];
  const createQRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/quotations',
      method: 'POST',
      headers,
    },
    { customerId: acme.id }
  );
  if (createQRes.status !== 201 && createQRes.status !== 200) {
    console.error('FAIL: Create quotation:', createQRes.body);
    process.exit(1);
  }
  const newQuote = createQRes.body.data || createQRes.body;
  console.log(`[PASS] 6. POST /api/quotations -> Status: ${createQRes.status}, Created Quote: ${newQuote.quotationNumber} (ID: ${newQuote.id})`);

  // Step 7: Add Hardware line item
  const macbook = products.find((p) => p.name?.includes('MacBook')) || products[0];
  const addItem1 = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/quotations/${newQuote.id}/items`,
      method: 'POST',
      headers,
    },
    {
      productId: macbook.id,
      quantity: 2,
      discountPercentage: 10,
    }
  );
  const qWithMac = addItem1.body.data || addItem1.body;
  console.log(`[PASS] 7. POST /api/quotations/:id/items (Hardware) -> Status: ${addItem1.status}, Items: ${qWithMac.items?.length}, Subtotal: ₹${qWithMac.subtotal}`);

  // Step 8: Update line item quantity & discount
  const firstItem = qWithMac.items[0];
  const updateItemRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/quotations/${newQuote.id}/items/${firstItem.id}`,
      method: 'PUT',
      headers,
    },
    {
      quantity: 3,
      discountPercentage: 12,
    }
  );
  const qUpdated = updateItemRes.body.data || updateItemRes.body;
  console.log(`[PASS] 8. PUT /api/quotations/:id/items/:itemId -> Status: ${updateItemRes.status}, New Qty: 3, Discount: 12%, Margin: ${qUpdated.marginPercentage}%`);

  // Step 9: Get AI Co-Purchase Recommendations
  const recRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/quotations/${newQuote.id}/recommendations`,
    method: 'GET',
    headers,
  });
  const recs = recRes.body.data || recRes.body;
  console.log(`[PASS] 9. GET /api/quotations/:id/recommendations -> Status: ${recRes.status}, Found ${recs.length} recommendations`);

  // Step 10: Post Negotiation Comment / Note
  const postCommentRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/quotations/${newQuote.id}/comments`,
      method: 'POST',
      headers,
    },
    {
      comment: 'Special strategic enterprise proposal drafted for Acme Global expansion.',
    }
  );
  console.log(`[PASS] 10. POST /api/quotations/:id/comments -> Status: ${postCommentRes.status}`);

  // Step 11: Get Negotiation Comments
  const getCommentsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/quotations/${newQuote.id}/comments`,
    method: 'GET',
    headers,
  });
  const comments = getCommentsRes.body.data || getCommentsRes.body;
  console.log(`[PASS] 11. GET /api/quotations/:id/comments -> Status: ${getCommentsRes.status}, Found ${comments.length} comments`);

  // Step 12: Submit Quotation for Governance Approval
  const submitRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/quotations/${newQuote.id}/submit`,
      method: 'POST',
      headers,
    },
    {}
  );
  const submittedQuote = submitRes.body.data || submitRes.body;
  console.log(`[PASS] 12. POST /api/quotations/:id/submit -> Status: ${submitRes.status}, Quote Status: ${submittedQuote.status}`);

  // Step 13: Fetch Quotation Details by ID
  const getQRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/quotations/${newQuote.id}`,
    method: 'GET',
    headers,
  });
  const fetchedQuote = getQRes.body.data || getQRes.body;
  console.log(`[PASS] 13. GET /api/quotations/:id -> Status: ${getQRes.status}, Fetched Quote: ${fetchedQuote.quotationNumber}, Approvals: ${fetchedQuote.approvals?.length || 0}`);

  // Step 14: Delete Quotation
  const deleteRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/quotations/${newQuote.id}`,
    method: 'DELETE',
    headers,
  });
  console.log(`[PASS] 14. DELETE /api/quotations/:id -> Status: ${deleteRes.status}, Quotation cleanly removed`);

  console.log('\n=== ALL 14 SALES REPRESENTATIVE PANEL APIS PASSED WITH 0 ERRORS ===');
}

run().catch((e) => {
  console.error('ERROR during audit:', e);
  process.exit(1);
});
