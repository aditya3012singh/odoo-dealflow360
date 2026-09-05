import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      name: true,
      companyName: true,
      portalEnabled: true,
      portalToken: true,
    },
  });

  console.log('Customers in database:');
  console.log(JSON.stringify(customers, null, 2));
}

main()
  .finally(() => prisma.$disconnect());
