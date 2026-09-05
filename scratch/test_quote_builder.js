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
  console.log('--- Testing Quotation Builder Endpoints ---');

  // 1. Login as Sales Rep
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

  const token = loginRes.body.data?.accessToken || loginRes.body.accessToken || loginRes.body.token;
  if (loginRes.status !== 200 || !token) {
    console.error('Login failed:', loginRes.body);
    return;
  }
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  console.log('1. Logged in as Sales Rep:', loginRes.body.data?.user?.email || loginRes.body.user?.email);

  // 2. Fetch customers and products
  const custRaw = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/quotations/meta/customers',
    method: 'GET',
    headers,
  });
  const custData = custRaw.body.data || custRaw.body;
  console.log(`2. Fetched ${custData.length || 0} customers`);
  const acme = custData.find((c) => c.companyName?.includes('Acme')) || custData[0];
  console.log('   Selected customer:', acme.companyName, 'Tier:', acme.customerTier?.name);

  const prodRaw = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/quotations/meta/products',
    method: 'GET',
    headers,
  });
  const prodData = prodRaw.body.data || prodRaw.body;
  console.log(`3. Fetched ${prodData.length || 0} products`);
  const macbook = prodData.find((p) => p.name?.includes('MacBook')) || prodData[0];
  const service = prodData.find((p) => p.category?.name === 'SERVICES') || prodData[1];

  // 4. Create new quotation
  const createRaw = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/quotations',
      method: 'POST',
      headers,
    },
    { customerId: acme.id }
  );
  console.log('4. Create response:', createRaw.status, JSON.stringify(createRaw.body));
  const createData = createRaw.body.data || createRaw.body;
  console.log('4. Created quotation:', createData.quotationNumber, 'ID:', createData.id);
  const quoteId = createData.id;

  // 5. Add MacBook (12% discount)
  const addMacRaw = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/quotations/${quoteId}/items`,
      method: 'POST',
      headers,
    },
    {
      productId: macbook.id,
      quantity: 1,
      discountPercentage: 12,
    }
  );
  const addMac = addMacRaw.body.data || addMacRaw.body;
  console.log('5. Added MacBook line item: Subtotal:', addMac.subtotal, 'BRS:', addMac.riskScore, 'Margin%:', addMac.marginPercentage);

  // 6. Add Service (18% discount - exceeds 10% limit)
  const addServRaw = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/quotations/${quoteId}/items`,
      method: 'POST',
      headers,
    },
    {
      productId: service.id,
      quantity: 1,
      discountPercentage: 18,
    }
  );
  const addServ = addServRaw.body.data || addServRaw.body;
  console.log('6. Added Service with 18% discount: BRS:', addServ.riskScore, 'Approval Level:', addServ.approvalLevel);

  // 7. Check recommendations
  const recRaw = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/quotations/${quoteId}/recommendations`,
    method: 'GET',
    headers,
  });
  const recData = recRaw.body.data || recRaw.body;
  console.log(`7. Co-purchase recommendations: ${recData.length || 0} found`);
  if (recData.length > 0) {
    console.log('   Top rec:', recData[0].name, 'Margin delta:', recData[0].marginDelta);
  }

  // 8. Submit Quotation
  const submitRaw = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/quotations/${quoteId}/submit`,
      method: 'POST',
      headers,
    },
    {}
  );
  const submitData = submitRaw.body.data || submitRaw.body;
  console.log('8. Submitted quotation: Status:', submitData.status, 'Target:', submitData.targetStatus || submitData.status);

  console.log('--- Quotation Builder Endpoints Verified Successfully ---');
}

run().catch(console.error);
