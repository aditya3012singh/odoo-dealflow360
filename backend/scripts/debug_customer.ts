import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get latest quotation
  const quote = await prisma.quotation.findFirst({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      quotationNumber: true,
      customerId: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
        },
      },
    },
  });

  console.log('=== LATEST QUOTATION ===');
  console.log(JSON.stringify(quote, null, 2));
  console.log('\nCustomerId from quotation:', quote?.customerId);
  console.log('CustomerId type:', typeof quote?.customerId);

  if (quote) {
    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: quote.customerId },
    });
    console.log('\nCustomer exists in DB:', !!customer);

    // Try to find customer with portal token
    const customerWithPortal = await prisma.customer.findFirst({
      where: {
        portalToken: { not: null },
        portalEnabled: true,
      },
      select: {
        id: true,
        name: true,
        companyName: true,
        portalToken: true,
      },
    });

    console.log('\n=== PORTAL CUSTOMER ===');
    console.log(JSON.stringify(customerWithPortal, null, 2));

    // Check if they match
    console.log('\nDo they match?', quote.customerId === customerWithPortal?.id);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
