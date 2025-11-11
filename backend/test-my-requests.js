async function testMyRequests() {
  try {
    // Login first to get token
    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'passenger@smartbus.local',
        password: 'passenger123'
      })
    });
    
    const loginData = await loginRes.json();
    console.log('✅ Login successful:', loginData.user?.email);
    
    const token = loginData.token;
    
    // Get my requests
    const myRequestsRes = await fetch('http://localhost:4000/api/passenger/my-requests', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const myRequestsData = await myRequestsRes.json();
    
    console.log('\n📋 My Requests Response:\n');
    console.log(`Total applications: ${myRequestsData.registrations?.length || 0}\n`);
    
    if (myRequestsData.registrations) {
      myRequestsData.registrations.forEach((app, i) => {
        const isPendingCardScan = app.status === 'approved' && !app.rfidUid && !app.passValidity;
        const isDeleted = app.status === 'approved' && !app.rfidUid && app.passValidity;
        
        const status = isPendingCardScan ? '🎫 PENDING CARD SCAN' :
                      isDeleted ? '⏰ DELETED' :
                      app.status === 'approved' ? '✅ APPROVED' :
                      app.status === 'declined' ? '❌ DECLINED' : '⏳ PENDING';
        
        console.log(`${i + 1}. ID: ${app.id} - ${app.passType} - ${status}`);
        console.log(`   Name: ${app.passengerName}`);
        console.log(`   Status: ${app.status}`);
        console.log(`   RFID UID: ${app.rfidUid || 'null'}`);
        console.log(`   Pass Validity: ${app.passValidity || 'null'}`);
        console.log(`   Created: ${app.createdAt}`);
        console.log('');
      });
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testMyRequests();
