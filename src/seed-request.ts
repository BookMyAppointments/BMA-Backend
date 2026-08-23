const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hospital = await prisma.hospital.findFirst({
    where: { adminId: null },
    orderBy: { name: 'asc' }
  });

  if (!hospital) {
    console.log('No hospital available without an admin — skipping.');
    return;
  }

  await prisma.request.deleteMany({ where: { hospitalId: hospital.id } });

  const patient = await prisma.user.findUnique({ where: { email: 'patient@test.com' } });

  const request = await prisma.request.create({
    data: {
      userEmail: 'patient@test.com',
      userId: patient?.id,
      expiryTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      hospitalId: hospital.id
    }
  });

  console.log(`Created pending admin request for patient@test.com -> ${hospital.name} (request id: ${request.id})`);
}

main()
  .catch((e: unknown) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

export {};
