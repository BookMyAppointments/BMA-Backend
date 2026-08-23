const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Test@1234', 10);

  await prisma.user.deleteMany({
    where: { email: { in: ['superadmin@test.com', 'admin@test.com', 'patient@test.com'] } }
  });

  const superadmin = await prisma.user.create({
    data: {
      email: 'superadmin@test.com',
      password,
      name: 'Super Admin',
      phone: '+919999900001',
      role: 'SUPERADMIN',
      verified: true
    }
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password,
      name: 'Hospital Admin',
      phone: '+919999900002',
      role: 'ADMIN',
      verified: true
    }
  });

  const patient = await prisma.user.create({
    data: {
      email: 'patient@test.com',
      password,
      name: 'Test Patient',
      phone: '+919999900003',
      role: 'NORMAL',
      verified: true
    }
  });

  const hospital = await prisma.hospital.findFirst();
  if (hospital) {
    await prisma.hospital.update({
      where: { id: hospital.id },
      data: { adminId: admin.id }
    });
    console.log(`Assigned admin@test.com as admin of hospital: ${hospital.name}`);
  }

  console.log('Seeded test users:');
  console.log(' SUPERADMIN -> superadmin@test.com / Test@1234');
  console.log(' ADMIN      -> admin@test.com / Test@1234');
  console.log(' NORMAL     -> patient@test.com / Test@1234');
}

main()
  .catch((e: unknown) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

export {};
