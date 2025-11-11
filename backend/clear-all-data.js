const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('\n🗑️  Starting data cleanup...\n');

  // Delete all passenger registrations
  const deletedPassengers = await prisma.passengerRegistration.deleteMany({});
  console.log(`✅ Deleted ${deletedPassengers.count} passenger registrations`);

  // Delete all student registrations
  const deletedStudents = await prisma.studentRegistration.deleteMany({});
  console.log(`✅ Deleted ${deletedStudents.count} student registrations`);

  console.log('\n✅ Database cleanup complete!');
  console.log('You can now add new data.\n');
}

main()
  .catch((err) => {
    console.error('❌ Error:', err);
  })
  .finally(() => prisma.$disconnect());
