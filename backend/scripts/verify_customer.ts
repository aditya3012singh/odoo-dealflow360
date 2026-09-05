import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const customerId = '989e56f8-133e-42ce-8fcd-378e98fabaf2';
  
  console.log('Checking if customer exists...');
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      name: true,
      email: true,
      companyName: true,
      customerTierId: true,
    },
  });

  if (customer) {
    console.log('✓ Customer EXISTS:');
    console.log(JSON.stringify(customer, null, 2));
  } else {
    console.log('✗ Customer DOES NOT EXIST');
  }

  // Also check all customers
  const allCustomers = await prisma.customer.findMany({
    select: {
      id: true,
      name: true,
      companyName: true,
    },
  });

  console.log('\nAll customers in database:');
  allCustomers.forEach((c) => {
    console.log(`- ${c.name} (${c.companyName}): ${c.id}`);
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
  })
  .finally(() => prisma.$disconnect());
