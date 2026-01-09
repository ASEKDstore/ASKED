import { PrismaClient, OrderChannel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting order number backfill...');

  // Initialize counters if they don't exist
  await prisma.orderCounter.upsert({
    where: { channel: 'AS' },
    update: {},
    create: { channel: 'AS', value: 0 },
  });

  await prisma.orderCounter.upsert({
    where: { channel: 'LAB' },
    update: {},
    create: { channel: 'LAB', value: 0 },
  });

  // Process AS orders (default channel)
  const asOrders = await prisma.order.findMany({
    where: {
      channel: 'AS',
      number: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`📦 Found ${asOrders.length} AS orders to backfill`);

  let asCounter = 0;
  for (const order of asOrders) {
    asCounter++;
    const number = `№${asCounter.toString().padStart(5, '0')}/AS`;
    
    await prisma.order.update({
      where: { id: order.id },
      data: {
        seq: asCounter,
        number,
      },
    });

    if (asCounter % 100 === 0) {
      console.log(`  Processed ${asCounter} AS orders...`);
    }
  }

  // Update AS counter
  if (asCounter > 0) {
    await prisma.orderCounter.update({
      where: { channel: 'AS' },
      data: { value: asCounter },
    });
  }

  // Process LAB orders
  const labOrders = await prisma.order.findMany({
    where: {
      channel: 'LAB',
      number: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`📦 Found ${labOrders.length} LAB orders to backfill`);

  let labCounter = 0;
  for (const order of labOrders) {
    labCounter++;
    const number = `№${labCounter.toString().padStart(5, '0')}/LAB`;
    
    await prisma.order.update({
      where: { id: order.id },
      data: {
        seq: labCounter,
        number,
      },
    });

    if (labCounter % 100 === 0) {
      console.log(`  Processed ${labCounter} LAB orders...`);
    }
  }

  // Update LAB counter
  if (labCounter > 0) {
    await prisma.orderCounter.update({
      where: { channel: 'LAB' },
      data: { value: labCounter },
    });
  }

  console.log(`✅ Backfill complete!`);
  console.log(`   AS orders: ${asCounter}`);
  console.log(`   LAB orders: ${labCounter}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

