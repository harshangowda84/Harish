import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with default users...');

  // Hash password - same for all demo users
  const passwordHash = await bcrypt.hash('password', 10);

  // Delete existing users (for clean seed)
  await prisma.user.deleteMany({});
  console.log('✅ Cleared existing users');

  // Create default users with credentials shown in frontend demo pages
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@smartbus.local',
        password: passwordHash,
        role: 'admin',
        collegeId: null,
      },
    }),
    prisma.user.create({
      data: {
        name: 'College Staff',
        email: 'college@smartbus.local',
        password: passwordHash,
        role: 'college',
        collegeId: 1,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Passenger User',
        email: 'passenger@smartbus.local',
        password: passwordHash,
        role: 'passenger',
        collegeId: null,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Conductor',
        email: 'conductor@smartbus.local',
        password: passwordHash,
        role: 'conductor',
        collegeId: null,
      },
    }),
  ]);

  console.log('✅ Created default users:');
  users.forEach((user) => {
    console.log(`   📧 ${user.email} (${user.role})`);
  });

  console.log('\n🔐 Demo Credentials (shown in each login page):');
  console.log('   👤 Admin: admin@smartbus.local / password');
  console.log('   🏢 College: college@smartbus.local / password');
  console.log('   🎫 Passenger: passenger@smartbus.local / password');
  console.log('   🚌 Conductor: conductor@smartbus.local / password');

  console.log('\n✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
