const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Find all passenger registrations for day pass type
  const dayPasses = await prisma.passengerRegistration.findMany({
    where: {
      passType: { contains: 'day' }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('\n📋 All Day Pass Applications (newest first):\n');
  
  dayPasses.forEach((pass, index) => {
    console.log(`\n${index + 1}. ID: ${pass.id}`);
    console.log(`   Name: ${pass.passengerName}`);
    console.log(`   Status: ${pass.status}`);
    console.log(`   RFID UID: ${pass.rfidUid || 'null'}`);
    console.log(`   Pass Validity: ${pass.passValidity || 'null'}`);
    console.log(`   Created: ${pass.createdAt}`);
    console.log(`   User ID: ${pass.userId}`);
    console.log('   ---');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
