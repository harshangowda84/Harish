const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Get all users
  const users = await prisma.user.findMany();
  
  console.log('\n👥 All Users:\n');
  users.forEach(u => {
    console.log(`User ID: ${u.id} - Email: ${u.email} - Role: ${u.role}`);
  });

  // Get all day passes
  const dayPasses = await prisma.passengerRegistration.findMany({
    where: {
      passType: { contains: 'day' }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('\n\n📋 Day Pass Applications (newest first):\n');
  
  for (const pass of dayPasses) {
    const user = users.find(u => u.id === pass.userId);
    const isPendingCardScan = pass.status === 'approved' && !pass.rfidUid && !pass.passValidity;
    const isDeleted = pass.status === 'approved' && !pass.rfidUid && pass.passValidity;
    
    const status = isPendingCardScan ? '🎫 PENDING CARD SCAN' : 
                   isDeleted ? '⏰ DELETED' :
                   pass.status === 'approved' ? '✅ ACTIVE' : 
                   pass.status === 'declined' ? '❌ DECLINED' : '⏳ PENDING';
    
    console.log(`\nID: ${pass.id} - ${status}`);
    console.log(`   User: ${user?.email || 'Unknown'} (ID: ${pass.userId})`);
    console.log(`   Name: ${pass.passengerName}`);
    console.log(`   Status: ${pass.status}`);
    console.log(`   RFID UID: ${pass.rfidUid || 'null'}`);
    console.log(`   Pass Validity: ${pass.passValidity || 'null'}`);
    console.log(`   Created: ${pass.createdAt}`);
    console.log('   ---');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
