import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const quote = await prisma.quotation.findUnique({
    where: { id: '8ed5934b-8cc2-4486-9098-b93e7b2c039f' },
    select: {
      id: true,
      quotationNumber: true,
      customerId: true,
      customer: {
        select: {
          id: true,
          name: true,
          companyName: true,
        },
      },
    },
  });

  console.log('Quotation details:');
  console.log(JSON.stringify(quote, null, 2));
  console.log('\nCustomerId type:', typeof quote?.customerId);
  console.log('CustomerId value:', quote?.customerId);
}

main().finally(() => prisma.$disconnect());
