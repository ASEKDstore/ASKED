import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create categories
  const category1 = await prisma.category.upsert({
    where: { slug: 't-shirts' },
    update: {},
    create: {
      name: 'Футболки',
      slug: 't-shirts',
      sort: 1,
    },
  });

  const category2 = await prisma.category.upsert({
    where: { slug: 'hoodies' },
    update: {},
    create: {
      name: 'Худи',
      slug: 'hoodies',
      sort: 2,
    },
  });

  console.log('✅ Categories created');

  // Create tags
  const tag1 = await prisma.tag.upsert({
    where: { slug: 'new' },
    update: {},
    create: {
      name: 'Новинка',
      slug: 'new',
    },
  });

  const tag2 = await prisma.tag.upsert({
    where: { slug: 'popular' },
    update: {},
    create: {
      name: 'Популярное',
      slug: 'popular',
    },
  });

  const tag3 = await prisma.tag.upsert({
    where: { slug: 'sale' },
    update: {},
    create: {
      name: 'Распродажа',
      slug: 'sale',
    },
  });

  console.log('✅ Tags created');

  // Create products
  const product1 = await prisma.product.create({
    data: {
      title: 'Футболка ASKED Basic',
      description: 'Классическая футболка с логотипом ASKED. 100% хлопок, комфортная посадка.',
      price: 299900, // 2999 руб в копейках
      currency: 'RUB',
      status: 'ACTIVE',
      stock: 50,
      categories: {
        create: {
          categoryId: category1.id,
        },
      },
      tags: {
        create: [
          { tagId: tag1.id },
          { tagId: tag2.id },
        ],
      },
      images: {
        create: [
          {
            url: 'https://via.placeholder.com/800x800?text=ASKED+Basic+T-Shirt',
            sort: 0,
          },
          {
            url: 'https://via.placeholder.com/800x800?text=ASKED+Basic+T-Shirt+Back',
            sort: 1,
          },
        ],
      },
    },
  });

  const product2 = await prisma.product.create({
    data: {
      title: 'Худи ASKED Premium',
      description: 'Теплое худи премиум качества с капюшоном. Идеально для прохладной погоды.',
      price: 599900, // 5999 руб в копейках
      currency: 'RUB',
      status: 'ACTIVE',
      stock: 30,
      categories: {
        create: {
          categoryId: category2.id,
        },
      },
      tags: {
        create: [
          { tagId: tag1.id },
          { tagId: tag2.id },
        ],
      },
      images: {
        create: [
          {
            url: 'https://via.placeholder.com/800x800?text=ASKED+Premium+Hoodie',
            sort: 0,
          },
        ],
      },
    },
  });

  const product3 = await prisma.product.create({
    data: {
      title: 'Футболка ASKED Logo',
      description: 'Футболка с крупным логотипом ASKED. Яркий дизайн, качественный принт.',
      price: 349900, // 3499 руб в копейках
      currency: 'RUB',
      status: 'ACTIVE',
      stock: 25,
      categories: {
        create: {
          categoryId: category1.id,
        },
      },
      tags: {
        create: [
          { tagId: tag2.id },
          { tagId: tag3.id },
        ],
      },
      images: {
        create: [
          {
            url: 'https://via.placeholder.com/800x800?text=ASKED+Logo+T-Shirt',
            sort: 0,
          },
        ],
      },
    },
  });

  const product4 = await prisma.product.create({
    data: {
      title: 'Худи ASKED Classic',
      description: 'Классическое худи с минималистичным дизайном. Универсальный вариант.',
      price: 549900, // 5499 руб в копейках
      currency: 'RUB',
      status: 'ACTIVE',
      stock: 40,
      categories: {
        create: {
          categoryId: category2.id,
        },
      },
      tags: {
        create: [
          { tagId: tag2.id },
        ],
      },
      images: {
        create: [
          {
            url: 'https://via.placeholder.com/800x800?text=ASKED+Classic+Hoodie',
            sort: 0,
          },
        ],
      },
    },
  });

  const product5 = await prisma.product.create({
    data: {
      title: 'Футболка ASKED Limited',
      description: 'Ограниченная серия футболок ASKED. Эксклюзивный дизайн, ограниченный тираж.',
      price: 399900, // 3999 руб в копейках
      currency: 'RUB',
      status: 'ACTIVE',
      stock: 15,
      categories: {
        create: {
          categoryId: category1.id,
        },
      },
      tags: {
        create: [
          { tagId: tag1.id },
          { tagId: tag3.id },
        ],
      },
      images: {
        create: [
          {
            url: 'https://via.placeholder.com/800x800?text=ASKED+Limited+T-Shirt',
            sort: 0,
          },
          {
            url: 'https://via.placeholder.com/800x800?text=ASKED+Limited+Detail',
            sort: 1,
          },
        ],
      },
    },
  });

  console.log('✅ Products created');
  console.log(`   - ${product1.title}`);
  console.log(`   - ${product2.title}`);
  console.log(`   - ${product3.title}`);
  console.log(`   - ${product4.title}`);
  console.log(`   - ${product5.title}`);

  console.log('🌱 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

