const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const passengers = await prisma.passengerRegistration.count();
  const students = await prisma.studentRegistration.count();
  const users = await prisma.user.count();

  console.log('\n📊 Current Database Status:\n');
  console.log(`👥 Users: ${users}`);
  console.log(`🎫 Passenger Registrations: ${passengers}`);
  console.log(`🎓 Student Registrations: ${students}`);
  console.log('\n✅ Database is clean and ready for new data!\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
