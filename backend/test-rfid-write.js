#!/usr/bin/env node

/**
 * RFID Card Write Test Script
 * Directly tests writing to a real EM-18 RFID card on COM5
 * 
 * Usage: node test-rfid-write.js
 */

const { SerialPort } = require('serialport');

const SERIAL_PORT = 'COM5';
const BAUD_RATE = 9600;

// Sample payload to write
const testPayload = JSON.stringify({
  id: 'BUS-TEST-001',
  name: 'Test Passenger',
  type: 'monthly',
  valid: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString(),
  email: 'test@example.com',
  phone: '+919876543210',
  issued: new Date().toISOString()
});

console.log('🔌 RFID Card Write Test Script');
console.log('==============================');
console.log(`Serial Port: ${SERIAL_PORT}`);
console.log(`Baud Rate: ${BAUD_RATE}`);
console.log(`Payload to write:\n${testPayload}\n`);

async function writeToCard() {
  try {
    const port = new SerialPort({ 
      path: SERIAL_PORT, 
      baudRate: BAUD_RATE 
    });

    return new Promise((resolve, reject) => {
      let receivedData = '';

      port.on('open', () => {
        console.log('✅ Serial port opened successfully!');
        console.log('📝 Writing payload to RFID card...');
        
        port.write(testPayload + '\n', (err) => {
          if (err) {
            console.error('❌ Error writing to port:', err);
            port.close();
            reject(err);
          } else {
            console.log('✍️ Payload sent to card.');
            console.log('⏳ Waiting for card response...');
          }
        });
      });

      port.on('data', (data) => {
        receivedData += data.toString();
        console.log('📨 Data received from card:', receivedData.trim());
        
        if (receivedData.includes('\r') || receivedData.length > 0) {
          const uid = receivedData.trim();
          console.log(`\n✅ RFID Card UID: ${uid}`);
          port.close();
          resolve(uid);
        }
      });

      port.on('error', (err) => {
        console.error('❌ Serial port error:', err.message);
        reject(err);
      });

      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        console.log('\n⏰ Timeout: No response from card after 10 seconds');
        console.log('💡 Make sure an RFID card is close to the EM-18 reader!');
        port.close();
        reject(new Error('RFID write timeout'));
      }, 10000);

      // Clear timeout on success
      port.on('close', () => clearTimeout(timeout));
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  }
}

// Run the test
writeToCard()
  .then((uid) => {
    console.log('\n🎉 SUCCESS! Card written successfully.');
    console.log(`Card UID: ${uid}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ FAILED:', err.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Verify EM-18 reader is connected to COM5');
    console.log('   2. Ensure RFID card is near the reader');
    console.log('   3. Check that serialport package is installed');
    console.log('   4. Try: Get-PnpDevice -PresentOnly | Where-Object {$_.Class -eq "Ports"}');
    process.exit(1);
  });
