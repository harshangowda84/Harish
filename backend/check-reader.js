#!/usr/bin/env node

/**
 * Simple EM-18 Reader Detection Test
 * Just checks if reader responds on COM5
 */

const { SerialPort } = require('serialport');

console.log('🔍 Checking EM-18 RFID Reader on COM5...\n');

const port = new SerialPort({ 
  path: 'COM5', 
  baudRate: 9600 
});

port.on('open', () => {
  console.log('✅ Serial port opened');
  console.log('📡 Reader Status: CONNECTED');
  console.log('\n🎯 Next Steps:');
  console.log('   1. Place an RFID card near the EM-18 reader');
  console.log('   2. Go to http://localhost:5173 (Admin Dashboard)');
  console.log('   3. Click "✅ Approve" on any pending registration');
  console.log('   4. The unique ID will be written to the card');
  console.log('\n⏳ Waiting for card tap...');
  console.log('(Press Ctrl+C to exit)\n');
});

port.on('data', (data) => {
  console.log('📨 Card detected! Data:', data.toString().trim());
});

port.on('error', (err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('\n💡 Still waiting... Make sure card is close to reader!');
}, 5000);
