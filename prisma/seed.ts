import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  await prisma.tenant.upsert({
    where: { id: 'RISTO_DEMO' },
    update: {
      name: 'Trattoria Demo',
      giftLabel: 'calice di vino',
      defaultLanguage: 'it',
    },
    create: {
      id: 'RISTO_DEMO',
      name: 'Trattoria Demo',
      giftLabel: 'calice di vino',
      defaultLanguage: 'it',
    },
  });
}

main().then(() => prisma.$disconnect()).catch((e) => {
  console.error(e);
  return prisma.$disconnect().finally(() => process.exit(1));
});

