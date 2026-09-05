import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const quotationId = 'c60ac316-898e-4af7-b896-d190d5b3763e';
  const customerId = '989e56f8-133e-42ce-8fcd-378e98fabaf2';

  console.log('=== TESTING NEGOTIATION REQUEST CREATE ===');
  console.log('QuotationId:', quotationId);
  console.log('CustomerId:', customerId);

  // Check if quotation exists
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    select: { id: true, customerId: true },
  });
  console.log('\n✓ Quotation exists:', !!quotation);
  console.log('  Quotation customerId:', quotation?.customerId);

  // Check if customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, name: true },
  });
  console.log('\n✓ Customer exists:', !!customer);
  console.log('  Customer name:', customer?.name);

  // Check for existing negotiations
  const existing = await prisma.negotiationRequest.findMany({
    where: { quotationId },
    select: { id: true, customerId: true, status: true, createdAt: true },
  });
  console.log('\n=== EXISTING NEGOTIATIONS ===');
  console.log(JSON.stringify(existing, null, 2));

  // Try to create a negotiation request
  try {
    console.log('\n=== ATTEMPTING TO CREATE NEGOTIATION REQUEST ===');
    const negotiation = await prisma.negotiationRequest.create({
      data: {
        quotationId,
        customerId,
        requestedDiscount: 22,
        message: 'Test counter-offer',
        status: 'OPEN',
      },
    });
    console.log('✓ SUCCESS! Created negotiation:', negotiation.id);
  } catch (error: any) {
    console.error('✗ FAILED:', error.message);
    console.error('\nFull error:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
