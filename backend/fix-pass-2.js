const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Fix pass ID 2 - remove passValidity since it doesn't have rfidUid
  const updated = await prisma.passengerRegistration.update({
    where: { id: 2 },
    data: {
      passValidity: null
    }
  });

  console.log('\n✅ Fixed Pass ID 2:');
  console.log(`   Name: ${updated.passengerName}`);
  console.log(`   Status: ${updated.status}`);
  console.log(`   RFID UID: ${updated.rfidUid}`);
  console.log(`   Pass Validity: ${updated.passValidity}`);
  console.log('\n✅ This pass is now in "Awaiting Card Scan" state!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
